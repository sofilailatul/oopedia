<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MaterialModel;
use App\Models\MaterialContentModel;

class MaterialContentSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil semua materi
        $materials = MaterialModel::all();

        if ($materials->isEmpty()) {
            $this->command->warn('Material kosong, MaterialContentSeeder dilewati');
            return;
        }

        foreach ($materials as $material) {

            $sections = $this->dummySections($material->id);

            foreach ($sections as $section) {
                MaterialContentModel::create($section);
            }
        }
    }

    /**
     * Dummy section untuk 1 materi
     */
    private function dummySections(int $materialId): array
    {
        return [
            [
                'material_id' => $materialId,
                'title' => 'Pendahuluan',
                'content_text' => 'Materi ini membahas konsep dasar yang harus dipahami sebelum melanjutkan ke topik berikutnya.',
                'image_path' => null,
                'sort_order' => 1,
            ],
            [
                'material_id' => $materialId,
                'title' => 'Konsep Utama',
                'content_text' => 'Konsep utama dalam materi ini meliputi definisi, karakteristik, dan contoh penerapannya dalam dunia nyata.',
                'image_path' => 'materials/'.$materialId.'/sections/concept.png',
                'sort_order' => 2,
            ],
            [
                'material_id' => $materialId,
                'title' => 'Contoh Implementasi',
                'content_text' => 'Berikut adalah contoh implementasi sederhana untuk membantu pemahaman mahasiswa terhadap materi.',
                'image_path' => 'materials/'.$materialId.'/sections/example.png',
                'sort_order' => 3,
            ],
            [
                'material_id' => $materialId,
                'title' => 'Ringkasan',
                'content_text' => 'Dari materi ini dapat disimpulkan bahwa pemahaman konsep dasar sangat penting sebelum masuk ke tahap lanjutan.',
                'image_path' => null,
                'sort_order' => 4,
            ],
        ];
    }
}
