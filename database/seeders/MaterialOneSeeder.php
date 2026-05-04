<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MaterialOneSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        /*
        |--------------------------------------------------------------------------
        | MATERIAL 1: CLASS DAN OBJECT
        |--------------------------------------------------------------------------
        */

        $materialId = DB::table('materials')->insertGetId([
            'material_name' => 'Class dan Object',
            'order_number' => 1,
            'description' => 'Materi ini membahas pengantar Pemrograman Berbasis Objek, struktur dasar class, pembuatan object, attribute dan method, constructor, serta penggunaan keyword this dalam bahasa pemrograman Java.',
            'content' => null,
            'created_by' => 2,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        /*
        |--------------------------------------------------------------------------
        | SUBTOPICS DAN CONTENTS
        |--------------------------------------------------------------------------
        | Subtopik dibuat sama seperti subtopik pada bank soal practice:
        | 1. Pengantar Pemrograman Berbasis Objek
        | 2. Struktur Dasar Class
        | 3. Pembuatan Object dari Class
        | 4. Attribute dan Method dalam Class
        | 5. Constructor
        | 6. Keyword this
        */

        $subtopics = [
            [
                'name' => 'Pengantar Pemrograman Berbasis Objek',
                'contents' => [
                    [
                        'title' => 'Konsep Dasar Pemrograman Berbasis Objek',
                        'content_text' => <<<TEXT
Pemrograman Berbasis Objek atau Object-Oriented Programming adalah paradigma pemrograman yang menyusun program berdasarkan object. Dalam pendekatan ini, program tidak hanya dipandang sebagai kumpulan instruksi yang berjalan dari atas ke bawah, tetapi sebagai kumpulan object yang memiliki data dan perilaku.

Object dapat merepresentasikan sesuatu di dunia nyata atau komponen dalam sistem. Dalam sistem akademik, object dapat berupa Mahasiswa, Dosen, MataKuliah, Kelas, atau Nilai. Dalam sistem perpustakaan, object dapat berupa Buku, Anggota, Petugas, Peminjaman, dan Pengembalian.

Setiap object umumnya memiliki dua komponen utama, yaitu attribute dan method. Attribute adalah data atau karakteristik yang dimiliki object. Method adalah perilaku atau aksi yang dapat dilakukan oleh object.

Contoh konsep object Mahasiswa:

- Attribute:
  - nama
  - nim
  - kelas

- Method:
  - belajar()
  - mengerjakanTugas()
  - tampilkanData()

Contoh kode sederhana:

class Mahasiswa {
    String nama;
    String nim;

    void tampilkanData() {
        System.out.println("Nama: " + nama);
        System.out.println("NIM: " + nim);
    }
}

Pada contoh tersebut, Mahasiswa adalah class. nama dan nim adalah attribute. tampilkanData() adalah method.

Konsep ini penting karena pada latihan soal mahasiswa akan sering diminta membedakan class, object, attribute, dan method. Mahasiswa juga akan diminta memahami bagian-bagian kode Java sederhana yang merepresentasikan konsep tersebut.
TEXT,
                        'image_path' => 'materials/class-object/01-pengantar-konsep-dasar-pbo.png',
                    ],
                    [
                        'title' => 'Manfaat PBO dan Perbedaannya dengan Pemrograman Prosedural',
                        'content_text' => <<<TEXT
Pemrograman Berbasis Objek digunakan agar program lebih mudah dipahami, dikembangkan, dan dipelihara. Ketika program semakin besar, data dan proses yang tidak dikelompokkan dengan baik dapat membuat kode sulit dibaca dan sulit diperbaiki.

Dengan PBO, data dan proses yang saling berhubungan dikelompokkan ke dalam satu class. Misalnya, data mahasiswa dan perilaku untuk menampilkan data mahasiswa diletakkan di dalam class Mahasiswa.

Contoh:

class Mahasiswa {
    String nama;
    String nim;

    void tampilkanData() {
        System.out.println("Nama: " + nama);
        System.out.println("NIM: " + nim);
    }
}

Pada contoh tersebut, data mahasiswa dan perilaku untuk menampilkan data mahasiswa berada dalam satu class. Ini membuat struktur kode lebih rapi.

Perbedaan pemrograman prosedural dan PBO:

1. Fokus utama
   - Prosedural berfokus pada fungsi dan urutan instruksi.
   - PBO berfokus pada object yang memiliki data dan perilaku.

2. Pengelolaan data
   - Prosedural cenderung memisahkan data dan fungsi.
   - PBO menggabungkan data dan method dalam class.

3. Cocok digunakan untuk
   - Prosedural cocok untuk program sederhana dan linear.
   - PBO cocok untuk program yang lebih kompleks dan berkembang.

4. Contoh pendekatan
   - Prosedural: fungsi tampilkanMahasiswa() memproses data mahasiswa.
   - PBO: object Mahasiswa memiliki data dan method sendiri.

Catatan penting:
Pada materi ini, fokus utama adalah class, object, attribute, method, constructor, dan keyword this. Konsep encapsulation, inheritance, dan polymorphism akan dibahas pada materi berikutnya.
TEXT,
                        'image_path' => 'materials/class-object/02-pengantar-manfaat-pbo-vs-prosedural.png',
                    ],
                ],
            ],
            [
                'name' => 'Struktur Dasar Class',
                'contents' => [
                    [
                        'title' => 'Pengertian dan Struktur Dasar Class',
                        'content_text' => <<<TEXT
Class adalah rancangan atau cetakan yang digunakan untuk membuat object. Class mendefinisikan data apa saja yang dimiliki object dan perilaku apa saja yang dapat dilakukan object.

Dalam Java, class dibuat menggunakan keyword class, kemudian diikuti nama class dan blok kode yang dibatasi oleh tanda kurung kurawal.

Struktur umum class:

class NamaClass {
    // attribute

    // method
}

Contoh class Mahasiswa:

class Mahasiswa {
    String nama;
    String nim;

    void tampilkanData() {
        System.out.println("Nama: " + nama);
        System.out.println("NIM: " + nim);
    }
}

Penjelasan kode:

1. class Mahasiswa
   Bagian ini menunjukkan deklarasi class dengan nama Mahasiswa.

2. String nama;
   Bagian ini adalah attribute untuk menyimpan nama mahasiswa.

3. String nim;
   Bagian ini adalah attribute untuk menyimpan NIM mahasiswa.

4. void tampilkanData()
   Bagian ini adalah method untuk menampilkan data mahasiswa.

5. System.out.println()
   Perintah ini digunakan untuk mencetak teks atau nilai ke layar.

Class belum menjadi object. Class hanya menjadi rancangan. Agar dapat digunakan, class harus dibuat menjadi object menggunakan keyword new.
TEXT,
                        'image_path' => 'materials/class-object/03-struktur-dasar-class.png',

                    ],
                    [
                        'title' => 'Aturan Penulisan Class dan Kesalahan Umum',
                        'content_text' => <<<TEXT
Dalam Java, nama class biasanya ditulis menggunakan huruf kapital di awal. Contohnya Mahasiswa, Buku, Produk, MataKuliah, atau Rekening.

Aturan umum penulisan class:

1. Nama class sebaiknya diawali huruf kapital.
2. Nama class sebaiknya menggambarkan objek atau konsep yang dibuat.
3. Attribute dan method ditulis di dalam blok class.
4. Blok class dibuka dengan tanda { dan ditutup dengan tanda }.
5. Satu class dapat memiliki beberapa attribute dan beberapa method.

Contoh yang benar:

class Produk {
    String nama;
    int harga;

    void tampilkanProduk() {
        System.out.println(nama);
        System.out.println(harga);
    }
}

Kesalahan umum yang sering terjadi:

1. Menulis attribute di luar class.

Contoh salah:

String nama;

class Mahasiswa {
}

Attribute seharusnya berada di dalam class.

2. Lupa menutup kurung kurawal.

Contoh salah:

class Mahasiswa {
    String nama;

Program akan error karena blok class belum ditutup.

3. Menulis method di luar class.

Contoh salah:

class Mahasiswa {
    String nama;
}

void tampilkanData() {
    System.out.println(nama);
}

Method seharusnya berada di dalam class.

Catatan untuk latihan:
Pada soal practice, mahasiswa dapat diminta mengenali bagian class, memilih struktur class yang benar, atau mengurutkan potongan kode agar membentuk class Java sederhana.
TEXT,
                        'image_path' => 'materials/class-object/04-aturan-class-kesalahan-umum.png',
                    ],
                ],
            ],
            [
                'name' => 'Pembuatan Object dari Class',
                'contents' => [
                    [
                        'title' => 'Pengertian Object dan Keyword new',
                        'content_text' => <<<TEXT
Object adalah instance atau hasil nyata dari sebuah class. Jika class adalah rancangan, maka object adalah hasil yang dibuat berdasarkan rancangan tersebut.

Dalam Java, object dibuat menggunakan keyword new.

Contoh:

Mahasiswa mhs1 = new Mahasiswa();

Penjelasan kode:

1. Mahasiswa
   Menunjukkan tipe data object yang dibuat, yaitu berasal dari class Mahasiswa.

2. mhs1
   Merupakan nama variabel object.

3. new Mahasiswa()
   Digunakan untuk membuat object baru dari class Mahasiswa.

Setelah object dibuat, attribute dan method dapat diakses menggunakan tanda titik.

Contoh:

mhs1.nama = "Rani";
mhs1.nim = "224172001";
mhs1.tampilkanData();

Penjelasan:

- mhs1.nama digunakan untuk mengisi attribute nama pada object mhs1.
- mhs1.nim digunakan untuk mengisi attribute nim pada object mhs1.
- mhs1.tampilkanData() digunakan untuk memanggil method tampilkanData() milik object mhs1.

Contoh lengkap:

class Mahasiswa {
    String nama;
    String nim;

    void tampilkanData() {
        System.out.println("Nama: " + nama);
        System.out.println("NIM: " + nim);
    }
}

public class Main {
    public static void main(String[] args) {
        Mahasiswa mhs1 = new Mahasiswa();
        mhs1.nama = "Rani";
        mhs1.nim = "224172001";
        mhs1.tampilkanData();
    }
}

Output:

Nama: Rani
NIM: 224172001
TEXT,
                        'image_path' => 'materials/class-object/05-pembuatan-object-keyword-new.png',

                    ],
                    [
                        'title' => 'Banyak Object dari Satu Class dan Alur Eksekusi Program',
                        'content_text' => <<<TEXT
Satu class dapat digunakan untuk membuat banyak object. Setiap object dapat memiliki nilai attribute yang berbeda meskipun berasal dari class yang sama.

Contoh:

Mahasiswa mhs1 = new Mahasiswa();
mhs1.nama = "Rani";
mhs1.nim = "224172001";

Mahasiswa mhs2 = new Mahasiswa();
mhs2.nama = "Budi";
mhs2.nim = "224172002";

Pada contoh tersebut, mhs1 dan mhs2 sama-sama object dari class Mahasiswa. Namun, nilai nama dan nim yang dimiliki keduanya berbeda.

Contoh lengkap:

class Mahasiswa {
    String nama;

    void tampilkanNama() {
        System.out.println("Nama: " + nama);
    }
}

public class Main {
    public static void main(String[] args) {
        Mahasiswa mhs1 = new Mahasiswa();
        Mahasiswa mhs2 = new Mahasiswa();

        mhs1.nama = "Rani";
        mhs2.nama = "Budi";

        mhs1.tampilkanNama();
        mhs2.tampilkanNama();
    }
}

Output:

Nama: Rani
Nama: Budi

Alur eksekusi program:

1. Program masuk ke method main.
2. Object mhs1 dibuat dari class Mahasiswa.
3. Object mhs2 dibuat dari class Mahasiswa.
4. Attribute nama pada mhs1 diisi dengan Rani.
5. Attribute nama pada mhs2 diisi dengan Budi.
6. Method tampilkanNama() milik mhs1 dipanggil.
7. Method tampilkanNama() milik mhs2 dipanggil.

Catatan untuk latihan:
Pada soal practice, mahasiswa dapat diminta menentukan object mana yang dibuat, output program, atau urutan kode pembuatan object yang benar.
TEXT,
                        'image_path' => 'materials/class-object/06-akses-attribute-method-object.png',
                    ],
                ],
            ],
            [
                'name' => 'Attribute dan Method dalam Class',
                'contents' => [
                    [
                        'title' => 'Attribute sebagai Data Object',
                        'content_text' => <<<TEXT
Attribute adalah data atau karakteristik yang dimiliki oleh object. Attribute biasanya ditulis di dalam class, tetapi di luar method.

Contoh attribute pada class Mahasiswa:

class Mahasiswa {
    String nama;
    String nim;
    String kelas;
}

Pada contoh tersebut:

1. nama digunakan untuk menyimpan nama mahasiswa.
2. nim digunakan untuk menyimpan nomor induk mahasiswa.
3. kelas digunakan untuk menyimpan kelas mahasiswa.

Attribute dapat memiliki tipe data yang berbeda, misalnya:

- String untuk teks.
- int untuk bilangan bulat.
- double untuk bilangan desimal.
- boolean untuk nilai benar atau salah.

Contoh class Produk:

class Produk {
    String nama;
    int harga;
    int stok;
}

Pada class Produk:
- nama menyimpan nama produk.
- harga menyimpan harga produk.
- stok menyimpan jumlah stok produk.

Attribute membantu object menyimpan informasi yang dibutuhkan dalam program.
TEXT,
                        'image_path' => 'materials/class-object/07-attribute-sebagai-data-object.png',

                    ],
                    [
                        'title' => 'Method sebagai Perilaku Object',
                        'content_text' => <<<TEXT
Method adalah perilaku atau aksi yang dapat dilakukan oleh object. Method dapat digunakan untuk menampilkan data, menghitung nilai, mengubah data, atau menjalankan proses tertentu.

Contoh method:

void tampilkanData() {
    System.out.println("Nama: " + nama);
    System.out.println("NIM: " + nim);
}

Method tampilkanData() digunakan untuk menampilkan nilai attribute nama dan nim.

Contoh class MataKuliah:

class MataKuliah {
    String nama;
    int sks;

    void tampilkanInfo() {
        System.out.println("Mata Kuliah: " + nama);
        System.out.println("SKS: " + sks);
    }
}

Pada contoh tersebut:
- nama adalah attribute.
- sks adalah attribute.
- tampilkanInfo() adalah method.

Method dapat menggunakan attribute yang ada di dalam class yang sama.

Contoh penggunaan object:

public class Main {
    public static void main(String[] args) {
        MataKuliah mk = new MataKuliah();
        mk.nama = "Pemrograman Berbasis Objek";
        mk.sks = 3;
        mk.tampilkanInfo();
    }
}

Output:

Mata Kuliah: Pemrograman Berbasis Objek
SKS: 3

Catatan penting:
Attribute menyimpan data, sedangkan method menggunakan atau mengolah data tersebut. Pada soal practice, mahasiswa dapat diminta membedakan attribute dan method, menentukan output method, atau mengurutkan kode yang berisi attribute dan method.
TEXT,
                        'image_path' => 'materials/class-object/08-method-sebagai-perilaku-object.png',
                    ],
                ],
            ],
            [
                'name' => 'Constructor',
                'contents' => [
                    [
                        'title' => 'Pengertian, Ciri-Ciri, dan Fungsi Constructor',
                        'content_text' => <<<TEXT
Constructor adalah method khusus yang dijalankan otomatis ketika object dibuat. Constructor biasanya digunakan untuk memberi nilai awal pada attribute sehingga object langsung berada dalam kondisi siap digunakan.

Ciri-ciri constructor:

1. Nama constructor harus sama dengan nama class.
2. Constructor tidak memiliki tipe kembalian.
3. Constructor tidak menggunakan void.
4. Constructor dipanggil otomatis saat object dibuat menggunakan keyword new.
5. Constructor dapat memiliki parameter.

Contoh constructor:

class Mahasiswa {
    String nama;
    String nim;

    Mahasiswa(String namaMhs, String nimMhs) {
        nama = namaMhs;
        nim = nimMhs;
    }
}

Pada contoh tersebut:
- Mahasiswa adalah nama class.
- Mahasiswa(String namaMhs, String nimMhs) adalah constructor.
- namaMhs dan nimMhs adalah parameter constructor.
- nama = namaMhs; digunakan untuk mengisi attribute nama.
- nim = nimMhs; digunakan untuk mengisi attribute nim.

Constructor membuat object memiliki nilai awal sejak pertama kali dibuat.
TEXT,
                        'image_path' => 'materials/class-object/09-constructor-memberi-nilai-awal.png',

                    ],
                    [
                        'title' => 'Contoh Constructor dan Kesalahan Umum',
                        'content_text' => <<<TEXT
Tanpa constructor, programmer harus membuat object kosong lalu mengisi attribute satu per satu.

Contoh tanpa constructor:

Mahasiswa mhs1 = new Mahasiswa();
mhs1.nama = "Rani";
mhs1.nim = "224172001";

Dengan constructor, nilai dapat langsung diberikan saat object dibuat.

Contoh dengan constructor:

Mahasiswa mhs1 = new Mahasiswa("Rani", "224172001");

Contoh lengkap:

class Mahasiswa {
    String nama;
    String nim;

    Mahasiswa(String namaMhs, String nimMhs) {
        nama = namaMhs;
        nim = nimMhs;
    }

    void tampilkanData() {
        System.out.println("Nama: " + nama);
        System.out.println("NIM: " + nim);
    }
}

public class Main {
    public static void main(String[] args) {
        Mahasiswa mhs1 = new Mahasiswa("Rani", "224172001");
        mhs1.tampilkanData();
    }
}

Output:

Nama: Rani
NIM: 224172001

Kesalahan umum pada constructor:

1. Memberi tipe return pada constructor.

Contoh salah:

void Mahasiswa(String nama) {
    this.nama = nama;
}

Kode tersebut bukan constructor, karena menggunakan void.

2. Nama constructor tidak sama dengan nama class.

Contoh salah:

class Mahasiswa {
    Siswa(String nama) {
    }
}

Constructor harus memiliki nama yang sama dengan class.

3. Menggunakan jumlah parameter yang tidak sesuai.

Jika constructor membutuhkan dua parameter, maka saat membuat object juga harus mengirim dua nilai.

Catatan untuk latihan:
Pada soal practice, mahasiswa dapat diminta menentukan constructor yang benar, menganalisis output program dengan constructor, atau mengurutkan kode constructor agar menjadi program yang benar.
TEXT,
                        'image_path' => 'materials/class-object/10-constructor-kesalahan-umum.png',
                    ],
                ],
            ],
            [
                'name' => 'Keyword this',
                'contents' => [
                    [
                        'title' => 'Pengertian dan Fungsi Keyword this',
                        'content_text' => <<<TEXT
Keyword this digunakan untuk merujuk pada object yang sedang aktif. this sering digunakan ketika nama parameter sama dengan nama attribute.

Dengan this, programmer dapat membedakan antara attribute milik object dan parameter yang diterima oleh constructor atau method.

Contoh:

class Mahasiswa {
    String nama;
    String nim;

    Mahasiswa(String nama, String nim) {
        this.nama = nama;
        this.nim = nim;
    }
}

Penjelasan:

1. this.nama
   Merujuk pada attribute nama milik object.

2. nama
   Merujuk pada parameter constructor.

3. this.nim
   Merujuk pada attribute nim milik object.

4. nim
   Merujuk pada parameter constructor.

Baris:

this.nama = nama;

berarti nilai parameter nama disimpan ke attribute nama milik object yang sedang dibuat.

Keyword this membuat kode lebih jelas, terutama ketika nama attribute dan parameter sama.
TEXT,
                        'image_path' => 'materials/class-object/11-keyword-this-konsep.png',

                    ],
                    [
                        'title' => 'Contoh Penggunaan this dan Kesalahan yang Sering Terjadi',
                        'content_text' => <<<TEXT
Contoh lengkap penggunaan keyword this:

class Mahasiswa {
    String nama;
    String nim;

    Mahasiswa(String nama, String nim) {
        this.nama = nama;
        this.nim = nim;
    }

    void tampilkanData() {
        System.out.println("Nama: " + this.nama);
        System.out.println("NIM: " + this.nim);
    }
}

public class Main {
    public static void main(String[] args) {
        Mahasiswa mhs1 = new Mahasiswa("Rani", "224172001");
        mhs1.tampilkanData();
    }
}

Output:

Nama: Rani
NIM: 224172001

Kapan this digunakan?

1. Ketika nama attribute dan parameter sama.
2. Ketika ingin memperjelas bahwa variabel adalah milik object.
3. Ketika digunakan dalam constructor atau setter.
4. Ketika kode perlu dibaca dengan lebih jelas.

Kesalahan umum:

class Mahasiswa {
    String nama;

    Mahasiswa(String nama) {
        nama = nama;
    }
}

Kode di atas membingungkan karena nama di kiri dan kanan sama-sama dianggap sebagai parameter. Akibatnya, attribute nama milik object tidak terisi dengan benar.

Perbaikannya:

class Mahasiswa {
    String nama;

    Mahasiswa(String nama) {
        this.nama = nama;
    }
}

Catatan untuk latihan:
Pada soal practice, mahasiswa dapat diminta menjelaskan fungsi this, menentukan arti this.nama, menganalisis constructor dengan parameter yang sama namanya dengan attribute, atau mengurutkan kode yang menggunakan this.
TEXT,
                        'image_path' => 'materials/class-object/12-keyword-this-kesalahan-umum.png',
                    ],
                ],
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | INSERT DATA
        |--------------------------------------------------------------------------
        */

        foreach ($subtopics as $subtopic) {
            $subtopicId = DB::table('subtopics')->insertGetId([
                'material_id' => $materialId,
                'name' => $subtopic['name'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($subtopic['contents'] as $index => $content) {
                DB::table('material_contents')->insert([
                    'material_id' => $materialId,
                    'subtopic_id' => $subtopicId,
                    'title' => $content['title'],
                    'content_text' => $content['content_text'],
                    'image_path' => $content['image_path'],
                    'sort_order' => $index + 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
