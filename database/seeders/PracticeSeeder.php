<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PracticeModel;
use App\Models\PracticeQuestionModel;

class PracticeSeeder extends Seeder
{
    public function run(): void
    {
        SeederState::$practiceIds = [];

        foreach (SeederState::$materialIds as $materialId) {
            foreach (['easy', 'normal', 'hard'] as $level) {

                $practice = PracticeModel::create([
                    'material_id' => $materialId,
                    'difficulty_level' => $level,
                ]);

                SeederState::$practiceIds[] = (int) $practice->id;

                // =========================
                // 1) Multiple Choice
                // =========================
                /** @var PracticeQuestionModel $mcq */
                $mcq = $practice->questions()->create([
                    'question_text' => "({$level}) Apa tujuan utama OOP?",
                    'type' => 'multiple_choice',
                    'feedback_correct' => 'Benar. OOP membantu modularitas, reusability, dan maintainability.',
                    'feedback_incorrect' => 'Belum tepat. OOP bertujuan mengorganisasi kode dengan objek agar lebih mudah dipelihara dan digunakan ulang.',
                ]);

                $mcq->options()->createMany([
                    ['option_text' => 'Membuat kode lebih terstruktur & reusable', 'is_correct' => true],
                    ['option_text' => 'Menghapus kebutuhan fungsi', 'is_correct' => false],
                    ['option_text' => 'Menghindari database', 'is_correct' => false],
                    ['option_text' => 'Membuat semua program lebih cepat', 'is_correct' => false],
                ]);

                // =========================
                // 2) Drag & Drop
                // =========================
                /** @var PracticeQuestionModel $dd */
                $dd = $practice->questions()->create([
                    'question_text' => "({$level}) Urutkan: Class → Object → Method",
                    'type' => 'drag_drop',
                    'feedback_correct' => 'Benar. Class adalah blueprint, Object instance, Method adalah perilaku.',
                    'feedback_incorrect' => 'Urutannya belum tepat. Mulai dari Class (blueprint), lalu Object (instance), lalu Method (perilaku).',
                ]);

                $dd->items()->createMany([
                    ['item_text' => 'Class', 'order_number' => 1],
                    ['item_text' => 'Object', 'order_number' => 2],
                    ['item_text' => 'Method', 'order_number' => 3],
                ]);
            }
        }
    }
}