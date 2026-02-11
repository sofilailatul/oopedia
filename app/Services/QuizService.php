<?php

namespace App\Services;

use App\Models\QuizAttemptModel;
use App\Models\QuizQuestionModel;
use App\Models\UserQuizAnswerModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class QuizService
{
    public function validateAndCreateAttempt(int $userId, int $quizId, array $cfg = [])
    {
        // ❌ Rule: melewati batas waktu end_at => tidak boleh mengerjakan
        $quiz = \App\Models\QuizModel::findOrFail($quizId);
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

        $questions = QuizQuestionModel::query()
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

            $questions = QuizQuestionModel::query()
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
}
