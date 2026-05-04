<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use RuntimeException;

class MaterialTwoPracticeSeeder extends Seeder
{
    private array $subtopics = [
        'Konsep Encapsulation',
        'Access Modifier',
        'Attribute private',
        'Getter dan Setter',
        'Validasi Data Menggunakan Setter',
    ];

    private array $mcBank = [
        'Konsep Encapsulation' => [
            ['Apa yang dimaksud dengan encapsulation?', 'Pembungkusan data dan method dalam class agar akses data terkontrol', 'Pewarisan class induk ke class anak', 'Kemampuan method memiliki banyak bentuk', 'Proses menjalankan query database'],
            ['Tujuan utama encapsulation adalah ...', 'melindungi data agar tidak diakses atau diubah sembarangan', 'membuat semua attribute menjadi public', 'menghapus kebutuhan class', 'membuat program tanpa method'],
            ['Dalam encapsulation, data sebaiknya diakses melalui ...', 'method yang disediakan class', 'akses langsung dari semua class', 'nama folder project', 'komentar kode'],
            ['Analogi encapsulation yang tepat adalah ...', 'ATM yang memberi akses melalui menu, bukan langsung ke mesin', 'Buku tanpa halaman', 'Folder kosong', 'Printer tanpa tinta'],
            ['Jika data object dapat diubah bebas tanpa aturan, risiko yang muncul adalah ...', 'data tidak valid dapat masuk ke object', 'kode pasti lebih pendek dan selalu benar', 'constructor tidak dibutuhkan lagi', 'class otomatis menjadi interface'],
            ['Encapsulation membantu class untuk ...', 'mengontrol data yang dimilikinya', 'menghapus semua method', 'mencegah pembuatan object', 'mengubah Java menjadi SQL'],
        ],
        'Access Modifier' => [
            ['Apa fungsi access modifier?', 'Mengatur tingkat akses terhadap class, attribute, atau method', 'Menentukan warna output', 'Membuat database baru', 'Menghapus parameter'],
            ['Access modifier yang hanya dapat diakses dari dalam class itu sendiri adalah ...', 'private', 'public', 'protected', 'default'],
            ['Access modifier public berarti ...', 'dapat diakses dari mana saja sesuai konteks program', 'hanya dapat diakses dalam class itu sendiri', 'tidak dapat digunakan pada method', 'selalu menyebabkan error'],
            ['Dalam encapsulation, attribute biasanya dibuat ...', 'private', 'public', 'static semua', 'tanpa tipe data'],
            ['Jika attribute saldo bersifat sensitif, access modifier yang paling tepat adalah ...', 'private', 'public', 'default tanpa alasan', 'abstract'],
            ['Method getter biasanya dibuat public agar ...', 'nilai private dapat dibaca secara terkontrol', 'attribute private hilang', 'class tidak bisa dipakai', 'object tidak perlu new'],
        ],
        'Attribute private' => [
            ['Apa arti attribute private?', 'Attribute hanya dapat diakses dari dalam class tempat attribute dibuat', 'Attribute dapat diakses dari semua class tanpa batas', 'Attribute otomatis menjadi method', 'Attribute tidak membutuhkan tipe data'],
            ['Jika mhs.nama error karena nama private, penyebabnya adalah ...', 'attribute private tidak boleh diakses langsung dari luar class', 'object tidak boleh dibuat', 'String tidak bisa dipakai', 'method main harus dihapus'],
            ['Mengapa attribute harga sebaiknya private?', 'Agar nilai harga tidak bisa diubah langsung menjadi tidak valid', 'Agar harga selalu nol', 'Agar class tidak punya method', 'Agar constructor tidak dipanggil'],
            ['Cara aman mengubah attribute private adalah melalui ...', 'setter', 'komentar', 'nama file', 'operator modulo'],
            ['Attribute private membantu class untuk ...', 'mengontrol bagaimana datanya dibaca dan diubah', 'menghilangkan semua method', 'membuka akses langsung ke semua data', 'mengubah tipe data menjadi public'],
            ['Jika attribute private perlu dibaca dari luar class, gunakan ...', 'getter', 'constructor void', 'query delete', 'operator plus saja'],
        ],
        'Getter dan Setter' => [
            ['Apa fungsi getter?', 'Mengambil nilai attribute private', 'Menghapus attribute', 'Membuat object baru tanpa class', 'Mengubah nama package'],
            ['Apa fungsi setter?', 'Mengubah atau mengisi nilai attribute private', 'Menutup program', 'Membuat output selalu kosong', 'Menghapus constructor'],
            ['Method getNama() biasanya mengembalikan ...', 'nilai attribute nama', 'nama database', 'isi folder public', 'jumlah class'],
            ['Setter biasanya membutuhkan ...', 'parameter nilai baru yang akan disimpan', 'hanya komentar', 'nama file gambar', 'perintah SQL delete'],
            ['Mengapa getter dan setter digunakan?', 'Agar akses ke data private tetap terkontrol', 'Agar semua attribute bebas diubah langsung', 'Agar class tidak punya object', 'Agar program tidak memakai method'],
            ['Getter yang benar biasanya menggunakan keyword ...', 'return', 'new', 'delete', 'extends'],
        ],
        'Validasi Data Menggunakan Setter' => [
            ['Apa tujuan validasi data pada setter?', 'Memastikan data sesuai aturan sebelum disimpan', 'Menghapus semua parameter', 'Membuat attribute selalu public', 'Mengganti nama class'],
            ['Contoh validasi harga yang benar adalah ...', 'harga >= 0', 'harga < 0 agar valid', 'harga selalu dikosongkan', 'harga harus berupa nama'],
            ['Jika umur bernilai -5, setter yang baik seharusnya ...', 'menolak atau tidak menyimpan nilai tersebut', 'menyimpan tanpa pengecekan', 'menghapus object', 'mengubah class menjadi public'],
            ['Validasi pada setter membantu mencegah ...', 'data tidak valid masuk ke object', 'method dipanggil', 'class dibuat', 'object memakai new'],
            ['Jika nama tidak boleh kosong, kondisi validasi yang relevan adalah ...', 'nama tidak kosong', 'nama selalu null', 'nama harus angka negatif', 'nama tidak boleh bertipe String'],
            ['Setter yang memvalidasi stok sebaiknya menerima stok jika ...', 'stok >= 0', 'stok < 0', 'stok selalu null', 'stok berupa huruf saja'],
        ],
    ];

