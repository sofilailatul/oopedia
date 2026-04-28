<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

use App\Models\MaterialModel as Material;
use App\Models\UserProgressModel as UserProgress;
use App\Models\PracticeModel as Practice;
use App\Models\PracticeAttemptModel as PracticeAttempt;
use App\Models\QuizModel as Quiz;
use App\Models\QuizAttemptModel as QuizAttempt;
use App\Models\QuizMapModel as QuizMap;

class ProgressService
{
    public function syncMaterial(int $userId, int $materialId, ?int $classId): array
    {
        return DB::transaction(function () use ($userId, $materialId, $classId) {

            $material = Material::query()
                ->select('id', 'order_number')
                ->where('id', $materialId)
                ->firstOrFail();

            // Build query dengan handling null class_id
            $progressQuery = UserProgress::query()
                ->where('user_id', $userId)
                ->where('material_id', $materialId);

            if (is_null($classId)) {
                $progressQuery->whereNull('class_id');
            } else {
                $progressQuery->where('class_id', $classId);
            }

            $progress = $progressQuery->first();

            // Jika belum ada progress, create baru
            if (!$progress) {
                $progress = UserProgress::create([
                    'user_id' => $userId,
                    'material_id' => $materialId,
                    'class_id' => $classId, 
                    'status' => 'locked',
                    'read_at' => null,
                ]);
            }

            // =========================
            // FASE 1: BACA MATERI
            // =========================
            $readDone = !is_null($progress->read_at);

            // =========================
            // FASE 2: PRACTICE - semua difficulty lulus
            // =========================
            $practiceIds = Practice::query()
                ->where('material_id', $materialId)
                ->pluck('id');

            $hasPractice = $practiceIds->isNotEmpty();

            if ($practiceIds->isEmpty()) {
                // Jika tidak ada practice untuk materi ini, tandai tidak ada latihan
                // Progress latihan tidak dianggap "Selesai" agar tidak membingungkan pengguna
                $practiceDone = false;
            } else {
                // Hitung berapa practice yang sudah lulus
                $passedPracticeCount = PracticeAttempt::query()
                    ->where('user_id', $userId)
                    ->whereIn('practices_id', $practiceIds)
                    ->where('is_passed', 1)
                    ->distinct('practices_id')
                    ->count('practices_id');

                // Practice selesai jika semua practice sudah lulus
                $practiceDone = ($passedPracticeCount === $practiceIds->count());
            }

            // Completed jika baca DAN practice selesai
            $completed = $readDone && $practiceDone;

            // Tentukan status
            if ($completed) {
                $newStatus = 'completed';
            } else {
                // Cek apakah user sudah mulai aktivitas (baca atau practice)
                $hasAnyAttempt =
                    $readDone ||
                    (!$practiceIds->isEmpty()
                        && PracticeAttempt::where('user_id', $userId)
                            ->whereIn('practices_id', $practiceIds)
                            ->exists());

                $newStatus = $hasAnyAttempt
                    ? 'in_progress'
                    : ($progress->status === 'locked' ? 'locked' : 'unlocked');
            }

            // Update status
            $progress->status = $newStatus;

            // Update timestamp completed_practice_at
            if ($completed) {
                if (is_null($progress->completed_practice_at)) {
                    $progress->completed_practice_at = now();
                }
            } else {
                $progress->completed_practice_at = null;
            }

            $progress->save();

            // =========================
            // UNLOCK materi berikutnya jika completed
            // =========================
            $nextUnlockedMaterialId = null;

            if ($completed) {
                $nextMaterial = Material::query()
                    ->select('id', 'order_number')
                    ->where('order_number', '>', $material->order_number)
                    ->orderBy('order_number')
                    ->first();

                if ($nextMaterial) {
                    // Query next progress dengan handling null class_id
                    $nextQuery = UserProgress::query()
                        ->where('user_id', $userId)
                        ->where('material_id', $nextMaterial->id);

                    if (is_null($classId)) {
                        $nextQuery->whereNull('class_id');
                    } else {
                        $nextQuery->where('class_id', $classId);
                    }

                    $nextProgress = $nextQuery->first();

                    // ❌ BUG FIX: Kondisi if salah, harusnya cek $nextProgress bukan $nextMaterial
                    if (!$nextProgress) {
                        $nextProgress = UserProgress::create([
                            'user_id' => $userId,
                            'material_id' => $nextMaterial->id,
                            'class_id' => $classId,
                            'status' => 'locked',
                            'read_at' => null,
                        ]);
                    }

                    // Unlock materi berikutnya jika masih locked
                    if ($nextProgress->status === 'locked') {
                        $nextProgress->status = 'unlocked';
                        // ❌ HAPUS BARIS INI: is_unlocked tidak ada di tabel
                        // $nextProgress->is_unlocked = true;
                        $nextProgress->save();
                    }

                    $nextUnlockedMaterialId = $nextMaterial->id;
                }
            }

            // Check quiz availability
            $quizAvailable = $this->checkQuizAvailability($userId, $materialId, $classId);

            return [
                'material_id' => $materialId,
                'status' => $progress->status,
                'readDone' => $readDone,
                'practiceDone' => $practiceDone,
                'has_practice' => $hasPractice,
                'completed' => $completed,
                'next_unlocked_material_id' => $nextUnlockedMaterialId,
                'quiz_available' => $quizAvailable,
                'quiz_completed' => !is_null($progress->completed_quiz_at),
                'completed_quiz_at' => $progress->completed_quiz_at,
            ];
        });
    }

