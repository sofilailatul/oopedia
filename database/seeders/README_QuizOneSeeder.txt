QuizOneSeeder

File:
- QuizOneSeeder.php

Cara pakai:
1. Taruh QuizOneSeeder.php ke folder:
   database/seeders/

2. Pastikan seeder berikut sudah dijalankan lebih dulu:
   - MaterialOneSeeder.php
   - MaterialTwoSeeder.php

3. Jalankan:
   php artisan db:seed --class=QuizOneSeeder

Isi:
- Quiz 1 - Class dan Object & Encapsulation
- 20 soal multiple choice
- 5 poin per soal
- Total nilai 100
- Passing score 60
- Duration 30 menit
- Materi: Class dan Object + Encapsulation

Catatan:
- class_id default = 1
- created_by default = 2
- Ubah variabel $classId dan $createdBy di awal method run() jika ID pada database kamu berbeda.
- Seeder akan menghapus quiz lama dengan title yang sama agar data tidak dobel.
