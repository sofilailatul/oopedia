<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use RuntimeException;

class QuizOneSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        /*
        |--------------------------------------------------------------------------
        | CONFIG
        |--------------------------------------------------------------------------
        | Sesuaikan class_id dan created_by jika ID pada database kamu berbeda.
        */

        $classId = 1;
        $createdBy = 2;
        $quizTitle = 'Quiz 1 - Class dan Object & Encapsulation';

        /*
        |--------------------------------------------------------------------------
        | GET MATERIALS
        |--------------------------------------------------------------------------
        */

        $materialOne = DB::table('materials')
            ->where('material_name', 'Class dan Object')
            ->first();

        $materialTwo = DB::table('materials')
            ->where('material_name', 'Encapsulation')
            ->first();

        if (!$materialOne) {
            throw new RuntimeException('Material "Class dan Object" belum ditemukan. Jalankan MaterialOneSeeder terlebih dahulu.');
        }

        if (!$materialTwo) {
            throw new RuntimeException('Material "Encapsulation" belum ditemukan. Jalankan MaterialTwoSeeder terlebih dahulu.');
        }

        /*
        |--------------------------------------------------------------------------
        | DELETE OLD QUIZ DATA
        |--------------------------------------------------------------------------
        | Supaya ketika seeder dijalankan ulang, data quiz tidak dobel.
        */

        $this->deleteExistingQuiz($quizTitle);

        /*
        |--------------------------------------------------------------------------
        | CREATE QUIZ
        |--------------------------------------------------------------------------
        */

        $quizId = DB::table('quizzes')->insertGetId([
            'title' => $quizTitle,
            'class_id' => $classId,
            'created_by' => $createdBy,
            'duration' => 30,
            'passing_score' => 60,
            'start_at' => null,
            'end_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        /*
        |--------------------------------------------------------------------------
        | QUIZ MATERIALS
        |--------------------------------------------------------------------------
        */

        DB::table('quiz_materials')->insert([
            [
                'quizzes_id' => $quizId,
                'material_id' => $materialOne->id,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'quizzes_id' => $quizId,
                'material_id' => $materialTwo->id,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | SUBTOPIC MAP
        |--------------------------------------------------------------------------
        */

        $subtopics = DB::table('subtopics')
            ->whereIn('material_id', [$materialOne->id, $materialTwo->id])
            ->get();

        $subtopicMap = [];

        foreach ($subtopics as $subtopic) {
            $subtopicMap[$subtopic->material_id][$subtopic->name] = $subtopic->id;
        }

        /*
        |--------------------------------------------------------------------------
        | QUIZ QUESTIONS
        |--------------------------------------------------------------------------
        | Total: 20 soal.
        | Poin: 5 per soal.
        | Total nilai: 100.
        */

        $questions = [
            /*
            |--------------------------------------------------------------------------
            | MATERI 1: CLASS DAN OBJECT
            |--------------------------------------------------------------------------
            */

            [
                'material_name' => 'Class dan Object',
                'material_id' => $materialOne->id,
                'subtopic' => 'Pengantar Pemrograman Berbasis Objek',
                'quiz_text' => 'Dalam Pemrograman Berbasis Objek, program dipandang sebagai kumpulan object. Pernyataan manakah yang paling tepat menggambarkan object?',
                'feedback_correct' => 'Benar. Object merepresentasikan sesuatu yang memiliki data dan perilaku.',
                'feedback_incorrect' => 'Perhatikan kembali konsep utama PBO. Hint: object memiliki attribute dan method.',
                'options' => [
                    ['text' => 'Representasi sesuatu yang memiliki data dan perilaku', 'is_correct' => true],
                    ['text' => 'Perintah khusus untuk mencetak teks ke layar', 'is_correct' => false],
                    ['text' => 'Nama file tempat program Java disimpan', 'is_correct' => false],
                    ['text' => 'Tipe data untuk menyimpan bilangan desimal', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Class dan Object',
                'material_id' => $materialOne->id,
                'subtopic' => 'Struktur Dasar Class',
                'quiz_text' => 'Apa fungsi utama class dalam program Java berbasis objek?',
                'feedback_correct' => 'Benar. Class berfungsi sebagai rancangan atau cetakan untuk membuat object.',
                'feedback_incorrect' => 'Perhatikan kembali hubungan class dan object. Hint: class belum menjadi data nyata sebelum dibuat object.',
                'options' => [
                    ['text' => 'Sebagai rancangan atau cetakan untuk membuat object', 'is_correct' => true],
                    ['text' => 'Sebagai output akhir dari program', 'is_correct' => false],
                    ['text' => 'Sebagai perintah untuk menghapus object', 'is_correct' => false],
                    ['text' => 'Sebagai tempat menyimpan hasil query database', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Class dan Object',
                'material_id' => $materialOne->id,
                'subtopic' => 'Struktur Dasar Class',
                'quiz_text' => 'Perhatikan potongan kode berikut: class Produk { String nama; int harga; }. Bagian "String nama" dan "int harga" disebut sebagai ...',
                'feedback_correct' => 'Benar. nama dan harga merupakan attribute karena menyimpan data object.',
                'feedback_incorrect' => 'Perhatikan letak variabel di dalam class. Hint: data atau karakteristik object disebut attribute.',
                'options' => [
                    ['text' => 'Attribute', 'is_correct' => true],
                    ['text' => 'Object', 'is_correct' => false],
                    ['text' => 'Constructor', 'is_correct' => false],
                    ['text' => 'Package', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Class dan Object',
                'material_id' => $materialOne->id,
                'subtopic' => 'Pembuatan Object dari Class',
                'quiz_text' => 'Pada kode Mahasiswa mhs = new Mahasiswa();, keyword new digunakan untuk ...',
                'feedback_correct' => 'Benar. Keyword new digunakan untuk membuat object baru dari sebuah class.',
                'feedback_incorrect' => 'Perhatikan proses instansiasi object. Hint: object dibuat dari class menggunakan keyword tertentu.',
                'options' => [
                    ['text' => 'Membuat object baru dari class Mahasiswa', 'is_correct' => true],
                    ['text' => 'Menghapus class Mahasiswa', 'is_correct' => false],
                    ['text' => 'Mengubah attribute menjadi private', 'is_correct' => false],
                    ['text' => 'Memanggil method tanpa object', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Class dan Object',
                'material_id' => $materialOne->id,
                'subtopic' => 'Pembuatan Object dari Class',
                'quiz_text' => 'Jika terdapat dua object dari class yang sama, pernyataan manakah yang benar?',
                'feedback_correct' => 'Benar. Object yang berbeda dapat memiliki nilai attribute yang berbeda walaupun berasal dari class yang sama.',
                'feedback_incorrect' => 'Perhatikan kembali konsep satu class dapat menghasilkan banyak object. Hint: nilai attribute tiap object dapat berbeda.',
                'options' => [
                    ['text' => 'Kedua object dapat memiliki nilai attribute yang berbeda', 'is_correct' => true],
                    ['text' => 'Kedua object pasti memiliki nama variabel yang sama', 'is_correct' => false],
                    ['text' => 'Class tidak boleh membuat lebih dari satu object', 'is_correct' => false],
                    ['text' => 'Object kedua akan menghapus object pertama', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Class dan Object',
                'material_id' => $materialOne->id,
                'subtopic' => 'Attribute dan Method dalam Class',
                'quiz_text' => 'Dalam sebuah class, method digunakan untuk ...',
                'feedback_correct' => 'Benar. Method digunakan untuk menyatakan perilaku atau aksi yang dapat dilakukan object.',
                'feedback_incorrect' => 'Perhatikan perbedaan attribute dan method. Hint: method berisi aksi atau proses.',
                'options' => [
                    ['text' => 'Menyatakan perilaku atau aksi object', 'is_correct' => true],
                    ['text' => 'Menyimpan data object secara langsung saja', 'is_correct' => false],
                    ['text' => 'Menentukan nama database', 'is_correct' => false],
                    ['text' => 'Mengganti nama file Java', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Class dan Object',
                'material_id' => $materialOne->id,
                'subtopic' => 'Attribute dan Method dalam Class',
                'quiz_text' => 'Jika class MataKuliah memiliki attribute nama dan sks, lalu method tampilkanInfo() mencetak kedua attribute tersebut, hubungan yang tepat adalah ...',
                'feedback_correct' => 'Benar. Attribute menyimpan data, sedangkan method menggunakan data tersebut.',
                'feedback_incorrect' => 'Perhatikan hubungan data dan perilaku dalam class. Hint: method dapat memakai attribute yang ada di class.',
                'options' => [
                    ['text' => 'Attribute menyimpan data dan method menggunakan data tersebut', 'is_correct' => true],
                    ['text' => 'Method menyimpan data dan attribute menjalankan program utama', 'is_correct' => false],
                    ['text' => 'Attribute hanya boleh dibuat di luar class', 'is_correct' => false],
                    ['text' => 'Method tidak boleh menggunakan attribute', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Class dan Object',
                'material_id' => $materialOne->id,
                'subtopic' => 'Constructor',
                'quiz_text' => 'Ciri constructor yang benar dalam Java adalah ...',
                'feedback_correct' => 'Benar. Constructor memiliki nama yang sama dengan class dan tidak memiliki return type.',
                'feedback_incorrect' => 'Perhatikan ciri khusus constructor. Hint: constructor bukan method biasa dan tidak memakai void.',
                'options' => [
                    ['text' => 'Namanya sama dengan class dan tidak memiliki return type', 'is_correct' => true],
                    ['text' => 'Selalu bernama main dan bertipe void', 'is_correct' => false],
                    ['text' => 'Harus ditulis di luar class', 'is_correct' => false],
                    ['text' => 'Hanya boleh digunakan untuk mencetak output', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Class dan Object',
                'material_id' => $materialOne->id,
                'subtopic' => 'Constructor',
                'quiz_text' => 'Mengapa constructor sering digunakan saat membuat object?',
                'feedback_correct' => 'Benar. Constructor membantu memberi nilai awal sehingga object siap digunakan.',
                'feedback_incorrect' => 'Perhatikan kapan constructor dijalankan. Hint: constructor berjalan saat object dibuat.',
                'options' => [
                    ['text' => 'Untuk memberi nilai awal pada object saat object dibuat', 'is_correct' => true],
                    ['text' => 'Untuk menghapus semua attribute pada class', 'is_correct' => false],
                    ['text' => 'Untuk membuat class menjadi package', 'is_correct' => false],
                    ['text' => 'Untuk mengganti keyword new', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Class dan Object',
                'material_id' => $materialOne->id,
                'subtopic' => 'Keyword this',
                'quiz_text' => 'Pada kode this.nama = nama;, bagian this.nama merujuk pada ...',
                'feedback_correct' => 'Benar. this.nama merujuk pada attribute nama milik object yang sedang aktif.',
                'feedback_incorrect' => 'Perhatikan posisi this pada constructor. Hint: this menunjuk object saat ini.',
                'options' => [
                    ['text' => 'Attribute nama milik object yang sedang aktif', 'is_correct' => true],
                    ['text' => 'Parameter nama yang dikirim ke constructor', 'is_correct' => false],
                    ['text' => 'Nama class yang sedang dibuat', 'is_correct' => false],
                    ['text' => 'Nama file Java yang dijalankan', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Class dan Object',
                'material_id' => $materialOne->id,
                'subtopic' => 'Keyword this',
                'quiz_text' => 'Keyword this paling sering diperlukan ketika ...',
                'feedback_correct' => 'Benar. this sering digunakan saat nama attribute dan parameter sama.',
                'feedback_incorrect' => 'Perhatikan fungsi this dalam constructor. Hint: this membantu membedakan attribute dan parameter.',
                'options' => [
                    ['text' => 'Nama attribute dan parameter sama', 'is_correct' => true],
                    ['text' => 'Class tidak memiliki attribute', 'is_correct' => false],
                    ['text' => 'Program tidak menggunakan object', 'is_correct' => false],
                    ['text' => 'Semua method berada di luar class', 'is_correct' => false],
                ],
            ],

            /*
            |--------------------------------------------------------------------------
            | MATERI 2: ENCAPSULATION
            |--------------------------------------------------------------------------
            */

            [
                'material_name' => 'Encapsulation',
                'material_id' => $materialTwo->id,
                'subtopic' => 'Konsep Encapsulation',
                'quiz_text' => 'Apa tujuan utama encapsulation dalam Pemrograman Berbasis Objek?',
                'feedback_correct' => 'Benar. Encapsulation bertujuan melindungi data dan mengontrol akses terhadap data.',
                'feedback_incorrect' => 'Perhatikan konsep pembungkusan data. Hint: data tidak sebaiknya diakses sembarangan.',
                'options' => [
                    ['text' => 'Melindungi data dan mengontrol akses terhadap data', 'is_correct' => true],
                    ['text' => 'Membuat semua attribute dapat diakses langsung', 'is_correct' => false],
                    ['text' => 'Menghapus kebutuhan method dalam class', 'is_correct' => false],
                    ['text' => 'Membuat object tanpa class', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Encapsulation',
                'material_id' => $materialTwo->id,
                'subtopic' => 'Konsep Encapsulation',
                'quiz_text' => 'Mengapa akses langsung ke attribute sering dihindari dalam encapsulation?',
                'feedback_correct' => 'Benar. Akses langsung dapat menyebabkan data diubah tanpa aturan atau validasi.',
                'feedback_incorrect' => 'Perhatikan risiko data yang tidak dikontrol. Hint: data bisa menjadi tidak valid.',
                'options' => [
                    ['text' => 'Karena data dapat diubah tanpa aturan atau validasi', 'is_correct' => true],
                    ['text' => 'Karena Java tidak mendukung attribute', 'is_correct' => false],
                    ['text' => 'Karena object tidak boleh memiliki data', 'is_correct' => false],
                    ['text' => 'Karena method hanya boleh digunakan di luar class', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Encapsulation',
                'material_id' => $materialTwo->id,
                'subtopic' => 'Access Modifier',
                'quiz_text' => 'Access modifier private berarti ...',
                'feedback_correct' => 'Benar. private berarti hanya dapat diakses dari dalam class itu sendiri.',
                'feedback_incorrect' => 'Perhatikan tingkat akses private. Hint: private adalah akses paling terbatas.',
                'options' => [
                    ['text' => 'Hanya dapat diakses dari dalam class itu sendiri', 'is_correct' => true],
                    ['text' => 'Dapat diakses bebas dari semua class', 'is_correct' => false],
                    ['text' => 'Hanya dapat digunakan untuk method main', 'is_correct' => false],
                    ['text' => 'Selalu membuat program error', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Encapsulation',
                'material_id' => $materialTwo->id,
                'subtopic' => 'Access Modifier',
                'quiz_text' => 'Dalam penerapan encapsulation, attribute biasanya dibuat private agar ...',
                'feedback_correct' => 'Benar. Attribute private mencegah data diubah langsung dari luar class.',
                'feedback_incorrect' => 'Perhatikan alasan penggunaan private. Hint: data perlu dilindungi dari akses langsung.',
                'options' => [
                    ['text' => 'Data tidak dapat diubah langsung dari luar class', 'is_correct' => true],
                    ['text' => 'Data dapat diubah oleh semua class tanpa batas', 'is_correct' => false],
                    ['text' => 'Class tidak dapat dibuat object', 'is_correct' => false],
                    ['text' => 'Setter tidak dapat digunakan', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Encapsulation',
                'material_id' => $materialTwo->id,
                'subtopic' => 'Attribute private',
                'quiz_text' => 'Jika attribute harga dibuat private, cara yang tepat untuk mengubah nilainya dari luar class adalah ...',
                'feedback_correct' => 'Benar. Attribute private diubah melalui setter agar aksesnya terkontrol.',
                'feedback_incorrect' => 'Perhatikan cara mengakses attribute private. Hint: gunakan method yang disediakan class.',
                'options' => [
                    ['text' => 'Menggunakan method setter', 'is_correct' => true],
                    ['text' => 'Mengubah langsung dengan object.harga', 'is_correct' => false],
                    ['text' => 'Menghapus keyword private', 'is_correct' => false],
                    ['text' => 'Menulis attribute di luar class', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Encapsulation',
                'material_id' => $materialTwo->id,
                'subtopic' => 'Attribute private',
                'quiz_text' => 'Apa risiko jika attribute saldo dibuat public?',
                'feedback_correct' => 'Benar. Jika saldo public, nilainya dapat diubah langsung tanpa kontrol.',
                'feedback_incorrect' => 'Perhatikan keamanan data. Hint: attribute public dapat diakses langsung dari luar class.',
                'options' => [
                    ['text' => 'Nilai saldo dapat diubah langsung tanpa kontrol', 'is_correct' => true],
                    ['text' => 'Saldo tidak dapat ditampilkan sama sekali', 'is_correct' => false],
                    ['text' => 'Class tidak dapat memiliki method', 'is_correct' => false],
                    ['text' => 'Constructor pasti tidak bisa digunakan', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Encapsulation',
                'material_id' => $materialTwo->id,
                'subtopic' => 'Getter dan Setter',
                'quiz_text' => 'Fungsi getter dalam encapsulation adalah ...',
                'feedback_correct' => 'Benar. Getter digunakan untuk mengambil nilai attribute private.',
                'feedback_incorrect' => 'Perhatikan awalan get pada method. Hint: getter digunakan untuk membaca data.',
                'options' => [
                    ['text' => 'Mengambil nilai attribute private', 'is_correct' => true],
                    ['text' => 'Menghapus nilai attribute private', 'is_correct' => false],
                    ['text' => 'Membuat object baru dari class', 'is_correct' => false],
                    ['text' => 'Mengubah nama class', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Encapsulation',
                'material_id' => $materialTwo->id,
                'subtopic' => 'Getter dan Setter',
                'quiz_text' => 'Fungsi setter dalam encapsulation adalah ...',
                'feedback_correct' => 'Benar. Setter digunakan untuk mengisi atau mengubah nilai attribute private.',
                'feedback_incorrect' => 'Perhatikan awalan set pada method. Hint: setter digunakan untuk memberi nilai baru.',
                'options' => [
                    ['text' => 'Mengisi atau mengubah nilai attribute private', 'is_correct' => true],
                    ['text' => 'Mengambil nilai tanpa parameter', 'is_correct' => false],
                    ['text' => 'Menghapus object dari memori', 'is_correct' => false],
                    ['text' => 'Menjalankan inheritance', 'is_correct' => false],
                ],
            ],
            [
                'material_name' => 'Encapsulation',
                'material_id' => $materialTwo->id,
                'subtopic' => 'Validasi Data Menggunakan Setter',
                'quiz_text' => 'Mengapa validasi sebaiknya dilakukan di dalam setter?',
                'feedback_correct' => 'Benar. Setter dapat memeriksa data sebelum menyimpannya ke attribute.',
                'feedback_incorrect' => 'Perhatikan fungsi setter dalam mengontrol perubahan data. Hint: data diperiksa sebelum masuk ke object.',
                'options' => [
                    ['text' => 'Agar data diperiksa sebelum disimpan ke attribute', 'is_correct' => true],
                    ['text' => 'Agar semua data langsung diterima tanpa aturan', 'is_correct' => false],
                    ['text' => 'Agar getter tidak bisa digunakan', 'is_correct' => false],
                    ['text' => 'Agar attribute menjadi public', 'is_correct' => false],
                ],
            ],
        ];

        foreach ($questions as $question) {
            $subtopicId = $this->getSubtopicId(
                $subtopicMap,
                $question['material_id'],
                $question['subtopic']
            );

            $quizQuestionId = DB::table('quiz_questions')->insertGetId([
                'material_id' => $question['material_id'],
                'subtopic_id' => $subtopicId,
                'quiz_text' => $question['quiz_text'],
                'image_path' => null,
                'feedback_correct' => $question['feedback_correct'],
                'feedback_incorrect' => $question['feedback_incorrect'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($question['options'] as $option) {
                DB::table('quiz_options')->insert([
                    'quiz_questions_id' => $quizQuestionId,
                    'option_text' => $option['text'],
                    'is_correct' => $option['is_correct'] ? 1 : 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('quiz_map')->insert([
                'quiz_id' => $quizId,
                'quiz_question_id' => $quizQuestionId,
                'points' => 5,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function getSubtopicId(array $subtopicMap, int $materialId, string $subtopicName): int
    {
        if (!isset($subtopicMap[$materialId][$subtopicName])) {
            throw new RuntimeException("Subtopik {$subtopicName} belum ditemukan pada material_id {$materialId}.");
        }

        return (int) $subtopicMap[$materialId][$subtopicName];
    }

    private function deleteExistingQuiz(string $quizTitle): void
    {
        $quiz = DB::table('quizzes')
            ->where('title', $quizTitle)
            ->first();

        if (!$quiz) {
            return;
        }

        $quizQuestionIds = DB::table('quiz_map')
            ->where('quiz_id', $quiz->id)
            ->pluck('quiz_question_id')
            ->toArray();

        if (!empty($quizQuestionIds)) {
            DB::table('quiz_options')
                ->whereIn('quiz_questions_id', $quizQuestionIds)
                ->delete();

            DB::table('quiz_questions')
                ->whereIn('id', $quizQuestionIds)
                ->delete();
        }

        DB::table('quiz_map')
            ->where('quiz_id', $quiz->id)
            ->delete();

        DB::table('quiz_materials')
            ->where('quizzes_id', $quiz->id)
            ->delete();

        DB::table('quizzes')
            ->where('id', $quiz->id)
            ->delete();
    }
}
