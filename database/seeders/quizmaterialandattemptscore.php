<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

use App\Models\QuizModel;
use App\Models\MaterialModel;
use App\Models\UserModel;
use App\Models\QuizAttemptModel;

class QuizMaterialAndAttemptScore extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {

            /**
             * ============================
             * 1) SEED quiz_materials
             * ============================
             * Ambil 1 quiz terbaru, mapping ke 3 materi pertama.
             */
            $quiz = QuizModel::query()->latest('id')->first();
            if (!$quiz) {
                $this->command?->warn('Tidak ada quiz. Buat quiz dulu sebelum seeding quiz_materials.');
                return;
            }

            $materials = MaterialModel::query()
                ->orderBy('order_number')
                ->limit(3)
                ->get();

            if ($materials->count() < 1) {
                $this->command?->warn('Tidak ada material. Buat material dulu sebelum seeding quiz_materials.');
                return;
            }

            // Insert pivot quiz_materials (hindari duplikasi)
            foreach ($materials as $mat) {
                DB::table('quiz_materials')->updateOrInsert(
                    [
                        'quizzes_id' => $quiz->id,
                        'material_id' => $mat->id,
                    ],
                    [
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }

            /**
             * ============================
             * 2) SEED quiz_attempt_material_scores
             * ============================
             * Buat 1 attempt dummy untuk 1 mahasiswa, lalu isi skor per materi.
             */
            $mahasiswa = UserModel::query()->where('role', 'mahasiswa')->first();
            if (!$mahasiswa) {
                $this->command?->warn('Tidak ada user mahasiswa. Buat user mahasiswa dulu.');
                return;
            }

            // Buat attempt dummy (kalau belum ada)
            $attempt = QuizAttemptModel::query()
                ->where('user_id', $mahasiswa->id)
                ->where('quizzes_id', $quiz->id)   // sesuaikan dengan schema kamu (quizzes_id)
                ->latest('id')
                ->first();

            if (!$attempt) {
                $attempt = QuizAttemptModel::create([
                    'user_id' => $mahasiswa->id,
                    'quizzes_id' => $quiz->id,  // sesuai migration kamu: quizzes_id
                    'started_at' => now()->subMinutes(10),
                    'finished_at' => now(),
                    'total_score' => 0, // nanti kita update setelah detail materi diinsert
                ]);
            }

            // Isi skor per materi untuk attempt ini
            $scores = [];
            foreach ($materials as $mat) {
                // contoh skor dummy
                $scores[$mat->id] = rand(40, 100);
            }

            // 🔥 Penting: nama kolom attempt id bisa berbeda.
            // Kamu pilih salah satu dan hapus yang tidak sesuai:
            foreach ($scores as $materialId => $score) {

                // OPSI A: kalau kolomnya quiz_attempt_id
                DB::table('quiz_attempt_material_scores')->updateOrInsert(
                    [
                        'quiz_attempts_id' => $attempt->id,
                        'material_id' => $materialId,
                    ],
                    [
                        'earned_score' => $score,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );

                // OPSI B: kalau kolomnya quiz_attempts_id (seperti tabelmu yang lain)
                /*
                DB::table('quiz_attempt_material_scores')->updateOrInsert(
                    [
                        'quiz_attempts_id' => $attempt->id,
                        'material_id' => $materialId,
                    ],
                    [
                        'score' => $score,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
                */
            }

            // Update total_score attempt (misalnya rata-rata / jumlah, sesuaikan aturanmu)
            $attempt->update([
                'total_score' => (int) round(array_sum($scores) / max(count($scores), 1)),
            ]);
        });
    }
}
