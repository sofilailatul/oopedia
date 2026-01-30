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
            MaterialSeeder::class,
            PracticeSeeder::class,
            QuizSeeder::class,
            UserProgressSeeder::class,
            MaterialRecommendationSeeder::class,
            PracticeAttemptSeeder::class,
            QuizAttemptSeeder::class,
            MaterialContentSeeder::class,
        ]);
    }
}