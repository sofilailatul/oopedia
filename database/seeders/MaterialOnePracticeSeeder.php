<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use RuntimeException;

class MaterialOnePracticeSeeder extends Seeder
{
    private array $subtopics = [
        'Pengantar Pemrograman Berbasis Objek',
        'Struktur Dasar Class',
        'Pembuatan Object dari Class',
        'Attribute dan Method dalam Class',
        'Constructor',
        'Keyword this',
    ];

    private array $mcBank = [
        'Pengantar Pemrograman Berbasis Objek' => [
            ['Apa fokus utama paradigma Pemrograman Berbasis Objek?', 'Object yang memiliki data dan perilaku', 'Urutan instruksi tanpa object', 'Perintah SQL untuk database', 'Format tampilan halaman web'],
            ['Dalam PBO, attribute berfungsi untuk apa?', 'Menyimpan data atau karakteristik object', 'Menghapus class dari memori', 'Menjalankan server', 'Mengubah nama package'],
            ['Dalam PBO, method menggambarkan apa?', 'Perilaku atau aksi yang dapat dilakukan object', 'Nama database', 'Jenis file gambar', 'Alamat penyimpanan project'],
            ['Contoh object dalam sistem akademik adalah ...', 'Mahasiswa', 'println', 'public', 'semicolon'],
            ['Mengapa PBO membantu program yang besar?', 'Karena data dan proses yang berkaitan dapat dikelompokkan dalam class', 'Karena semua kode harus ditulis dalam satu baris', 'Karena tidak membutuhkan struktur data', 'Karena tidak menggunakan method'],
            ['Komponen object yang menyimpan data disebut ...', 'attribute', 'method', 'package', 'compiler'],
        ],
        'Struktur Dasar Class' => [
            ['Apa pengertian class dalam Java?', 'Rancangan atau cetakan untuk membuat object', 'Hasil nyata dari object', 'Perintah untuk menutup program', 'Nilai akhir dari output'],
            ['Bagian yang biasanya berada di dalam class tetapi di luar method disebut ...', 'attribute', 'database', 'browser', 'folder'],
            ['Keyword yang digunakan untuk mendeklarasikan class adalah ...', 'class', 'new', 'return', 'break'],
            ['Penulisan nama class yang umum dalam Java adalah ...', 'Diawali huruf kapital, misalnya Mahasiswa', 'Selalu diawali angka', 'Selalu memakai spasi', 'Selalu memakai tanda minus'],
            ['Jika method ditulis di luar blok class, maka yang paling mungkin terjadi adalah ...', 'Program error karena struktur class tidak benar', 'Program otomatis membuat object', 'Output menjadi lebih cepat', 'Class berubah menjadi interface'],
            ['Bagian class yang menyatakan perilaku object adalah ...', 'method', 'attribute', 'database', 'folder'],
        ],
        'Pembuatan Object dari Class' => [
            ['Apa yang dimaksud object?', 'Instance atau hasil nyata dari sebuah class', 'Blueprint untuk membuat class', 'Komentar dalam kode', 'Tipe data khusus database'],
            ['Keyword untuk membuat object baru di Java adalah ...', 'new', 'class', 'extends', 'private'],
            ['Pada kode Mahasiswa mhs = new Mahasiswa();, nama object adalah ...', 'mhs', 'Mahasiswa', 'new', 'String'],
            ['Tanda yang digunakan untuk mengakses attribute atau method object adalah ...', 'tanda titik (.)', 'tanda pagar (#)', 'tanda persen (%)', 'tanda dolar ($)'],
            ['Satu class dapat digunakan untuk membuat ...', 'banyak object dengan nilai attribute berbeda', 'hanya satu output saja', 'hanya satu baris kode', 'hanya method static'],
            ['Setelah object dibuat, method object dipanggil dengan format ...', 'namaObject.namaMethod()', 'namaClass extends object', 'public private method', 'return class()'],
        ],
        'Attribute dan Method dalam Class' => [
            ['Dalam class Mahasiswa, nama dan nim paling tepat disebut ...', 'attribute', 'package', 'operator', 'constructor wajib'],
            ['Method biasanya digunakan untuk ...', 'menjalankan aksi atau proses pada object', 'menyimpan file gambar', 'membuat database baru', 'mengganti sistem operasi'],
            ['Pada kode void tampilkanData(), bagian tersebut merupakan ...', 'method', 'attribute', 'object', 'literal'],
            ['Mengapa attribute dan method diletakkan dalam class yang sama?', 'Agar data dan perilaku yang berkaitan tersusun rapi', 'Agar Java tidak perlu compiler', 'Agar semua attribute menjadi public', 'Agar object tidak dapat dibuat'],
            ['Jika method menampilkan nilai nama dan nim, maka method tersebut menggunakan ...', 'attribute milik class', 'nama folder project', 'query SQL', 'CSS selector'],
            ['Attribute harga pada class Produk sebaiknya bertipe ...', 'int atau double', 'void', 'class', 'return'],
        ],
        'Constructor' => [
            ['Apa fungsi utama constructor?', 'Memberi nilai awal pada object saat object dibuat', 'Menghapus semua attribute', 'Mengubah Java menjadi HTML', 'Menutup class secara otomatis'],
            ['Ciri constructor yang benar adalah ...', 'Namanya sama dengan nama class dan tidak memiliki return type', 'Selalu bernama main', 'Selalu memakai void', 'Selalu berada di luar class'],
            ['Kapan constructor dipanggil?', 'Saat object dibuat menggunakan new', 'Saat file gambar dibuka', 'Saat database dihapus', 'Saat komentar ditulis'],
            ['Jika class bernama Mahasiswa, nama constructor yang benar adalah ...', 'Mahasiswa', 'constructor', 'Main', 'buatMahasiswa'],
            ['Constructor dengan parameter berguna untuk ...', 'mengirim nilai awal ke attribute object', 'mengganti nama method', 'menghapus object lain', 'mengubah tipe data otomatis'],
            ['Jika constructor ditulis dengan void, maka ...', 'itu menjadi method biasa, bukan constructor', 'itu tetap constructor valid', 'class tidak boleh punya object', 'attribute otomatis private'],
        ],
        'Keyword this' => [
            ['Apa fungsi keyword this dalam Java?', 'Merujuk pada object yang sedang aktif', 'Menghapus object', 'Membuat package', 'Mengekspor database'],
            ['Pada kode this.nama = nama;, this.nama merujuk pada ...', 'attribute nama milik object', 'parameter nama', 'nama class', 'nama file'],
            ['Keyword this sering digunakan ketika ...', 'nama attribute dan parameter sama', 'tidak ada class', 'program tidak punya object', 'semua method static wajib dihapus'],
            ['Mengapa this membuat kode constructor lebih jelas?', 'Karena membedakan attribute object dengan parameter', 'Karena menghilangkan kebutuhan tanda kurung', 'Karena mengganti compiler', 'Karena membuat output selalu nol'],
            ['Kode nama = nama; dalam constructor berisiko karena ...', 'attribute bisa tidak terisi dengan benar', 'class pasti menjadi abstract', 'object tidak bisa memiliki method', 'Java berhenti mendukung String'],
            ['Pada constructor Mahasiswa(String nama), parameter ditunjuk oleh ...', 'nama tanpa this', 'this.nama', 'class nama', 'void nama'],
        ],
    ];

