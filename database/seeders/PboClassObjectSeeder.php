<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PboClassObjectSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $now = now();
            $createdBy = 2; // sesuaikan dengan id dosen/user yang kamu mau

            $materialName = 'Class dan Object pada Pemrograman Berorientasi Objek';

            // Cari material lama biar tidak duplikat
            $existingMaterial = DB::table('materials')
                ->where('material_name', $materialName)
                ->first();

            if ($existingMaterial) {
                $materialId = $existingMaterial->id;

                // Hapus child practice lebih dulu
                $practiceIds = DB::table('practices')
                    ->where('material_id', $materialId)
                    ->pluck('id')
                    ->toArray();

                if (!empty($practiceIds)) {
                    $questionIds = DB::table('practice_questions')
                        ->whereIn('practices_id', $practiceIds)
                        ->pluck('id')
                        ->toArray();

                    if (!empty($questionIds)) {
                        DB::table('practice_options')
                            ->whereIn('practice_questions_id', $questionIds)
                            ->delete();

                        DB::table('practice_items')
                            ->whereIn('practice_questions_id', $questionIds)
                            ->delete();

                        DB::table('practice_questions')
                            ->whereIn('id', $questionIds)
                            ->delete();
                    }

                    DB::table('practices')
                        ->whereIn('id', $practiceIds)
                        ->delete();
                }

                // Hapus konten & subtopic
                DB::table('material_contents')
                    ->where('material_id', $materialId)
                    ->delete();

                DB::table('subtopics')
                    ->where('material_id', $materialId)
                    ->delete();

                // Update material
                DB::table('materials')
                    ->where('id', $materialId)
                    ->update([
                        'order_number' => 1,
                        'description' => 'Pada materi ini, siswa mempelajari konsep dasar Pemrograman Berorientasi Objek, khususnya class dan object.',
                        'content' => null,
                        'created_by' => $createdBy,
                        'updated_at' => $now,
                    ]);
            } else {
                $materialId = DB::table('materials')->insertGetId([
                    'material_name' => $materialName,
                    'order_number' => 1,
                    'description' => 'Pada materi ini, siswa mempelajari konsep dasar Pemrograman Berorientasi Objek, khususnya class dan object.',
                    'content' => null,
                    'created_by' => $createdBy,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | SUBTOPICS
            |--------------------------------------------------------------------------
            */
            $subtopics = [
                1 => 'Pengertian Class dan Object',
                2 => 'Atribut dan Method pada Class',
                3 => 'Membuat Object dari Class',
                4 => 'Perbedaan Class dan Object',
                5 => 'Contoh Penerapan Class dan Object dalam Kehidupan Nyata',
            ];

            $subtopicIds = [];

            foreach ($subtopics as $order => $name) {
                $subtopicIds[$order] = DB::table('subtopics')->insertGetId([
                    'material_id' => $materialId,
                    'name' => $name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | MATERIAL CONTENTS / SECTIONS
            |--------------------------------------------------------------------------
            */
            $materialContents = [
                [
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicIds[1],
                    'title' => 'Pengertian',
                    'content_text' => "Dalam Pemrograman Berorientasi Objek, class adalah blueprint atau cetakan untuk membuat object.\n\nObject adalah hasil instansiasi dari class. Class mendefinisikan atribut dan method yang dimiliki object.",
                    'image_path' => null,
                    'sort_order' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicIds[2],
                    'title' => 'Atribut dan Method pada Class',
                    'content_text' => "Di dalam class, biasanya terdapat:\n- atribut: data atau ciri dari object\n- method: perilaku atau aksi yang dapat dilakukan object\n\nAtribut menyimpan informasi, sedangkan method menjalankan proses.",
                    'image_path' => null,
                    'sort_order' => 2,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicIds[3],
                    'title' => 'Membuat Object dari Class',
                    'content_text' => "Untuk menggunakan class, kita perlu membuat object dengan kata kunci new.\n\nContoh:\nNamaClass namaObject = new NamaClass();\n\nSetelah dibuat, atribut dan method dapat diakses dengan operator titik.",
                    'image_path' => null,
                    'sort_order' => 3,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicIds[4],
                    'title' => 'Perbedaan Class dan Object',
                    'content_text' => "Class adalah rancangan atau template. Object adalah hasil nyata dari class.\n\nClass menentukan atribut dan method, sedangkan object memiliki nilai yang bisa berbeda walaupun berasal dari class yang sama.",
                    'image_path' => null,
                    'sort_order' => 4,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicIds[5],
                    'title' => 'Penerapan dalam Kehidupan Nyata',
                    'content_text' => "Contoh penerapan:\nClass: Mobil\nAtribut: merk, warna\nMethod: jalan(), berhenti()\n\nObject:\n- mobilA = Avanza hitam\n- mobilB = Brio merah",
                    'image_path' => null,
                    'sort_order' => 5,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ];

            DB::table('material_contents')->insert($materialContents);

            /*
            |--------------------------------------------------------------------------
            | PRACTICES (PARENT)
            |--------------------------------------------------------------------------
            */
            $pretestId = DB::table('practices')->insertGetId([
                'material_id' => $materialId,
                'type' => 'pretest',
                'level' => null,
                'min_score' => 60,
                'max_attempts' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $practiceEasyId = DB::table('practices')->insertGetId([
                'material_id' => $materialId,
                'type' => 'practice',
                'level' => 'easy',
                'min_score' => 60,
                'max_attempts' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $practiceMediumId = DB::table('practices')->insertGetId([
                'material_id' => $materialId,
                'type' => 'practice',
                'level' => 'medium',
                'min_score' => 60,
                'max_attempts' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $practiceHardId = DB::table('practices')->insertGetId([
                'material_id' => $materialId,
                'type' => 'practice',
                'level' => 'hard',
                'min_score' => 60,
                'max_attempts' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            /*
            |--------------------------------------------------------------------------
            | PRETEST QUESTIONS
            |--------------------------------------------------------------------------
            */
            $q1 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $pretestId,
                'subtopic_id' => $subtopicIds[1],
                'type' => 'multiple_choice',
                'question_text' => 'Class dalam PBO adalah...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Bagus, kamu sudah memahami bahwa class berfungsi sebagai dasar pembentukan object.',
                'feedback_incorrect' => 'Petunjuk: class belum dipakai langsung, tetapi menjadi dasar sebelum object dibuat.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $q2 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $pretestId,
                'subtopic_id' => $subtopicIds[1],
                'type' => 'multiple_choice',
                'question_text' => 'Object adalah...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Tepat, kamu memahami hasil nyata dari class.',
                'feedback_incorrect' => 'Petunjuk: bedakan antara cetakan dan hasil dari cetakan.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $q3 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $pretestId,
                'subtopic_id' => $subtopicIds[2],
                'type' => 'multiple_choice',
                'question_text' => 'Atribut dalam class berfungsi untuk...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Benar, atribut berkaitan dengan penyimpanan data.',
                'feedback_incorrect' => 'Petunjuk: pikirkan bagian class yang menyimpan informasi, bukan yang menjalankan aksi.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $q4 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $pretestId,
                'subtopic_id' => $subtopicIds[2],
                'type' => 'multiple_choice',
                'question_text' => 'Method adalah...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Bagus, method berkaitan dengan aksi atau perilaku.',
                'feedback_incorrect' => 'Petunjuk: method biasanya melakukan sesuatu, bukan sekadar menyimpan data.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $q5 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $pretestId,
                'subtopic_id' => $subtopicIds[3],
                'type' => 'multiple_choice',
                'question_text' => 'Kata kunci untuk membuat object di Java adalah...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Benar, kamu mengenali keyword untuk instansiasi object.',
                'feedback_incorrect' => 'Petunjuk: Java menggunakan keyword khusus saat object dibuat dari class.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($q1, [
                ['Object yang digunakan dalam program', 0],
                ['Cetakan untuk membuat object', 1],
                ['Variabel penyimpanan data', 0],
                ['Method dalam program', 0],
            ], $now);

            $this->insertOptions($q2, [
                ['Blueprint', 0],
                ['Method', 0],
                ['Hasil dari class', 1],
                ['Tipe data', 0],
            ], $now);

            $this->insertOptions($q3, [
                ['Menjalankan program', 0],
                ['Menyimpan data', 1],
                ['Menampilkan output', 0],
                ['Menghapus data', 0],
            ], $now);

            $this->insertOptions($q4, [
                ['Data dalam class', 0],
                ['Variabel', 0],
                ['Perilaku atau fungsi dalam class', 1],
                ['Nama object', 0],
            ], $now);

            $this->insertOptions($q5, [
                ['create', 0],
                ['object', 0],
                ['new', 1],
                ['make', 0],
            ], $now);

            /*
            |--------------------------------------------------------------------------
            | PRACTICE EASY
            |--------------------------------------------------------------------------
            */
            $qEasy1 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceEasyId,
                'subtopic_id' => $subtopicIds[1],
                'type' => 'multiple_choice',
                'question_text' => 'Perbedaan class dan object adalah...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Bagus, kamu bisa membedakan rancangan dan hasilnya.',
                'feedback_incorrect' => 'Petunjuk: bayangkan cetakan kue dan kue hasil cetakan.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qEasy1, [
                ['Class adalah hasil, object adalah cetakan', 0],
                ['Class adalah cetakan, object adalah hasil', 1],
                ['Class dan object sama saja', 0],
                ['Class tidak berhubungan dengan object', 0],
            ], $now);

            $qEasy2 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceEasyId,
                'subtopic_id' => $subtopicIds[3],
                'type' => 'multiple_choice',
                'question_text' => 'Sintaks yang benar untuk membuat object adalah...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Tepat, kamu mengenali pola penulisan object dengan benar.',
                'feedback_incorrect' => 'Petunjuk: urutannya adalah nama class, nama variabel, lalu instansiasi.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qEasy2, [
                ['Mobil = new class()', 0],
                ['class Mobil = new Mobil()', 0],
                ['Mobil m = new Mobil()', 1],
                ['new Mobil = m', 0],
            ], $now);

            $qEasy3 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceEasyId,
                'subtopic_id' => $subtopicIds[3],
                'type' => 'drag_drop',
                'question_text' => 'Susun potongan kode berikut agar menjadi program Java yang benar untuk membuat object dan menampilkan nilainya.',
                'image_path' => null,
                'points' => 20,
                'code_snippet' => "Output:\n10",
                'feedback_correct' => 'Urutan kode sudah tepat. Class didefinisikan lebih dulu, lalu object digunakan di method main.',
                'feedback_incorrect' => 'Petunjuk: definisikan class terlebih dahulu sebelum object dibuat dan dipakai.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertItems($qEasy3, [
                'class Angka {',
                '    int nilai = 10;',
                '}',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Angka a = new Angka();',
                '        System.out.println(a.nilai);',
                '    }',
                '}',
            ], $now);

            /*
            |--------------------------------------------------------------------------
            | PRACTICE MEDIUM
            |--------------------------------------------------------------------------
            */
            $qMedium1 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceMediumId,
                'subtopic_id' => $subtopicIds[2],
                'type' => 'multiple_choice',
                'question_text' => 'Manakah yang termasuk method?',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Benar, kamu mengenali bentuk dasar method.',
                'feedback_incorrect' => 'Petunjuk: method biasanya memiliki tanda kurung ().',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qMedium1, [
                ['String nama;', 0],
                ['int umur;', 0],
                ['void tampil() {}', 1],
                ['double nilai;', 0],
            ], $now);

            $qMedium2 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceMediumId,
                'subtopic_id' => $subtopicIds[2],
                'type' => 'multiple_choice',
                'question_text' => 'Apa fungsi operator titik (.) pada object?',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Tepat, operator titik dipakai untuk mengakses isi object.',
                'feedback_incorrect' => 'Petunjuk: operator ini digunakan setelah object berhasil dibuat.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qMedium2, [
                ['Membuat class', 0],
                ['Menghapus object', 0],
                ['Mengakses atribut atau method', 1],
                ['Menyimpan data', 0],
            ], $now);

            $qMedium3 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceMediumId,
                'subtopic_id' => $subtopicIds[2],
                'type' => 'drag_drop',
                'question_text' => 'Susun potongan kode berikut agar menjadi program Java yang benar untuk menampilkan method dari sebuah object.',
                'image_path' => null,
                'points' => 20,
                'code_snippet' => "Output:\nHalo, saya Andi",
                'feedback_correct' => 'Bagus, struktur class, atribut, method, dan pemanggilan object sudah berurutan.',
                'feedback_incorrect' => 'Petunjuk: method harus didefinisikan di dalam class, lalu dipanggil setelah object dibuat.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertItems($qMedium3, [
                'class Mahasiswa {',
                '    String nama;',
                '    void perkenalan() {',
                '        System.out.println("Halo, saya " + nama);',
                '    }',
                '}',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Mahasiswa m = new Mahasiswa();',
                '        m.nama = "Andi";',
                '        m.perkenalan();',
                '    }',
                '}',
            ], $now);

            /*
            |--------------------------------------------------------------------------
            | PRACTICE HARD
            |--------------------------------------------------------------------------
            */
            $qHard1 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceHardId,
                'subtopic_id' => $subtopicIds[2],
                'type' => 'multiple_choice',
                'question_text' => "Perhatikan kode berikut:\nclass A {\n    int x = 10;\n}\nYang merupakan atribut adalah...",
                'image_path' => null,
                'points' => 10,
                'code_snippet' => "class A {\n    int x = 10;\n}",
                'feedback_correct' => 'Benar, kamu dapat mengenali bagian yang menyimpan data di dalam class.',
                'feedback_incorrect' => 'Petunjuk: cari bagian yang menyimpan nilai, bukan nama class atau keyword.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qHard1, [
                ['A', 0],
                ['x', 1],
                ['int', 0],
                ['class', 0],
            ], $now);

            $qHard2 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceHardId,
                'subtopic_id' => $subtopicIds[3],
                'type' => 'multiple_choice',
                'question_text' => "Perhatikan kode berikut:\nMobil m = new Mobil();\nYang merupakan object adalah...",
                'image_path' => null,
                'points' => 10,
                'code_snippet' => "Mobil m = new Mobil();",
                'feedback_correct' => 'Bagus, kamu memahami bahwa object disimpan ke dalam variabel.',
                'feedback_incorrect' => 'Petunjuk: object adalah hasil instansiasi yang direferensikan oleh variabel.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qHard2, [
                ['Mobil', 0],
                ['new', 0],
                ['m', 1],
                ['class', 0],
            ], $now);

            $qHard3 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceHardId,
                'subtopic_id' => $subtopicIds[2],
                'type' => 'drag_drop',
                'question_text' => 'Susun potongan kode berikut agar menjadi program Java yang benar dengan 2 object berbeda.',
                'image_path' => null,
                'points' => 25,
                'code_snippet' => "Output:\nAni\nBudi",
                'feedback_correct' => 'Urutan sudah benar. Kedua object dibuat dari class yang sama lalu diberi nilai berbeda.',
                'feedback_incorrect' => 'Petunjuk: class harus selesai didefinisikan lebih dulu, kemudian object dibuat di method main.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertItems($qHard3, [
                'class Siswa {',
                '    String nama;',
                '}',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Siswa s1 = new Siswa();',
                '        Siswa s2 = new Siswa();',
                '        s1.nama = "Ani";',
                '        s2.nama = "Budi";',
                '        System.out.println(s1.nama);',
                '        System.out.println(s2.nama);',
                '    }',
                '}',
            ], $now);
        });
    }

    private function insertOptions(int $questionId, array $options, $now): void
    {
        $rows = [];

        foreach ($options as $option) {
            $rows[] = [
                'practice_questions_id' => $questionId,
                'option_text' => $option[0],
                'is_correct' => $option[1],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('practice_options')->insert($rows);
    }

    private function insertItems(int $questionId, array $items, $now): void
    {
        $rows = [];

        foreach ($items as $index => $item) {
            $rows[] = [
                'practice_questions_id' => $questionId,
                'item_text' => $item,
                'order_number' => $index + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('practice_items')->insert($rows);
    }
}
