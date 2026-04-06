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
        Schema::create('user_practice_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practice_attempts_id')
                ->nullable()
                ->constrained('practice_attempts')
                ->onDelete('set null');
            $table->foreignId('practice_questions_id')
                ->nullable()
                ->constrained('practice_questions')
                ->onDelete('set null');
            $table->foreignId('practice_options_id')
                ->nullable()
                ->constrained('practice_options')
                ->onDelete('set null');
            $table->integer('attempt')->default(1);
            $table->json('selection_items')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->integer('score')->default(0);
            $table->integer('timespent')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_practice_answers');
    }
};