    private array $dragBank = [
        'Pengantar Pemrograman Berbasis Objek' => [
            ['Urutkan kode agar class Mahasiswa memiliki attribute dan method sederhana.', 'Mahasiswa belajar', ['class Mahasiswa {', 'String nama = "Mahasiswa";', 'void belajar() {', 'System.out.println(nama + " belajar");', '}', '}']],
            ['Urutkan kode agar program menampilkan konsep object memiliki perilaku.', 'Object memiliki perilaku', ['class Main {', 'public static void main(String[] args) {', 'System.out.println("Object memiliki perilaku");', '}', '}']],
            ['Urutkan kode agar program menampilkan konsep attribute dan method.', 'Attribute dan method', ['class Main {', 'public static void main(String[] args) {', 'System.out.println("Attribute dan method");', '}', '}']],
        ],
        'Struktur Dasar Class' => [
            ['Urutkan potongan kode agar membentuk class Produk sederhana.', 'Produk dibuat', ['class Produk {', 'String nama = "Produk";', 'void tampilkan() {', 'System.out.println(nama + " dibuat");', '}', '}']],
            ['Urutkan kode agar struktur class Buku benar.', 'Buku Java', ['class Buku {', 'String judul = "Java";', 'void info() {', 'System.out.println("Buku " + judul);', '}', '}']],
            ['Urutkan kode agar class MataKuliah memiliki attribute dan method.', 'PBO', ['class MataKuliah {', 'String nama = "PBO";', 'void tampilkan() {', 'System.out.println(nama);', '}', '}']],
        ],
        'Pembuatan Object dari Class' => [
            ['Urutkan kode agar object Mahasiswa dibuat dan menampilkan nama.', 'Nama: Rani', ['class Mahasiswa {', 'String nama;', 'void tampilkanNama() {', 'System.out.println("Nama: " + nama);', '}', '}', 'public class Main {', 'public static void main(String[] args) {', 'Mahasiswa mhs = new Mahasiswa();', 'mhs.nama = "Rani";', 'mhs.tampilkanNama();', '}', '}']],
            ['Urutkan kode agar object Produk dibuat dari class Produk.', 'Produk: Buku', ['class Produk {', 'String nama;', 'void tampilkan() {', 'System.out.println("Produk: " + nama);', '}', '}', 'public class Main {', 'public static void main(String[] args) {', 'Produk p = new Produk();', 'p.nama = "Buku";', 'p.tampilkan();', '}', '}']],
            ['Urutkan kode agar object menampilkan data sederhana.', 'Rani', ['class Mahasiswa {', 'String nama;', 'void tampilkan() {', 'System.out.println(nama);', '}', '}', 'public class Main {', 'public static void main(String[] args) {', 'Mahasiswa m = new Mahasiswa();', 'm.nama = "Rani";', 'm.tampilkan();', '}', '}']],
        ],
        'Attribute dan Method dalam Class' => [
            ['Urutkan kode agar method menampilkan attribute mata kuliah.', 'Mata Kuliah: PBO', ['class MataKuliah {', 'String nama = "PBO";', 'void tampilkanInfo() {', 'System.out.println("Mata Kuliah: " + nama);', '}', '}']],
            ['Urutkan kode agar method Produk menampilkan harga.', 'Harga: 15000', ['class Produk {', 'int harga = 15000;', 'void tampilkanHarga() {', 'System.out.println("Harga: " + harga);', '}', '}']],
            ['Urutkan kode agar attribute dan method bekerja dalam object.', 'Stok: 5', ['class Produk {', 'int stok;', 'void tampilkanStok() {', 'System.out.println("Stok: " + stok);', '}', '}', 'public class Main {', 'public static void main(String[] args) {', 'Produk p = new Produk();', 'p.stok = 5;', 'p.tampilkanStok();', '}', '}']],
        ],
        'Constructor' => [
            ['Urutkan kode agar constructor memberi nilai awal nama.', 'Nama: Rani', ['class Mahasiswa {', 'String nama;', 'Mahasiswa(String namaMhs) {', 'nama = namaMhs;', '}', 'void tampilkan() {', 'System.out.println("Nama: " + nama);', '}', '}']],
            ['Urutkan kode agar object dibuat dengan constructor berparameter.', 'Buku Java', ['class Buku {', 'String judul;', 'Buku(String judulBuku) {', 'judul = judulBuku;', '}', 'void tampilkan() {', 'System.out.println("Buku " + judul);', '}', '}', 'public class Main {', 'public static void main(String[] args) {', 'Buku b = new Buku("Java");']],
            ['Urutkan kode agar constructor mengisi dua attribute.', 'Rani - 224172001', ['class Mahasiswa {', 'String nama;', 'String nim;', 'Mahasiswa(String namaMhs, String nimMhs) {', 'nama = namaMhs;', 'nim = nimMhs;', '}', 'void tampilkan() {', 'System.out.println(nama + " - " + nim);', '}', '}']],
        ],
        'Keyword this' => [
            ['Urutkan kode agar keyword this mengisi attribute nama.', 'Nama: Rani', ['class Mahasiswa {', 'String nama;', 'Mahasiswa(String nama) {', 'this.nama = nama;', '}', 'void tampilkan() {', 'System.out.println("Nama: " + nama);', '}', '}']],
            ['Urutkan kode agar this membedakan parameter dan attribute.', 'Produk: Buku', ['class Produk {', 'String nama;', 'Produk(String nama) {', 'this.nama = nama;', '}', 'void tampilkan() {', 'System.out.println("Produk: " + this.nama);', '}', '}']],
            ['Urutkan kode lengkap dengan constructor this dan object.', 'NIM: 224172001', ['class Mahasiswa {', 'String nim;', 'Mahasiswa(String nim) {', 'this.nim = nim;', '}', 'void tampilkan() {', 'System.out.println("NIM: " + this.nim);', '}', '}', 'public class Main {', 'public static void main(String[] args) {', 'Mahasiswa m = new Mahasiswa("224172001");']],
        ],
    ];

