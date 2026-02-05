<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserProgressModel;
use Carbon\Carbon;

class UserProgressSeeder extends Seeder
{
    public function run(): void
    {
        foreach (SeederState::$mahasiswaIds as $idx => $userId) {

            $classId = $idx < 4
                ? SeederState::$classAId
                : SeederState::$classBId;

            foreach (SeederState::$materialIds as $i => $materialId) {

                UserProgressModel::updateOrCreate(
                    [
                        'user_id' => $userId,
                        'material_id' => $materialId,
                        'class_id' => $classId,
                    ],
                    [
                        'status' => $i === 0 ? 'unlocked' : 'locked',
                        'read_at' => null,
                        'completed_practice_at' => $i === 0 ? Carbon::now()->subDay() : null,
                        'completed_quiz_at' => null,
                    ]
                );
            }
        }
    }
}
