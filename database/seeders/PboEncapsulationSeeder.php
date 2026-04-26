<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PboEncapsulationSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $now = now();
            $createdBy = 2; // sesuaikan dengan id dosen/user yang kamu mau

            $materialName = 'Encapsulation pada Pemrograman Berorientasi Objek';

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
                        'order_number' => 2,
                        'description' => 'Pada materi ini, siswa mempelajari konsep encapsulation, access modifier, serta penggunaan getter dan setter pada Pemrograman Berorientasi Objek.',
                        'content' => null,
                        'created_by' => $createdBy,
                        'updated_at' => $now,
                    ]);
            } else {
                $materialId = DB::table('materials')->insertGetId([
                    'material_name' => $materialName,
                    'order_number' => 2,
                    'description' => 'Pada materi ini, siswa mempelajari konsep encapsulation, access modifier, serta penggunaan getter dan setter pada Pemrograman Berorientasi Objek.',
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
                1 => 'Pengertian Encapsulation',
                2 => 'Access Modifier pada Class',
                3 => 'Getter dan Setter',
                4 => 'Manfaat Encapsulation',
                5 => 'Contoh Implementasi Encapsulation',
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
                    'title' => 'Pengertian Encapsulation',
                    'content_text' => "Encapsulation adalah konsep dalam Pemrograman Berorientasi Objek untuk membungkus data dan method dalam satu kesatuan, serta membatasi akses langsung ke data.\n\nDengan encapsulation, atribut biasanya dibuat private lalu diakses melalui method tertentu seperti getter dan setter.",
                    'image_path' => null,
                    'sort_order' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicIds[2],
                    'title' => 'Access Modifier pada Class',
                    'content_text' => "Access modifier digunakan untuk menentukan tingkat akses terhadap atribut atau method.\n\nJenis access modifier yang umum:\n- public: dapat diakses dari mana saja\n- private: hanya dapat diakses dari dalam class itu sendiri\n- protected: dapat diakses dari class itu sendiri dan turunannya",
                    'image_path' => null,
                    'sort_order' => 2,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicIds[3],
                    'title' => 'Getter dan Setter',
                    'content_text' => "Getter adalah method untuk mengambil nilai atribut.\nSetter adalah method untuk mengubah nilai atribut.\n\nGetter dan setter digunakan agar data private tetap bisa diakses secara aman dan terkontrol.",
                    'image_path' => null,
                    'sort_order' => 3,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicIds[4],
                    'title' => 'Manfaat Encapsulation',
                    'content_text' => "Manfaat encapsulation antara lain:\n- melindungi data dari perubahan langsung\n- menjaga keamanan data\n- memudahkan pengontrolan validasi data\n- membuat kode lebih rapi dan terstruktur",
                    'image_path' => null,
                    'sort_order' => 4,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicIds[5],
                    'title' => 'Contoh Implementasi',
                    'content_text' => "Contoh:\nclass Mahasiswa {\n    private String nama;\n\n    public void setNama(String nama) {\n        this.nama = nama;\n    }\n\n    public String getNama() {\n        return nama;\n    }\n}\n\nAtribut nama dibuat private, lalu diakses melalui setter dan getter.",
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
                'question_text' => 'Encapsulation dalam PBO adalah...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Benar, encapsulation berhubungan dengan pembungkusan data dan pembatasan akses.',
                'feedback_incorrect' => 'Petunjuk: encapsulation berkaitan dengan perlindungan data dalam class.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $q2 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $pretestId,
                'subtopic_id' => $subtopicIds[2],
                'type' => 'multiple_choice',
                'question_text' => 'Access modifier private berarti...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Tepat, private hanya dapat diakses dari dalam class yang sama.',
                'feedback_incorrect' => 'Petunjuk: private membatasi akses paling ketat.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $q3 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $pretestId,
                'subtopic_id' => $subtopicIds[3],
                'type' => 'multiple_choice',
                'question_text' => 'Getter digunakan untuk...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Benar, getter digunakan untuk mengambil nilai atribut.',
                'feedback_incorrect' => 'Petunjuk: getter tidak mengubah data, tetapi mengambil nilainya.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $q4 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $pretestId,
                'subtopic_id' => $subtopicIds[3],
                'type' => 'multiple_choice',
                'question_text' => 'Setter digunakan untuk...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Bagus, setter dipakai untuk mengubah atau memberi nilai atribut.',
                'feedback_incorrect' => 'Petunjuk: setter berfungsi saat kita ingin memberi atau memperbarui nilai atribut.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $q5 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $pretestId,
                'subtopic_id' => $subtopicIds[4],
                'type' => 'multiple_choice',
                'question_text' => 'Salah satu manfaat encapsulation adalah...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Tepat, encapsulation membantu melindungi data dari akses langsung.',
                'feedback_incorrect' => 'Petunjuk: fokus pada keamanan dan kontrol data.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($q1, [
                ['Pewarisan antar class', 0],
                ['Membungkus data dan method serta membatasi akses', 1],
                ['Proses membuat object', 0],
                ['Penggunaan banyak class sekaligus', 0],
            ], $now);

            $this->insertOptions($q2, [
                ['Bisa diakses dari mana saja', 0],
                ['Hanya bisa diakses dari dalam class itu sendiri', 1],
                ['Hanya bisa diakses dari package lain', 0],
                ['Tidak bisa dipakai dalam Java', 0],
            ], $now);

            $this->insertOptions($q3, [
                ['Menghapus atribut', 0],
                ['Menampilkan seluruh program', 0],
                ['Mengambil nilai atribut', 1],
                ['Membuat object baru', 0],
            ], $now);

            $this->insertOptions($q4, [
                ['Mengambil nilai atribut', 0],
                ['Mengubah atau memberi nilai atribut', 1],
                ['Mencetak object', 0],
                ['Menghapus class', 0],
            ], $now);

            $this->insertOptions($q5, [
                ['Data menjadi tidak teratur', 0],
                ['Data dapat diakses bebas tanpa aturan', 0],
                ['Melindungi data dari akses langsung', 1],
                ['Menghapus seluruh method', 0],
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
                'question_text' => 'Manakah penulisan atribut yang sesuai dengan konsep encapsulation?',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Benar, atribut pada encapsulation umumnya dibuat private.',
                'feedback_incorrect' => 'Petunjuk: atribut biasanya tidak diakses langsung dari luar class.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qEasy1, [
                ['public String nama;', 0],
                ['private String nama;', 1],
                ['protected class nama;', 0],
                ['object String nama;', 0],
            ], $now);

            $qEasy2 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceEasyId,
                'subtopic_id' => $subtopicIds[3],
                'type' => 'multiple_choice',
                'question_text' => 'Method getNama() biasanya digunakan untuk...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Tepat, method getter dipakai untuk mengambil isi atribut.',
                'feedback_incorrect' => 'Petunjuk: awalan get biasanya berarti mengambil nilai.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qEasy2, [
                ['Mengubah nama', 0],
                ['Mengambil nilai nama', 1],
                ['Menghapus nama', 0],
                ['Membuat object nama', 0],
            ], $now);

            $qEasy3 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceEasyId,
                'subtopic_id' => $subtopicIds[5],
                'type' => 'drag_drop',
                'question_text' => 'Susun potongan kode berikut agar menjadi class Java yang benar dengan atribut private dan getter.',
                'image_path' => null,
                'points' => 20,
                'code_snippet' => "Output saat dipakai:\nAndi",
                'feedback_correct' => 'Bagus, kamu sudah menyusun class encapsulation dengan benar.',
                'feedback_incorrect' => 'Petunjuk: deklarasikan class, atribut private, lalu method getter di dalam class.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertItems($qEasy3, [
                'class Mahasiswa {',
                '    private String nama = "Andi";',
                '    public String getNama() {',
                '        return nama;',
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
                'question_text' => 'Mengapa atribut pada encapsulation sering dibuat private?',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Benar, private dipakai agar data tidak diakses langsung sembarangan.',
                'feedback_incorrect' => 'Petunjuk: private membantu menjaga keamanan dan kontrol data.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qMedium1, [
                ['Agar bisa diakses semua class', 0],
                ['Agar data terlindungi dari akses langsung', 1],
                ['Agar method tidak dapat dipakai', 0],
                ['Agar class menjadi object', 0],
            ], $now);

            $qMedium2 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceMediumId,
                'subtopic_id' => $subtopicIds[3],
                'type' => 'multiple_choice',
                'question_text' => 'Pasangan method yang biasa digunakan pada encapsulation adalah...',
                'image_path' => null,
                'points' => 10,
                'code_snippet' => null,
                'feedback_correct' => 'Tepat, getter dan setter adalah pasangan umum dalam encapsulation.',
                'feedback_incorrect' => 'Petunjuk: satu untuk mengambil, satu untuk mengubah nilai.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qMedium2, [
                ['main dan println', 0],
                ['getter dan setter', 1],
                ['class dan object', 0],
                ['public dan private', 0],
            ], $now);

            $qMedium3 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceMediumId,
                'subtopic_id' => $subtopicIds[5],
                'type' => 'drag_drop',
                'question_text' => 'Susun potongan kode berikut agar menjadi program Java yang benar untuk mengisi dan menampilkan data menggunakan setter dan getter.',
                'image_path' => null,
                'points' => 20,
                'code_snippet' => "Output:\nSofi",
                'feedback_correct' => 'Bagus, urutan class, setter, getter, dan pemanggilan object sudah benar.',
                'feedback_incorrect' => 'Petunjuk: buat class lebih dulu, lalu setter/getter, kemudian object dipakai di main.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertItems($qMedium3, [
                'class Mahasiswa {',
                '    private String nama;',
                '    public void setNama(String nama) {',
                '        this.nama = nama;',
                '    }',
                '    public String getNama() {',
                '        return nama;',
                '    }',
                '}',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Mahasiswa m = new Mahasiswa();',
                '        m.setNama("Sofi");',
                '        System.out.println(m.getNama());',
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
                'question_text' => "Perhatikan kode berikut:\nclass User {\n    private String password;\n}\nTujuan atribut password dibuat private adalah...",
                'image_path' => null,
                'points' => 10,
                'code_snippet' => "class User {\n    private String password;\n}",
                'feedback_correct' => 'Benar, data sensitif seperti password harus dilindungi dari akses langsung.',
                'feedback_incorrect' => 'Petunjuk: private sangat cocok untuk data penting agar tetap aman.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qHard1, [
                ['Agar password bisa diubah bebas dari luar class', 0],
                ['Agar password tidak bisa diakses langsung dari luar class', 1],
                ['Agar class tidak bisa dipakai', 0],
                ['Agar object tidak perlu dibuat', 0],
            ], $now);

            $qHard2 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceHardId,
                'subtopic_id' => $subtopicIds[3],
                'type' => 'multiple_choice',
                'question_text' => "Perhatikan method berikut:\npublic void setUmur(int umur) {\n    if (umur > 0) {\n        this.umur = umur;\n    }\n}\nFungsi pengecekan pada setter tersebut adalah...",
                'image_path' => null,
                'points' => 10,
                'code_snippet' => "public void setUmur(int umur) {\n    if (umur > 0) {\n        this.umur = umur;\n    }\n}",
                'feedback_correct' => 'Tepat, setter bisa dipakai untuk memvalidasi data sebelum disimpan.',
                'feedback_incorrect' => 'Petunjuk: encapsulation bukan hanya menyembunyikan data, tetapi juga mengontrol nilainya.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertOptions($qHard2, [
                ['Mencetak umur ke layar', 0],
                ['Menghapus atribut umur', 0],
                ['Memvalidasi data sebelum disimpan', 1],
                ['Membuat object baru', 0],
            ], $now);

            $qHard3 = DB::table('practice_questions')->insertGetId([
                'practices_id' => $practiceHardId,
                'subtopic_id' => $subtopicIds[5],
                'type' => 'drag_drop',
                'question_text' => 'Susun potongan kode berikut agar menjadi program Java yang benar dengan encapsulation dan dua method accessor.',
                'image_path' => null,
                'points' => 25,
                'code_snippet' => "Output:\nBuku PBO",
                'feedback_correct' => 'Urutan sudah benar. Atribut private diakses melalui setter dan getter.',
                'feedback_incorrect' => 'Petunjuk: definisikan class dulu, lalu atribut private, setter/getter, kemudian gunakan object di main.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertItems($qHard3, [
                'class Buku {',
                '    private String judul;',
                '    public void setJudul(String judul) {',
                '        this.judul = judul;',
                '    }',
                '    public String getJudul() {',
                '        return judul;',
                '    }',
                '}',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Buku b = new Buku();',
                '        b.setJudul("Buku PBO");',
                '        System.out.println(b.getJudul());',
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