    public function run(): void
    {
        $now = Carbon::now();
        $material = DB::table('materials')->where('material_name', 'Class dan Object')->first();
        if (!$material) {
            throw new RuntimeException('Material Class dan Object belum ada. Jalankan MaterialOneSeeder terlebih dahulu.');
        }

        $this->deleteExistingPracticeData($material->id);
        $subtopics = DB::table('subtopics')->where('material_id', $material->id)->pluck('id', 'name')->toArray();

        $pretestId = $this->createPractice($material->id, 'pretest', null, 60, 3, $now);
        foreach ($this->subtopics as $subtopic) {
            for ($i = 0; $i < 5; $i++) {
                $this->insertMultipleChoiceQuestion($pretestId, $this->getSubtopicId($subtopics, $subtopic), $this->makeMc($subtopic, $i, 'pretest'), $now);
            }
        }

        $levels = [
            'easy' => ['mc' => 6, 'dd' => 1, 'min_score' => 60],
            'medium' => ['mc' => 5, 'dd' => 2, 'min_score' => 60],
            'hard' => ['mc' => 4, 'dd' => 3, 'min_score' => 80],
        ];

        foreach ($levels as $level => $config) {
            $practiceId = $this->createPractice($material->id, 'practice', $level, $config['min_score'], 3, $now);
            foreach ($this->subtopics as $subtopic) {
                $subtopicId = $this->getSubtopicId($subtopics, $subtopic);
                for ($i = 0; $i < $config['mc']; $i++) {
                    $this->insertMultipleChoiceQuestion($practiceId, $subtopicId, $this->makeMc($subtopic, $i, $level), $now);
                }
                for ($i = 0; $i < $config['dd']; $i++) {
                    $this->insertDragDropQuestion($practiceId, $subtopicId, $this->makeDragDrop($subtopic, $i), $now);
                }
            }
        }
    }

