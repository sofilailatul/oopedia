<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            ClassSeeder::class,
            MaterialOneSeeder::class,
            MaterialTwoSeeder::class,
            MaterialOnePracticeSeeder::class,
            MaterialTwoPracticeSeeder::class,
            QuizOneSeeder::class,
        ]);
    }
}