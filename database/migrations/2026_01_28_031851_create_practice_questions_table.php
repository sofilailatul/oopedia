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
        Schema::create('practice_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practices_id')
                ->nullable()
                ->constrained('practices')
                ->onDelete('set null');
            $table->foreignId('subtopic_id')
                ->nullable();

            $table->enum('type', ['multiple_choice','drag_drop']);
            $table->text('question_text');
            $table->string('image_path')->nullable();
            $table->integer('points')->default(10);
            $table->text('code_snippet')->nullable();
            $table->text('feedback_correct')->nullable();
            $table->text('feedback_incorrect')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('practice_questions');
    }
};
