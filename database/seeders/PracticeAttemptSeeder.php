<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserModel;
use App\Models\PracticeModel;

class PracticeAttemptSeeder extends Seeder
{
    public function run(): void
    {
        $practiceIds = array_slice(SeederState::$practiceIds, 0, 2); // demo 2 practice

        foreach (SeederState::$mahasiswaIds as $userId) {
            $user = UserModel::findOrFail($userId);

            foreach ($practiceIds as $pid) {
                $practice = PracticeModel::with('questions.options', 'questions.items')->findOrFail($pid);

                $attempt = $practice->attempts()->create([
                    'user_id' => $user->id,
                    'started_at' => now(),
                    'finished_at' => null,
                    'mc_correct' => 0,
                    'mc_score' => 0,
                    'drag_correct' => 0,
                    'drag_score' => 0,
                    'total_earned' => 0,
                    'final_score' => 0,
                    'is_passed' => false,
                ]);

                $mcq = $practice->questions->firstWhere('type', 'multiple_choice');
                $dd  = $practice->questions->firstWhere('type', 'drag_drop');

                $mcScore = 0; $mcCorrect = 0;
                $ddScore = 0; $ddCorrect = 0;

                if ($mcq) {
                    $correctOpt = $mcq->options->firstWhere('is_correct', true);
                    $isCorrect = (rand(1, 100) <= 70);

                    $chosenOpt = $isCorrect
                        ? $correctOpt
                        : $mcq->options->where('id', '!=', $correctOpt?->id)->values()->random();

                    $mcCorrect = $isCorrect ? 1 : 0;
                    $mcScore = $isCorrect ? 50 : 0;

                    $attempt->answers()->create([
                        'practice_questions_id' => $mcq->id,
                        'practice_options_id' => $chosenOpt?->id,
                        'attempt' => 1,
                        'selection_items' => null,
                        'is_correct' => $isCorrect,
                        'score' => $mcScore,
                        'timespent' => rand(10, 90),
                    ]);
                }

                if ($dd) {
                    $itemsOrdered = $dd->items->sortBy('order_number')->pluck('item_text')->values()->toArray();

                    $isCorrect = (rand(1, 100) <= 60);
                    $ddCorrect = $isCorrect ? 1 : 0;
                    $ddScore = $isCorrect ? 50 : 0;

                    $selection = $isCorrect ? $itemsOrdered : array_reverse($itemsOrdered);

                    $attempt->answers()->create([
                        'practice_questions_id' => $dd->id,
                        'practice_options_id' => null,
                        'attempt' => 1,
                        'selection_items' => $selection,
                        'is_correct' => $isCorrect,
                        'score' => $ddScore,
                        'timespent' => rand(10, 90),
                    ]);
                }

                $final = $mcScore + $ddScore;

                $attempt->update([
                    'mc_correct' => $mcCorrect,
                    'mc_score' => $mcScore,
                    'drag_correct' => $ddCorrect,
                    'drag_score' => $ddScore,
                    'total_earned' => $final,
                    'final_score' => $final,
                    'is_passed' => ($final >= 60),
                    'finished_at' => now(),
                ]);
            }
        }
    }
}