    private function makeMc(string $subtopic, int $index, string $level): array
    {
        $bank = $this->mcBank[$subtopic];
        $row = $bank[$index % count($bank)];
        $prefix = match ($level) {
            'medium' => 'Perhatikan penerapan konsep pada materi. ',
            'hard' => 'Dalam studi kasus program Java sederhana, ',
            default => '',
        };

        $options = [
            ['text' => $row[1], 'is_correct' => true],
            ['text' => $row[2], 'is_correct' => false],
            ['text' => $row[3], 'is_correct' => false],
            ['text' => $row[4], 'is_correct' => false],
        ];
        $options = $this->rotateOptions($options, $index);

        return [
            'question' => $prefix . $row[0],
            'points' => 10,
            'feedback_correct' => 'Benar. Jawaban tersebut sesuai dengan konsep ' . $subtopic . '.',
            'feedback_incorrect' => 'Perhatikan kembali materi ' . $subtopic . '. Hint: fokus pada fungsi konsep utama yang ditanyakan.',
            'options' => $options,
        ];
    }

    private function makeDragDrop(string $subtopic, int $index): array
    {
        $row = $this->dragBank[$subtopic][$index % count($this->dragBank[$subtopic])];
        return [
            'question' => $row[0],
            'code_snippet' => $row[1],
            'points' => 10,
            'feedback_correct' => 'Benar. Urutan kode sudah sesuai dengan konsep ' . $subtopic . '.',
            'feedback_incorrect' => 'Perhatikan kembali urutan struktur kode Java pada subtopik ' . $subtopic . '.',
            'items' => array_slice($row[2], 0, 13),
        ];
    }

