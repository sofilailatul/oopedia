<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PboInheritanceSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $now = now();
            $createdBy = 2; // sesuaikan dengan id dosen/user yang kamu mau

            $materialName = 'Inheritance pada Pemrograman Berorientasi Objek';

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
                        'order_number' => 3,
                        'description' => 'Pada materi ini, siswa mempelajari konsep inheritance atau pewarisan, hubungan parent dan child class, serta manfaat penggunaannya dalam Pemrograman Berorientasi Objek.',
                        'content' => null,
                        'created_by' => $createdBy,
                        'updated_at' => $now,
                    ]);
            } else {
                $materialId = DB::table('materials')->insertGetId([
                    'material_name' => $materialName,
                    'order_number' => 3,
                    'description' => 'Pada materi ini, siswa mempelajari konsep inheritance atau pewarisan, hubungan parent dan child class, serta manfaat penggunaannya dalam Pemrograman Berorientasi Objek.',
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
                1 => 'Pengertian Inheritance',
                2 => 'Parent Class dan Child Class',
                3 => 'Keyword extends',
                4 => 'Manfaat Inheritance',
                5 => 'Contoh Implementasi Inheritance',
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
                    'title' => 'Pengertian Inheritance',
                    'content_text' => "Inheritance adalah konsep dalam Pemrograman Berorientasi Objek yang memungkinkan sebuah class mewarisi atribut dan method dari class lain.\n\nDengan inheritance, kita dapat menggunakan kembali kode yang sudah ada pada class induk.",
                    'image_path' => null,
                    'sort_order' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicIds[2],
                    'title' => 'Parent Class dan Child Class',
                    'content_text' => "Parent class adalah class induk yang memberikan atribut dan method.\nChild class adalah class turunan yang mewarisi isi dari parent class.\n\nChild class dapat menggunakan atribut dan method milik parent class.",
                    'image_path' => null,
                    'sort_order' => 2,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicIds[3],
                    'title' => 'Keyword extends',
                    'content_text' => "Dalam Java, inheritance menggunakan keyword extends.\n\nContoh:\nclass Hewan {\n}\n\nclass Kucing extends Hewan {\n}\n\nArtinya class Kucing mewarisi class Hewan.",
                    'image_path' => null,
                    'sort_order' => 3,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicIds[4],
                    'title' => 'Manfaat Inheritance',
                    'content_text' => "Manfaat inheritance antara lain:\n- mengurangi duplikasi kode\n- mempermudah pengelolaan program\n- mendukung hubungan hierarki antar class\n- memudahkan pengembangan program",
                    'image_path' => null,
                    'sort_order' => 4,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicIds[5],
                    'title' => 'Contoh Implementasi',
                    'content_text' => "Contoh:\nclass Kendaraan {\n    void jalan() {\n        System.out.println(\"Kendaraan berjalan\");\n    }\n}\n\nclass Mobil extends Kendaraan {\n}\n\nObject Mobil dapat memanggil method jalan() karena mewarisi dari Kendaraan.",
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
                'question_text' => 'Inheritance dalam PBO adalah...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Benar, inheritance adalah pewarisan atribut dan method dari class lain.',
                'feedback_incorrect' => 'Petunjuk: inheritance berkaitan dengan pewarisan antar class.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $q2 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $pretestId,
                'subtopic_id' => $subtopicIds[2],
                'type' => 'multiple_choice',
                'question_text' => 'Class yang mewariskan atribut dan method disebut...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Tepat, parent class adalah class induk yang diwarisi.',
                'feedback_incorrect' => 'Petunjuk: parent class sering disebut class induk.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $q3 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $pretestId,
                'subtopic_id' => $subtopicIds[2],
                'type' => 'multiple_choice',
                'question_text' => 'Class turunan dari parent class disebut...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Benar, class turunan disebut child class.',
                'feedback_incorrect' => 'Petunjuk: child class adalah class yang menerima warisan.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $q4 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $pretestId,
                'subtopic_id' => $subtopicIds[3],
                'type' => 'multiple_choice',
                'question_text' => 'Keyword yang digunakan untuk inheritance di Java adalah...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Bagus, Java menggunakan keyword extends untuk pewarisan.',
                'feedback_incorrect' => 'Petunjuk: keyword ini ditulis di antara child class dan parent class.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $q5 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $pretestId,
                'subtopic_id' => $subtopicIds[4],
                'type' => 'multiple_choice',
                'question_text' => 'Salah satu manfaat inheritance adalah...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Tepat, inheritance membantu mengurangi duplikasi kode.',
                'feedback_incorrect' => 'Petunjuk: inheritance mendukung penggunaan ulang kode.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($q1, [
                ['Proses membuat object dari class', 0],
                ['Pewarisan atribut dan method dari class lain', 1],
                ['Penyembunyian data dalam class', 0],
                ['Pembuatan method baru', 0],
            ], $now);

            $this->insertOptions($q2, [
                ['Child class', 0],
                ['Object class', 0],
                ['Parent class', 1],
                ['Main class', 0],
            ], $now);

            $this->insertOptions($q3, [
                ['Super object', 0],
                ['Child class', 1],
                ['Method class', 0],
                ['Main class', 0],
            ], $now);

            $this->insertOptions($q4, [
                ['implements', 0],
                ['inherits', 0],
                ['extends', 1],
                ['new', 0],
            ], $now);

            $this->insertOptions($q5, [
                ['Menambah duplikasi kode', 0],
                ['Mengurangi penggunaan class', 0],
                ['Mengurangi duplikasi kode', 1],
                ['Membuat program tanpa object', 0],
            ], $now);

            /*
            |--------------------------------------------------------------------------
            | PRACTICE EASY
            |--------------------------------------------------------------------------
            */
            $qEasy1 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceEasyId,
                'subtopic_id' => $subtopicIds[2],
                'type' => 'multiple_choice',
                'question_text' => 'Manakah yang merupakan child class?',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => "class Hewan {}\nclass Kucing extends Hewan {}",
                'feedback_correct' => 'Benar, Kucing adalah child class karena mewarisi Hewan.',
                'feedback_incorrect' => 'Petunjuk: child class adalah class yang memakai extends.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qEasy1, [
                ['Hewan', 0],
                ['Kucing', 1],
                ['extends', 0],
                ['class', 0],
            ], $now);

            $qEasy2 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceEasyId,
                'subtopic_id' => $subtopicIds[3],
                'type' => 'multiple_choice',
                'question_text' => 'Penulisan inheritance yang benar adalah...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Tepat, child class ditulis lebih dulu lalu extends parent class.',
                'feedback_incorrect' => 'Petunjuk: pola umumnya adalah class Anak extends Induk.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qEasy2, [
                ['class Hewan extends Kucing {}', 0],
                ['class Kucing extends Hewan {}', 1],
                ['extends class Kucing Hewan {}', 0],
                ['class Kucing inherit Hewan {}', 0],
            ], $now);

            $qEasy3 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceEasyId,
                'subtopic_id' => $subtopicIds[5],
                'type' => 'drag_drop',
                'question_text' => 'Susun potongan kode berikut agar menjadi program Java yang benar dengan inheritance sederhana.',
                'image_path' => null,
                'points' => 20,
                'code_snippet' => "Output:\nHewan makan",
                'feedback_correct' => 'Bagus, kamu sudah menyusun parent class, child class, dan object dengan benar.',
                'feedback_incorrect' => 'Petunjuk: buat parent class dulu, lalu child class yang extends parent, kemudian gunakan object.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertItems($qEasy3, [
                'class Hewan {',
                '    void makan() {',
                '        System.out.println("Hewan makan");',
                '    }',
                '}',
                'class Kucing extends Hewan {',
                '}',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Kucing k = new Kucing();',
                '        k.makan();',
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
                'subtopic_id' => $subtopicIds[4],
                'type' => 'multiple_choice',
                'question_text' => 'Mengapa inheritance berguna dalam pemrograman?',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Benar, inheritance membantu penggunaan ulang kode dari parent class.',
                'feedback_incorrect' => 'Petunjuk: inheritance erat kaitannya dengan reusability.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qMedium1, [
                ['Karena semua class harus sama', 0],
                ['Karena dapat menggunakan kembali kode dari class induk', 1],
                ['Karena object tidak dibutuhkan', 0],
                ['Karena method harus selalu private', 0],
            ], $now);

            $qMedium2 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceMediumId,
                'subtopic_id' => $subtopicIds[2],
                'type' => 'multiple_choice',
                'question_text' => 'Jika class Mobil extends Kendaraan, maka Mobil dapat...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Tepat, child class dapat mewarisi atribut dan method dari parent class.',
                'feedback_incorrect' => 'Petunjuk: pikirkan apa yang didapat child class dari parent class.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qMedium2, [
                ['Menghapus parent class', 0],
                ['Mewarisi atribut dan method dari Kendaraan', 1],
                ['Mengubah keyword extends menjadi new', 0],
                ['Membuat dua parent class sekaligus', 0],
            ], $now);

            $qMedium3 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceMediumId,
                'subtopic_id' => $subtopicIds[5],
                'type' => 'drag_drop',
                'question_text' => 'Susun potongan kode berikut agar menjadi program Java yang benar dengan parent class dan child class.',
                'image_path' => null,
                'points' => 20,
                'code_snippet' => "Output:\nSaya bisa berlari",
                'feedback_correct' => 'Bagus, child class berhasil menggunakan method dari parent class.',
                'feedback_incorrect' => 'Petunjuk: parent class didefinisikan dulu, lalu child class, lalu object dipakai di main.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertItems($qMedium3, [
                'class Hewan {',
                '    void bergerak() {',
                '        System.out.println("Saya bisa berlari");',
                '    }',
                '}',
                'class Kelinci extends Hewan {',
                '}',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Kelinci k = new Kelinci();',
                '        k.bergerak();',
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
                'subtopic_id' => $subtopicIds[3],
                'type' => 'multiple_choice',
                'question_text' => "Perhatikan kode berikut:\nclass Kendaraan {\n    void jalan() {\n        System.out.println(\"Berjalan\");\n    }\n}\nclass Mobil extends Kendaraan {\n}\nMethod yang dapat dipanggil oleh object Mobil adalah...",
                'image_path' => null,
                'points' => 10,
                'code_snippet' => "class Kendaraan {\n    void jalan() {\n        System.out.println(\"Berjalan\");\n    }\n}\nclass Mobil extends Kendaraan {\n}",
                'feedback_correct' => 'Benar, Mobil mewarisi method jalan() dari Kendaraan.',
                'feedback_incorrect' => 'Petunjuk: child class dapat memakai method milik parent class.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qHard1, [
                ['jalan()', 1],
                ['extends()', 0],
                ['main()', 0],
                ['print()', 0],
            ], $now);

            $qHard2 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceHardId,
                'subtopic_id' => $subtopicIds[2],
                'type' => 'multiple_choice',
                'question_text' => "Perhatikan relasi berikut:\nclass Mamalia {}\nclass Kucing extends Mamalia {}\nHubungan class tersebut adalah...",
                'image_path' => null,
                'points' => 10,
                'code_snippet' => "class Mamalia {}\nclass Kucing extends Mamalia {}",
                'feedback_correct' => 'Tepat, Kucing adalah child class dari Mamalia.',
                'feedback_incorrect' => 'Petunjuk: perhatikan penggunaan keyword extends.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qHard2, [
                ['Mamalia adalah child class dari Kucing', 0],
                ['Kucing adalah child class dari Mamalia', 1],
                ['Kucing dan Mamalia tidak berhubungan', 0],
                ['Mamalia adalah object dari Kucing', 0],
            ], $now);

            $qHard3 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceHardId,
                'subtopic_id' => $subtopicIds[5],
                'type' => 'drag_drop',
                'question_text' => 'Susun potongan kode berikut agar menjadi program Java yang benar dengan inheritance dan dua method turunan yang diwarisi.',
                'image_path' => null,
                'points' => 25,
                'code_snippet' => "Output:\nNama: Andi\nSekolah: SMK 1",
                'feedback_correct' => 'Urutan sudah benar. Child class mewarisi atribut dan method dari parent class.',
                'feedback_incorrect' => 'Petunjuk: parent class lebih dulu, lalu child class extends parent, kemudian object dipakai di main.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertItems($qHard3, [
                'class Orang {',
                '    String nama = "Andi";',
                '    String sekolah = "SMK 1";',
                '}',
                'class Siswa extends Orang {',
                '}',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Siswa s = new Siswa();',
                '        System.out.println("Nama: " + s.nama);',
                '        System.out.println("Sekolah: " + s.sekolah);',
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