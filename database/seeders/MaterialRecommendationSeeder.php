<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MaterialRecommendationModel;

class MaterialRecommendationSeeder extends Seeder
{
    public function run(): void
    {
        $materialId = SeederState::$materialIds[0] ?? null;
        if (!$materialId) return;

        foreach (SeederState::$mahasiswaIds as $idx => $userId) {
            $quizId = $idx < 4 ? SeederState::$quizAId : SeederState::$quizBId;

            MaterialRecommendationModel::create([
                'user_id' => $userId,
                'material_id' => $materialId,
                'quizzes_id' => $quizId,
                'reason' => 'low_score',
                'is_completed' => false,
            ]);
        }
    }
}