    private function rotateOptions(array $options, int $rotation): array
    {
        $rotation = $rotation % count($options);
        return array_merge(array_slice($options, $rotation), array_slice($options, 0, $rotation));
    }

    private function createPractice(int $materialId, string $type, ?string $level, int $minScore, int $maxAttempts, Carbon $now): int
    {
        return DB::table('practices')->insertGetId([
            'material_id' => $materialId,
            'type' => $type,
            'level' => $level,
            'min_score' => $minScore,
            'max_attempts' => $maxAttempts,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function insertMultipleChoiceQuestion(int $practiceId, int $subtopicId, array $question, Carbon $now): void
    {
        $questionId = DB::table('practice_questions')->insertGetId([
            'practices_id' => $practiceId,
            'subtopic_id' => $subtopicId,
            'type' => 'multiple_choice',
            'question_text' => $question['question'],
            'image_path' => null,
            'points' => $question['points'],
            'code_snippet' => null,
            'feedback_correct' => $question['feedback_correct'],
            'feedback_incorrect' => $question['feedback_incorrect'],
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        foreach ($question['options'] as $option) {
            DB::table('practice_options')->insert([
                'practice_questions_id' => $questionId,
                'option_text' => $option['text'],
                'is_correct' => $option['is_correct'] ? 1 : 0,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function insertDragDropQuestion(int $practiceId, int $subtopicId, array $question, Carbon $now): void
    {
        $questionId = DB::table('practice_questions')->insertGetId([
            'practices_id' => $practiceId,
            'subtopic_id' => $subtopicId,
            'type' => 'drag_drop',
            'question_text' => $question['question'],
            'image_path' => null,
            'points' => $question['points'],
            'code_snippet' => $question['code_snippet'],
            'feedback_correct' => $question['feedback_correct'],
            'feedback_incorrect' => $question['feedback_incorrect'],
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        foreach ($question['items'] as $index => $item) {
            DB::table('practice_items')->insert([
                'practice_questions_id' => $questionId,
                'item_text' => $item,
                'order_number' => $index + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function getSubtopicId(array $subtopics, string $subtopicName): int
    {
        if (!isset($subtopics[$subtopicName])) {
            throw new RuntimeException('Subtopik ' . $subtopicName . ' belum ada untuk material ini.');
        }
        return (int) $subtopics[$subtopicName];
    }

    private function deleteExistingPracticeData(int $materialId): void
    {
        $practiceIds = DB::table('practices')->where('material_id', $materialId)->pluck('id')->toArray();
        if (empty($practiceIds)) return;
        $questionIds = DB::table('practice_questions')->whereIn('practices_id', $practiceIds)->pluck('id')->toArray();
        if (!empty($questionIds)) {
            DB::table('practice_options')->whereIn('practice_questions_id', $questionIds)->delete();
            DB::table('practice_items')->whereIn('practice_questions_id', $questionIds)->delete();
            DB::table('practice_questions')->whereIn('id', $questionIds)->delete();
        }
        DB::table('practices')->whereIn('id', $practiceIds)->delete();
    }
}
