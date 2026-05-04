Seeder pretest dan practice

File:
1. MaterialOnePracticeSeeder.php
   - Materi: Class dan Object
   - Pretest: 30 soal MC
   - Practice easy: 36 MC + 6 drag_drop
   - Practice medium: 30 MC + 12 drag_drop
   - Practice hard: 24 MC + 18 drag_drop

2. MaterialTwoPracticeSeeder.php
   - Materi: Encapsulation
   - Pretest: 25 soal MC
   - Practice easy: 30 MC + 5 drag_drop
   - Practice medium: 25 MC + 10 drag_drop
   - Practice hard: 20 MC + 15 drag_drop

Cara pakai:
1. Taruh file PHP di database/seeders/
2. Pastikan MaterialOneSeeder dan MaterialTwoSeeder sudah dijalankan lebih dulu agar data materials dan subtopics sudah ada.
3. Jalankan:
   php artisan db:seed --class=MaterialOnePracticeSeeder
   php artisan db:seed --class=MaterialTwoPracticeSeeder

Catatan:
- Seeder akan menghapus practice lama pada material yang sama sebelum insert ulang, supaya tidak dobel.
- Untuk level hard, min_score dibuat 80.
- Untuk pretest/easy/medium, min_score dibuat 60.
- code_snippet pada drag_drop berisi output/hasil program.
