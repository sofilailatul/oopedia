<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserModel;
use App\Models\QuizModel;

class QuizAttemptSeeder extends Seeder
{
    public function run(): void
    {
        foreach (SeederState::$mahasiswaIds as $idx => $userId) {
            $user = UserModel::findOrFail($userId);

            $quizId = ($idx < 4) ? SeederState::$quizAId : SeederState::$quizBId;

            /** @var QuizModel $quiz */
            $quiz = QuizModel::with(['questions.options'])->findOrFail($quizId);

            $attempt = $quiz->attempts()->create([
                'user_id' => $user->id,
                'started_at' => now(),
                'finished_at' => null,
                'total_score' => 0,
            ]);

            $total = 0;

            foreach ($quiz->questions as $q) {
                $points = (int) ($q->pivot->points ?? 1);

                // probabilitas benar
                $isCorrect = (rand(1, 100) <= 70);

                $correctOpt = $q->options->firstWhere('is_correct', true);
                if (!$correctOpt) {
                    // safety: kalau seeder option belum ada, skip
                    continue;
                }

                $chosenOpt = $isCorrect
                    ? $correctOpt
                    : $q->options->where('id', '!=', $correctOpt->id)->values()->random();

                $attempt->answers()->create([
                    'quiz_questions_id' => $q->id,
                    'quiz_options_id' => $chosenOpt->id,
                    'is_correct' => $isCorrect,
                ]);

                if ($isCorrect) $total += $points;
            }

            $attempt->update([
                'total_score' => $total,
                'finished_at' => now(),
            ]);
        }
    }
}
