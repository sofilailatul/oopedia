<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\UserModel;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = UserModel::updateOrCreate(
            ['email' => 'admin@oopedia.test'],
            ['nama' => 'Superadmin OOPedia', 'role' => 'superadmin', 'password' => Hash::make('password')]
        );

        $dosen = UserModel::updateOrCreate(
            ['email' => 'dosen@oopedia.test'],
            ['nama' => 'Dosen OOPedia', 'role' => 'dosen', 'password' => Hash::make('password')]
        );

        SeederState::$superadminId = (int) $admin->id;
        SeederState::$dosenId = (int) $dosen->id;

        SeederState::$mahasiswaIds = [];
        for ($i=1; $i<=8; $i++) {
            $mhs = UserModel::updateOrCreate(
                ['email' => "mhs{$i}@oopedia.test"],
                ['nama' => "Mahasiswa {$i}", 'role' => 'mahasiswa', 'password' => Hash::make('password')]
            );
            SeederState::$mahasiswaIds[] = (int) $mhs->id;
        }

        // opsional: akun tamu tersimpan di DB
        UserModel::updateOrCreate(
            ['email' => 'tamu@oopedia.test'],
            ['nama' => 'Tamu OOPedia', 'role' => 'tamu', 'password' => Hash::make('password')]
        );
    }
}