    private array $dragBank = [
        'Konsep Encapsulation' => [
            ['Urutkan kode agar attribute private diakses melalui method.', 'Rani', ['class Mahasiswa {', 'private String nama;', 'public void setNama(String nama) {', 'this.nama = nama;', '}', 'public String getNama() {', 'return nama;', '}', '}']],
            ['Urutkan kode agar program menampilkan pesan data aman.', 'Data aman', ['class Main {', 'public static void main(String[] args) {', 'System.out.println("Data aman");', '}', '}']],
            ['Urutkan kode sederhana yang menunjukkan pembungkusan data.', 'Encapsulation', ['class Data {', 'private String nilai = "Encapsulation";', 'public String getNilai() {', 'return nilai;', '}', '}']],
        ],
        'Access Modifier' => [
            ['Urutkan kode agar saldo private dan method public dapat digunakan.', '10000.0', ['class Rekening {', 'private double saldo = 10000;', 'public double getSaldo() {', 'return saldo;', '}', '}']],
            ['Urutkan kode yang menunjukkan method public mengakses data private.', 'Budi', ['class User {', 'private String nama = "Budi";', 'public String getNama() {', 'return nama;', '}', '}']],
            ['Urutkan kode agar access modifier digunakan dengan tepat.', 'Aktif', ['class Akun {', 'private String status = "Aktif";', 'public void tampilkan() {', 'System.out.println(status);', '}', '}']],
        ],
        'Attribute private' => [
            ['Urutkan kode agar attribute private nama dapat diisi melalui setter.', 'Nama: Rani', ['class Mahasiswa {', 'private String nama;', 'public void setNama(String nama) {', 'this.nama = nama;', '}', 'public void tampilkan() {', 'System.out.println("Nama: " + nama);', '}', '}']],
            ['Urutkan kode agar harga private dapat ditampilkan melalui getter.', '15000', ['class Produk {', 'private int harga = 15000;', 'public int getHarga() {', 'return harga;', '}', '}']],
            ['Urutkan kode yang menunjukkan attribute private terlindungi.', 'Private aktif', ['class Main {', 'public static void main(String[] args) {', 'System.out.println("Private aktif");', '}', '}']],
        ],
        'Getter dan Setter' => [
            ['Urutkan kode agar setter dan getter nama berjalan benar.', 'Rani', ['class Mahasiswa {', 'private String nama;', 'public void setNama(String nama) {', 'this.nama = nama;', '}', 'public String getNama() {', 'return nama;', '}', '}']],
            ['Urutkan kode lengkap penggunaan getter dan setter.', 'Buku', ['class Produk {', 'private String nama;', 'public void setNama(String nama) {', 'this.nama = nama;', '}', 'public String getNama() {', 'return nama;', '}', '}']],
            ['Urutkan kode agar getHarga mengembalikan nilai harga.', '20000', ['class Produk {', 'private int harga;', 'public void setHarga(int harga) {', 'this.harga = harga;', '}', 'public int getHarga() {', 'return harga;', '}', '}']],
        ],
        'Validasi Data Menggunakan Setter' => [
            ['Urutkan kode agar setter menolak umur tidak valid.', 'Umur tidak valid', ['class Mahasiswa {', 'private int umur;', 'public void setUmur(int umur) {', 'if (umur > 0) {', 'this.umur = umur;', '} else {', 'System.out.println("Umur tidak valid");', '}', '}', '}']],
            ['Urutkan kode agar setter harga menolak nilai negatif.', 'Harga tidak boleh negatif', ['class Produk {', 'private int harga;', 'public void setHarga(int harga) {', 'if (harga >= 0) {', 'this.harga = harga;', '} else {', 'System.out.println("Harga tidak boleh negatif");', '}', '}', '}']],
            ['Urutkan kode validasi nama tidak boleh kosong.', 'Nama tidak boleh kosong', ['class Mahasiswa {', 'private String nama;', 'public void setNama(String nama) {', 'if (!nama.isEmpty()) {', 'this.nama = nama;', '} else {', 'System.out.println("Nama tidak boleh kosong");', '}', '}', '}']],
        ],
    ];

    public function run(): void
    {
        $now = Carbon::now();
        $material = DB::table('materials')->where('material_name', 'Encapsulation')->first();
        if (!$material) {
            throw new RuntimeException('Material Encapsulation belum ada. Jalankan MaterialTwoSeeder terlebih dahulu.');
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
