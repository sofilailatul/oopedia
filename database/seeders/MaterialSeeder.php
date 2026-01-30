<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MaterialModel;
use App\Models\ClassModel;

class MaterialSeeder extends Seeder
{
    public function run(): void
    {
        $classA = ClassModel::findOrFail(SeederState::$classAId);
        $classB = ClassModel::findOrFail(SeederState::$classBId);

        $materials = [
            ['Konsep Dasar OOP', 1, 'Pengenalan class, object, method.'],
            ['Encapsulation', 2, 'Getter/setter, access modifier.'],
            ['Inheritance & Polymorphism', 3, 'extends, override, interface.'],
        ];

        SeederState::$materialIds = [];

        foreach ($materials as [$name, $order, $desc]) {
            $m = MaterialModel::create([
                'material_name' => $name,
                'order_number' => $order,
                'description' => $desc,
                'content' => "Konten demo untuk: {$name}",
                'created_by' => SeederState::$dosenId,
            ]);

            SeederState::$materialIds[] = (int) $m->id;

            // publish ke dua kelas via pivot (material_class)
            $m->classes()->syncWithoutDetaching([
                $classA->id => [
                    'publish_date' => now()->toDateString(),
                    'is_active' => true,
                    'actived_at' => now(),
                    'deactived_at' => null,
                ],
                $classB->id => [
                    'publish_date' => now()->toDateString(),
                    'is_active' => true,
                    'actived_at' => now(),
                    'deactived_at' => null,
                ],
            ]);
        }
    }
}
