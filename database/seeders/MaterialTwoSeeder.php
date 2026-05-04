<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MaterialTwoSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        /*
        |--------------------------------------------------------------------------
        | MATERIAL 2: ENCAPSULATION
        |--------------------------------------------------------------------------
        */

        $materialId = DB::table('materials')->insertGetId([
            'material_name' => 'Encapsulation',
            'order_number' => 2,
            'description' => 'Materi ini membahas konsep encapsulation dalam Pemrograman Berbasis Objek, penggunaan access modifier, attribute private, getter, setter, serta validasi data menggunakan setter dalam bahasa pemrograman Java.',
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
        | 1. Konsep Encapsulation
        | 2. Access Modifier
        | 3. Attribute private
        | 4. Getter dan Setter
        | 5. Validasi Data Menggunakan Setter
        */

        $subtopics = [
            [
                'name' => 'Konsep Encapsulation',
                'contents' => [
                    [
                        'title' => 'Pengertian Encapsulation',
                        'content_text' => <<<TEXT
Encapsulation adalah salah satu konsep utama dalam Pemrograman Berbasis Objek yang berarti pembungkusan data dan method ke dalam satu unit, yaitu class.

Dalam encapsulation, data yang dimiliki object tidak sebaiknya diakses secara langsung dari luar class. Data tersebut sebaiknya dilindungi dan hanya dapat diakses melalui method tertentu.

Tujuan utama encapsulation adalah menjaga keamanan data, mengontrol perubahan data, dan membuat struktur program lebih rapi.

Contoh sederhana:

class Mahasiswa {
    private String nama;

    public void setNama(String nama) {
        this.nama = nama;
    }

    public String getNama() {
        return nama;
    }
}

Pada contoh tersebut, attribute nama dibuat private. Artinya, attribute tersebut tidak dapat diakses langsung dari luar class Mahasiswa. Untuk mengubah nilai nama, digunakan method setNama(). Untuk mengambil nilai nama, digunakan method getNama().

Encapsulation membantu class mengatur sendiri bagaimana datanya boleh dibaca dan diubah. Dengan cara ini, object tidak mudah mengalami perubahan data yang tidak sesuai.
TEXT,
                        'image_path' => 'materials/encapsulation/01-konsep-encapsulation.png',
                    ],
                    [
                        'title' => 'Manfaat Encapsulation dan Analogi',
                        'content_text' => <<<TEXT
Encapsulation diperlukan agar data dalam object tidak dapat diubah sembarangan. Jika semua attribute dibuat public, maka bagian lain dari program dapat mengubah data secara langsung tanpa aturan.

Contoh masalah jika data tidak dilindungi:

class Mahasiswa {
    public int umur;
}

public class Main {
    public static void main(String[] args) {
        Mahasiswa mhs = new Mahasiswa();
        mhs.umur = -10;
    }
}

Pada contoh tersebut, attribute umur dapat diisi dengan nilai -10. Secara logika, umur tidak boleh bernilai negatif. Masalah seperti ini dapat dicegah dengan encapsulation.

Encapsulation dapat dianalogikan seperti mesin ATM. Pengguna tidak bisa mengakses langsung isi mesin atau database bank. Pengguna hanya dapat melakukan operasi melalui menu yang disediakan, seperti cek saldo, tarik tunai, atau transfer.

Hal yang sama berlaku pada class. Data di dalam class dilindungi, lalu akses terhadap data dilakukan melalui method yang sudah disediakan.

Manfaat encapsulation:

1. Melindungi data agar tidak diakses sembarangan.
2. Mencegah data tidak valid masuk ke object.
3. Membuat class memiliki kontrol terhadap datanya sendiri.
4. Membuat kode lebih mudah dirawat.
5. Mendukung prinsip keamanan dan kerapian program.

Catatan untuk latihan:
Pada soal practice, mahasiswa dapat diminta menentukan alasan penggunaan encapsulation, membedakan akses langsung dan akses melalui method, atau menganalisis dampak attribute public yang tidak divalidasi.
TEXT,
                        'image_path' => 'materials/encapsulation/02-manfaat-encapsulation-analogi-atm.png',
                    ],
                ],
            ],
            [
                'name' => 'Access Modifier',
                'contents' => [
                    [
                        'title' => 'Pengertian Access Modifier',
                        'content_text' => <<<TEXT
Access modifier adalah kata kunci dalam Java yang digunakan untuk mengatur tingkat akses terhadap class, attribute, constructor, dan method.

Dengan access modifier, programmer dapat menentukan bagian mana dari program yang boleh mengakses data atau method tertentu.

Beberapa access modifier yang sering digunakan dalam Java adalah:

1. public
2. private
3. protected
4. default

Contoh:

class Rekening {
    public String namaPemilik;
    private double saldo;
}

Pada contoh tersebut, namaPemilik menggunakan access modifier public, sehingga dapat diakses dari luar class. Sementara itu, saldo menggunakan private, sehingga hanya dapat diakses dari dalam class Rekening.

Dalam konsep encapsulation, attribute biasanya dibuat private agar data tidak dapat diubah langsung dari luar class. Jika data perlu dibaca atau diubah, programmer menyediakan getter dan setter.
TEXT,
                        'image_path' => 'materials/encapsulation/03-access-modifier.png',
                    ],
                    [
                        'title' => 'Jenis Access Modifier dan Contoh Penggunaannya',
                        'content_text' => <<<TEXT
Jenis access modifier dalam Java:

1. public
public berarti attribute atau method dapat diakses dari mana saja.

Contoh:

public String nama;

2. private
private berarti attribute atau method hanya dapat diakses dari dalam class itu sendiri.

Contoh:

private double saldo;

3. protected
protected berarti attribute atau method dapat diakses dari class dalam package yang sama dan class turunan.

Contoh:

protected String jenisAkun;

4. default
Jika tidak menuliskan access modifier, maka Java menggunakan akses default. Akses ini hanya berlaku dalam package yang sama.

Contoh:

String kode;

Contoh penggunaan access modifier:

class Rekening {
    private double saldo;

    public void setor(double jumlah) {
        saldo = saldo + jumlah;
    }

    public double getSaldo() {
        return saldo;
    }
}

Pada contoh tersebut:
- saldo dibuat private agar tidak dapat diubah langsung dari luar class.
- method setor() dibuat public agar dapat digunakan dari luar class.
- method getSaldo() dibuat public agar saldo dapat dibaca dengan cara yang terkontrol.

Kesalahan umum:
Mahasiswa sering menganggap semua attribute harus public agar mudah diakses. Padahal dalam encapsulation, attribute sebaiknya private, kemudian aksesnya dilakukan melalui method public.

Catatan untuk latihan:
Pada soal practice, mahasiswa dapat diminta memilih access modifier yang tepat, menentukan attribute mana yang sebaiknya private, atau menganalisis kode yang menggunakan public dan private.
TEXT,
                        'image_path' => 'materials/encapsulation/04-public-vs-private.png',
                    ],
                ],
            ],
            [
                'name' => 'Attribute private',
                'contents' => [
                    [
                        'title' => 'Pengertian Attribute private',
                        'content_text' => <<<TEXT
Attribute private adalah attribute yang hanya dapat diakses dari dalam class tempat attribute tersebut dibuat.

Penggunaan private bertujuan untuk melindungi data agar tidak dapat diubah langsung dari luar class.

Contoh:

class Mahasiswa {
    private String nama;
    private int umur;
}

Pada contoh tersebut, nama dan umur tidak dapat diakses langsung dari luar class Mahasiswa.

Jika programmer mencoba mengakses attribute private secara langsung dari luar class, maka program akan error.

Contoh salah:

public class Main {
    public static void main(String[] args) {
        Mahasiswa mhs = new Mahasiswa();
        mhs.nama = "Rani";
    }
}

Kode tersebut salah karena nama memiliki access modifier private. Attribute private tidak dapat diakses langsung menggunakan mhs.nama dari luar class Mahasiswa.

Untuk mengubah nilai attribute private, diperlukan method setter. Untuk mengambil nilainya, diperlukan method getter.
TEXT,
                        'image_path' => 'materials/encapsulation/05-attribute-private.png',
                    ],
                    [
                        'title' => 'Peran Attribute private dalam Encapsulation',
                        'content_text' => <<<TEXT
Attribute private menjadi bagian penting dalam encapsulation karena data tidak boleh diakses sembarangan.

Dengan membuat attribute private, class memiliki kendali penuh terhadap datanya sendiri. Class dapat menentukan bagaimana data boleh dibaca dan bagaimana data boleh diubah.

Contoh:

class Produk {
    private String nama;
    private int harga;
}

Pada class Produk, attribute nama dan harga tidak dapat diubah langsung dari luar class. Hal ini penting karena harga sebaiknya tidak boleh bernilai negatif.

Jika attribute harga dibuat public, maka kode berikut dapat terjadi:

Produk p = new Produk();
p.harga = -5000;

Nilai harga tersebut tidak valid. Untuk mencegahnya, harga dibuat private dan diubah melalui setter yang memiliki validasi.

Contoh yang lebih aman:

class Produk {
    private int harga;

    public void setHarga(int harga) {
        if (harga >= 0) {
            this.harga = harga;
        }
    }

    public int getHarga() {
        return harga;
    }
}

Kesimpulan:
Attribute private membantu menjaga data tetap aman dan sesuai aturan. Attribute private biasanya digunakan bersama getter dan setter.

Catatan untuk latihan:
Pada soal practice, mahasiswa dapat diminta menentukan mengapa attribute sebaiknya private, menganalisis error akibat akses langsung, atau membandingkan attribute public dan private.
TEXT,
                        'image_path' => 'materials/encapsulation/06-private-melindungi-data.png',
                    ],
                ],
            ],
            [
                'name' => 'Getter dan Setter',
                'contents' => [
                    [
                        'title' => 'Pengertian Getter dan Setter',
                        'content_text' => <<<TEXT
Getter dan setter adalah method yang digunakan untuk mengakses attribute private.

Getter digunakan untuk mengambil nilai attribute private. Setter digunakan untuk mengubah nilai attribute private.

Karena attribute private tidak dapat diakses langsung dari luar class, getter dan setter menjadi jalan untuk membaca dan mengubah data secara terkontrol.

Contoh getter:

public String getNama() {
    return nama;
}

Method getNama() digunakan untuk mengambil nilai attribute nama.

Contoh setter:

public void setNama(String nama) {
    this.nama = nama;
}

Method setNama() digunakan untuk mengubah nilai attribute nama.

Contoh lengkap:

class Mahasiswa {
    private String nama;

    public void setNama(String nama) {
        this.nama = nama;
    }

    public String getNama() {
        return nama;
    }
}

Pada contoh tersebut:
- nama adalah attribute private.
- setNama() digunakan untuk mengisi nilai nama.
- getNama() digunakan untuk mengambil nilai nama.
TEXT,
                        'image_path' => 'materials/encapsulation/07-getter-dan-setter.png',
                    ],
                    [
                        'title' => 'Contoh Penggunaan Getter dan Setter dalam Program',
                        'content_text' => <<<TEXT
Berikut contoh penggunaan getter dan setter dalam program Java:

class Mahasiswa {
    private String nama;

    public void setNama(String nama) {
        this.nama = nama;
    }

    public String getNama() {
        return nama;
    }
}

public class Main {
    public static void main(String[] args) {
        Mahasiswa mhs = new Mahasiswa();
        mhs.setNama("Rani");
        System.out.println(mhs.getNama());
    }
}

Output:

Rani

Penjelasan alur program:

1. Object mhs dibuat dari class Mahasiswa.
2. Method setNama("Rani") dipanggil untuk mengisi attribute nama.
3. Method getNama() dipanggil untuk mengambil nilai attribute nama.
4. Nilai nama ditampilkan ke layar.

Kesalahan umum:

1. Mengakses attribute private secara langsung.

Contoh salah:

mhs.nama = "Rani";

Kode tersebut salah jika nama dibuat private.

2. Setter tidak menerima parameter.

Contoh kurang tepat:

public void setNama() {
    this.nama = nama;
}

Setter seharusnya menerima parameter agar nilai baru dapat dikirim ke dalam method.

3. Getter tidak mengembalikan nilai.

Contoh salah:

public String getNama() {
    System.out.println(nama);
}

Getter sebaiknya menggunakan return untuk mengembalikan nilai.

Catatan untuk latihan:
Pada soal practice, mahasiswa dapat diminta memilih getter yang benar, memilih setter yang benar, menentukan output program yang menggunakan getter-setter, atau mengurutkan kode getter-setter.
TEXT,
                        'image_path' => 'materials/encapsulation/08-alur-getter-setter.png',
                    ],
                ],
            ],
            [
                'name' => 'Validasi Data Menggunakan Setter',
                'contents' => [
                    [
                        'title' => 'Pengertian Validasi Data pada Setter',
                        'content_text' => <<<TEXT
Validasi data adalah proses memeriksa apakah data yang dimasukkan sudah sesuai dengan aturan yang ditentukan.

Dalam encapsulation, validasi data sering dilakukan di dalam setter. Dengan cara ini, data yang tidak valid dapat dicegah sebelum masuk ke attribute.

Contoh aturan validasi:

1. Umur harus lebih dari 0.
2. Harga tidak boleh negatif.
3. Stok tidak boleh kurang dari 0.
4. Nama tidak boleh kosong.
5. Saldo tidak boleh bernilai negatif.

Contoh validasi umur:

class Mahasiswa {
    private int umur;

    public void setUmur(int umur) {
        if (umur > 0) {
            this.umur = umur;
        } else {
            System.out.println("Umur tidak valid");
        }
    }

    public int getUmur() {
        return umur;
    }
}

Pada contoh tersebut, nilai umur hanya disimpan jika lebih dari 0. Jika umur bernilai 0 atau negatif, maka data tidak disimpan dan program menampilkan pesan bahwa umur tidak valid.

Validasi seperti ini membantu menjaga agar object tetap memiliki data yang benar.
TEXT,
                        'image_path' => 'materials/encapsulation/09-validasi-data-menggunakan-setter.png',
                    ],
                    [
                        'title' => 'Contoh Validasi Setter dan Analisis Output',
                        'content_text' => <<<TEXT
Berikut contoh validasi data menggunakan setter pada class Produk:

class Produk {
    private String nama;
    private int harga;

    public void setNama(String nama) {
        if (!nama.isEmpty()) {
            this.nama = nama;
        } else {
            System.out.println("Nama tidak boleh kosong");
        }
    }

    public void setHarga(int harga) {
        if (harga >= 0) {
            this.harga = harga;
        } else {
            System.out.println("Harga tidak boleh negatif");
        }
    }

    public String getNama() {
        return nama;
    }

    public int getHarga() {
        return harga;
    }
}

Contoh penggunaan:

public class Main {
    public static void main(String[] args) {
        Produk p = new Produk();
        p.setNama("Buku");
        p.setHarga(15000);

        System.out.println(p.getNama());
        System.out.println(p.getHarga());
    }
}

Output:

Buku
15000

Jika harga diisi dengan nilai negatif:

p.setHarga(-5000);

Maka output yang muncul:

Harga tidak boleh negatif

Manfaat validasi setter:

1. Mencegah data tidak valid masuk ke object.
2. Membuat class memiliki aturan terhadap datanya sendiri.
3. Mengurangi kesalahan saat program digunakan.
4. Membuat program lebih aman dan mudah dirawat.

Kesalahan umum:

1. Setter langsung mengisi attribute tanpa validasi, padahal datanya perlu dibatasi.
2. Kondisi if salah, misalnya harga > 0 padahal harga 0 masih boleh.
3. Lupa menggunakan this ketika nama parameter sama dengan nama attribute.
4. Getter tidak disediakan sehingga data tidak dapat dibaca dari luar class.

Catatan untuk latihan:
Pada soal practice, mahasiswa dapat diminta menganalisis setter dengan validasi, menentukan output ketika data valid atau tidak valid, memilih kondisi if yang benar, atau mengurutkan kode setter dengan validasi.
TEXT,
                        'image_path' => 'materials/encapsulation/10-analisis-output-validasi.png',
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
