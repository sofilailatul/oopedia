<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_quiz_answers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('quiz_attempts_id')
                ->constrained('quiz_attempts')
                ->cascadeOnDelete();

            $table->foreignId('quiz_questions_id')
                ->constrained('quiz_questions')
                ->cascadeOnDelete();

            $table->foreignId('quiz_options_id')
                ->constrained('quiz_options')
                ->cascadeOnDelete();

            $table->boolean('is_correct')->default(false);

            $table->timestamps();

        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_quiz_answers');
    }
};
