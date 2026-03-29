<?php

namespace App\Services;

use App\Models\QuizAttemptModel;
use App\Models\QuizQuestionsModel;
use App\Models\QuizModel;
use App\Models\UserQuizAnswerModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class QuizService
{
    public function validateAndCreateAttempt(int $userId, int $quizId, array $cfg = [])
    {
        // Ambil quiz beserta informasi kelas
        $quiz = QuizModel::findOrFail($quizId);

        // ✅ Rule: materi & latihan terkait di kelas tersebut harus sudah selesai
        $this->ensureMaterialAndPracticeCompleted($userId, $quiz);

        // ❌ Rule: melewati batas waktu end_at => tidak boleh mengerjakan
        if ($quiz->end_at && now()->gt($quiz->end_at)) {
            throw new \Exception('Batas Pengerjaan sudah Habis, Hubungi Dosen yang bersangkutan');
        }

        // ❌ Rule: sudah pernah FINISH => tidak boleh attempt lagi
        if ($this->hasFinishedAttempt($userId, $quizId)) {
            throw new \Exception('Kuis ini hanya boleh dikerjakan satu kali.');
        }

        // ✅ Kalau ada attempt yang belum selesai => lanjutkan attempt itu
        $active = $this->getActiveAttempt($userId, $quizId);
        if ($active) {
            return $active;
        }

        // ✅ Kalau belum ada sama sekali => buat attempt baru
        return $this->createAttempt($userId, $quizId, $cfg);
    }

    /**
     * Pastikan semua materi yang diujikan di kuis sudah:
     * - Dibaca (read_at tidak null)
     * - Latihan soal (jika ada) sudah selesai untuk materi tersebut
     */
    private function ensureMaterialAndPracticeCompleted(int $userId, QuizModel $quiz): void
    {
        // Gunakan class_id langsung dari kuis
        $classId = $quiz->class_id;

        // Jika kuis terikat ke kelas tertentu, pastikan user memang anggota kelas itu
        if ($classId) {
            $inClass = DB::table('class_user')
                ->where('user_id', $userId)
                ->where('class_id', $classId)
                ->exists();

            if (!$inClass) {
                throw new \Exception('Kuis ini tidak tersedia untuk kelasmu.');
            }
        }

        // Ambil semua materi yang terhubung dengan kuis ini
        $materialIds = DB::table('quiz_materials')
            ->where('quizzes_id', $quiz->id)
            ->pluck('material_id');

        if ($materialIds->isEmpty()) {
            // Tidak ada materi yang dipetakan ke kuis ini => tidak ada syarat tambahan
            return;
        }

        // Progress baca + latihan per materi untuk user
        $progressQuery = DB::table('user_progress')
            ->where('user_id', $userId)
            ->whereIn('material_id', $materialIds);

        // Jika kuis terikat ke kelas, batasi progress di kelas tersebut
        if ($classId) {
            $progressQuery->where('class_id', $classId);
        }

        $progress = $progressQuery
            ->select('material_id', 'read_at', 'completed_practice_at')
            ->get()
            ->keyBy('material_id');

        // Cek apakah materi punya latihan
        $materialsWithPractice = DB::table('practices')
            ->whereIn('material_id', $materialIds)
            ->select('material_id')
            ->distinct()
            ->pluck('material_id')
            ->flip();

        foreach ($materialIds as $materialId) {
            $p = $progress->get($materialId);

            $hasRead = $p && !is_null($p->read_at);
            $hasPractice = $materialsWithPractice->has($materialId);
            $practiceDone = $hasPractice ? ($p && !is_null($p->completed_practice_at)) : true;

            if (!($hasRead && $practiceDone)) {
                throw new \Exception('Kuis ini baru bisa dikerjakan setelah kamu membaca materi dan menyelesaikan semua latihan soal (easy, normal, hard) yang terkait.');
            }
        }
    }

    private function hasFinishedAttempt(int $userId, int $quizId): bool
    {
        return QuizAttemptModel::query()
            ->where('user_id', $userId)
            ->where('quizzes_id', $quizId)
            ->whereNotNull('finished_at') 
            ->exists();
    }

    private function getActiveAttempt(int $userId, int $quizId)
    {
        return QuizAttemptModel::query()
            ->where('user_id', $userId)
            ->where('quizzes_id', $quizId)
            ->whereNull('finished_at')
            ->latest('created_at')
            ->first();
    }

    private function createAttempt(int $userId, int $quizId, array $cfg = [])
    {
        $attempt = QuizAttemptModel::create([
            'user_id'     => $userId,
            'quizzes_id'  => $quizId,
            'started_at'  => now(),
            'finished_at' => null,
            'total_score' => 0,
        ]);

        session([
            "quiz_attempt_cfg_{$attempt->id}" => [
                'duration_seconds' => (int)($cfg['duration_seconds'] ?? 18 * 60),
                'question_count'   => (int)($cfg['question_count'] ?? 10),
                'title'            => $cfg['title'] ?? null,
            ],
        ]);

        return $attempt;
    }

    public function getAttemptDetail(int $attemptId)
    {
        $attempt = QuizAttemptModel::findOrFail($attemptId);

        if ($attempt->user_id !== Auth::id()) {
            abort(403);
        }

        $cfg = session("quiz_attempt_cfg_{$attemptId}", [
            'duration_seconds' => 18 * 60,
            'question_count' => 10,
            'title' => null,
        ]);

        $questions = QuizQuestionsModel::query()
            ->join('quiz_map', 'quiz_map.quiz_question_id', '=', 'quiz_questions.id')
            ->where('quiz_map.quiz_id', $attempt->quizzes_id)
            ->select('quiz_questions.*', 'quiz_map.points')
            ->with('options')
            ->inRandomOrder()
            ->get();

        $savedAnswers = UserQuizAnswerModel::query()
            ->where('quiz_attempts_id', $attemptId)
            ->get()
            ->keyBy('quiz_questions_id');

        return [
            'attempt' => $attempt,
            'cfg' => $cfg,
            'questions' => $questions,
            'savedAnswers' => $savedAnswers,
        ];
    }

    public function submitAnswers(int $attemptId, array $answersPayload)
    {
        $attempt = QuizAttemptModel::findOrFail($attemptId);

        if ($attempt->user_id !== Auth::id()) {
            abort(403);
        }

        if (!is_null($attempt->finished_at)) {
            throw new \Exception('Kuis sudah selesai disubmit.');
        }

        return DB::transaction(function () use ($attempt, $answersPayload) {
            $questionIds = array_map('intval', array_keys($answersPayload));

            $questions = QuizQuestionsModel::query()
                ->join('quiz_map', 'quiz_map.quiz_question_id', '=', 'quiz_questions.id')
                ->where('quiz_map.quiz_id', $attempt->quizzes_id)
                ->whereIn('quiz_questions.id', $questionIds)
                ->select('quiz_questions.*', 'quiz_map.points')
                ->with('options')
                ->get()
                ->keyBy('id');

            $totalScore = 0;

            foreach ($answersPayload as $qid => $a) {
                $q = $questions->get((int)$qid);
                if (!$q) continue;

                $correctOpt = $q->options->firstWhere('is_correct', 1);
                $isCorrect = $correctOpt && ((int)$a['option_id'] === (int)$correctOpt->id);

                if ($isCorrect) {
                    $totalScore += (int) $q->points; 
                }

                UserQuizAnswerModel::updateOrCreate(
                    [
                        'quiz_attempts_id' => $attempt->id,
                        'quiz_questions_id' => $q->id,
                    ],
                    [
                        'quiz_options_id' => $a['option_id'] ?? null,
                        'is_correct' => $isCorrect ? 1 : 0,
                    ]
                );
            }

            $attempt->update([
                'finished_at' => now(),
                'total_score' => $totalScore,
            ]);

            return $attempt;
        });
    }

    public function getQuizzesForLecturer($lecturerId)
    {
        return QuizModel::query()
            ->where('created_by', $lecturerId)
            ->with('class')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($quiz) {
                return [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'class_name' => $quiz->class?->class_name ?? 'Unknown Class',
                    'total_questions' => $quiz->questions()->count(),
                    'duration' => $quiz->duration,
                    'passing_score' => $quiz->passing_score,
                    'start_at' => $quiz->start_at,
                    'end_at' => $quiz->end_at,
                ];
            });
    }
}
