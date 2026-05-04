<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ClassModel;
use App\Models\UserModel;

class ClassSeeder extends Seeder
{
    public function run(): void
    {
        $classA = ClassModel::updateOrCreate(
            ['class_code' => 'SIB2D'],
            [
                'class_name' => 'SIB 2 - D',
                'description' => 'KELAS SIB 2D',
            ]
        );

        $classB = ClassModel::updateOrCreate(
            ['class_code' => 'SIB2C'],
            [
                'class_name' => 'SIB 2 - C',
                'description' => 'KELAS SIB 2C',
            ]
        );

        SeederState::$classAId = (int) $classA->id;
        SeederState::$classBId = (int) $classB->id;

        /** @var UserModel $dosen */
        $dosen = UserModel::findOrFail(SeederState::$dosenId);

        // dosen join ke dua kelas
        $dosen->classes()->syncWithoutDetaching([
            $classA->id => ['joined_at' => now()],
            $classB->id => ['joined_at' => now()],
        ]);

        // mahasiswa join: 4 ke A, sisanya ke B
        foreach (SeederState::$mahasiswaIds as $idx => $uid) {
            $mhs = UserModel::findOrFail($uid);
            $target = $idx < 4 ? $classA : $classB;

            $mhs->classes()->syncWithoutDetaching([
                $target->id => ['joined_at' => now()],
            ]);
        }
    }
}