    /**
     * Mark read saat user selesai membaca materi
     */
    public function markRead(int $userId, int $materialId, ?int $classId): array
    {
        // Build query dengan handling null class_id
        $query = UserProgress::query()
            ->where('user_id', $userId)
            ->where('material_id', $materialId);

        if (is_null($classId)) {
            $query->whereNull('class_id');
        } else {
            $query->where('class_id', $classId);
        }

        $progress = $query->first();

        // Update atau create progress dengan read_at
        if ($progress) {
            $progress->read_at = now();

            // Jika mahasiswa diwajibkan baca ulang materi (setelah 3x remedial gagal),
            // reset mode ke focused_remedial agar bisa lanjut latihan Easy lagi
            // tanpa harus mengulang pretest.
            if ($progress->current_mode === 'repeat_material') {
                $progress->current_mode       = 'focused_remedial';
                $progress->current_level      = $progress->current_level ?? 'easy';
                $progress->easy_remedial_count = 0; // reset hitungan remedial
                $progress->next_action        = 'repeat_easy_subtopic';
            }

            $progress->save();
        } else {
            UserProgress::create([
                'user_id' => $userId,
                'material_id' => $materialId,
                'class_id' => $classId,
                'status' => 'unlocked',
                'read_at' => now(),
            ]);
        }

        // Sync untuk update status
        return $this->syncMaterial($userId, $materialId, $classId);
    }

    private function isMaterialQuizPassed(int $userId, int $materialId, int $classId): bool
    {
        $quizIds = QuizMap::query()
            ->join('quiz_questions', 'quiz_questions.id', '=', 'quiz_map.quiz_question_id')
            ->where('quiz_questions.material_id', $materialId)
            ->pluck('quiz_map.quizzes_id')
            ->unique()
            ->values();

        if ($quizIds->isEmpty()) return true;

        $quizzes = Quiz::query()
            ->where('class_id', $classId)
            ->whereIn('id', $quizIds)
            ->get(['id', 'passing_score']);

        if ($quizzes->isEmpty()) return false;

        foreach ($quizzes as $quiz) {
            $passed = QuizAttempt::query()
                ->where('user_id', $userId)
                ->where('quizzes_id', $quiz->id)
                ->where('total_score', '>=', $quiz->passing_score)
                ->exists();

            if ($passed) return true;
        }

        return false;
    }

    private function hasAnyRelevantQuizAttempt(int $userId, int $materialId, int $classId): bool
    {
        $quizIds = QuizMap::query()
            ->join('quiz_questions', 'quiz_questions.id', '=', 'quiz_map.quiz_question_id')
            ->where('quiz_questions.material_id', $materialId)
            ->pluck('quiz_map.quiz_id')
            ->unique()
            ->values();

        if ($quizIds->isEmpty()) return false;

        $quizIdsInClass = Quiz::query()
            ->where('class_id', $classId)
            ->whereIn('id', $quizIds)
            ->pluck('id');

        if ($quizIdsInClass->isEmpty()) return false;

        return QuizAttempt::query()
            ->where('user_id', $userId)
            ->whereIn('quizzes_id', $quizIdsInClass)
            ->exists();
    }

    private function checkQuizAvailability(int $userId, int $materialId, ?int $classId): bool
    {
        if (is_null($classId)) {
            return false;
        }

        $quizIds = QuizMap::query()
            ->join('quiz_questions', 'quiz_questions.id', '=', 'quiz_map.quiz_question_id')
            ->where('quiz_questions.material_id', $materialId)
            ->pluck('quiz_map.quiz_id')
            ->unique()
            ->values();

        if ($quizIds->isEmpty()) {
            return false;
        }

        $quizzes = Quiz::query()
            ->where('class_id', $classId)
            ->whereIn('id', $quizIds)
            ->get();

        foreach ($quizzes as $quiz) {
            $allMaterialsCompleted = $this->areAllQuizMaterialsCompleted($userId, $quiz->id, $classId);

            $notAttempted = !QuizAttempt::query()
                ->where('user_id', $userId)
                ->where('quizzes_id', $quiz->id)
                ->exists();

            if ($allMaterialsCompleted && $notAttempted) {
                return true;
            }
        }

        return false;
    }


    private function areAllQuizMaterialsCompleted(int $userId, int $quizId, int $classId): bool
    {
        $materialIds = QuizMap::query()
            ->join('quiz_questions', 'quiz_questions.id', '=', 'quiz_map.quiz_question_id')
            ->where('quiz_map.quiz_id', $quizId)
            ->pluck('quiz_questions.material_id')
            ->unique()
            ->values();

        if ($materialIds->isEmpty()) {
            return false;
        }

        $completedCount = UserProgress::query()
            ->where('user_id', $userId)
            ->where('class_id', $classId)
            ->whereIn('material_id', $materialIds)
            ->where('status', 'completed')
            ->count();

        return $completedCount === $materialIds->count();
    }

}
