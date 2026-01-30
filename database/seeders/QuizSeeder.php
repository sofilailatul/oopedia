<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\QuizModel;
use App\Models\QuizQuestionsModel;

class QuizSeeder extends Seeder
{
    public function run(): void
    {
        // =========================
        // 1) BANK SOAL per materi
        // =========================
        $bankQuestionIds = [];

        foreach (SeederState::$materialIds as $materialId) {

            $q1 = QuizQuestionsModel::create([
                'material_id' => $materialId,
                'quiz_text' => 'Apa itu Encapsulation?',
                'feedback_correct' => 'Benar. Encapsulation = membatasi akses dan menyembunyikan detail implementasi.',
                'feedback_incorrect' => 'Belum tepat. Encapsulation bukan pewarisan; ini tentang pembatasan akses data (data hiding).',
            ]);
            $this->seedOptions($q1, correctIndex: 1, texts: [
                'Menyembunyikan detail implementasi',
                'Mewariskan class',
                'Menduplikasi object',
                'Menghapus constructor',
            ]);

            $q2 = QuizQuestionsModel::create([
                'material_id' => $materialId,
                'quiz_text' => 'Keyword yang umum untuk inheritance adalah…',
                'feedback_correct' => 'Benar. Umumnya “extends” dipakai untuk pewarisan.',
                'feedback_incorrect' => 'Belum tepat. Pewarisan (inheritance) umumnya menggunakan keyword “extends”.',
            ]);
            $this->seedOptions($q2, correctIndex: 2, texts: [
                'create',
                'extends',
                'implements',
                'override',
            ]);

            $q3 = QuizQuestionsModel::create([
                'material_id' => $materialId,
                'quiz_text' => 'Polymorphism ditunjukkan dengan…',
                'feedback_correct' => 'Benar. Polymorphism: satu antarmuka/method dapat berperilaku berbeda (override).',
                'feedback_incorrect' => 'Belum tepat. Polymorphism adalah kemampuan method yang sama memiliki perilaku berbeda.',
            ]);
            $this->seedOptions($q3, correctIndex: 1, texts: [
                'Satu method, banyak bentuk (override)',
                'Satu variabel, satu nilai',
                'Satu class tanpa object',
                'Satu database banyak tabel',
            ]);

            $bankQuestionIds[] = $q1->id;
            $bankQuestionIds[] = $q2->id;
            $bankQuestionIds[] = $q3->id;
        }

        // =========================
        // 2) Buat QUIZ event (A & B)
        // =========================
        $quizA = QuizModel::create([
            'title' => 'Quiz OOP - Pertemuan 1',
            'class_id' => SeederState::$classAId,
            'created_by' => SeederState::$dosenId,
            'duration' => 30,
            'passing_score' => 60,
        ]);

        $quizB = QuizModel::create([
            'title' => 'Quiz OOP Multi Materi - Kelas B',
            'class_id' => SeederState::$classBId,
            'created_by' => SeederState::$dosenId,
            'duration' => 30,
            'passing_score' => 60,
        ]);

        SeederState::$quizAId = (int) $quizA->id;
        SeederState::$quizBId = (int) $quizB->id;

        // =========================
        // 3) Attach soal ke quiz_map + points (simulasi dosen input poin)
        // =========================
        // contoh: quiz A ambil 8 soal pertama, quiz B ambil 8 soal terakhir
        $take = min(8, count($bankQuestionIds));

        $aQuestionIds = array_slice($bankQuestionIds, 0, $take);
        $bQuestionIds = array_slice($bankQuestionIds, max(0, count($bankQuestionIds) - $take));

        $quizA->questions()->sync($this->pivotPointsPayload($aQuestionIds));
        $quizB->questions()->sync($this->pivotPointsPayload($bQuestionIds));
    }

    /**
     * Seed 4 options untuk 1 question.
     * correctIndex: 1..4
     */
    private function seedOptions(QuizQuestionsModel $q, int $correctIndex, array $texts): void
    {
        // safety: kalau options sudah ada
        if ($q->options()->exists()) return;

        $rows = [];
        foreach ($texts as $i => $text) {
            $rows[] = [
                'option_text' => $text,
                'is_correct' => (($i + 1) === $correctIndex),
            ];
        }
        $q->options()->createMany($rows);
    }

    /**
     * Bentuk payload sync untuk pivot quiz_map:
     * [questionId => ['points' => ...], ...]
     */
    private function pivotPointsPayload(array $questionIds): array
    {
        $payload = [];
        foreach ($questionIds as $qid) {
            // simulasi dosen: poin bervariasi 5/10/15
            $payload[$qid] = [
                'points' => collect([5, 10, 15])->random(),
            ];
        }
        return $payload;
    }
}
