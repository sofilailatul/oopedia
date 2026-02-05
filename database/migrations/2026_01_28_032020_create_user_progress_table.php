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
        Schema::create('user_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('material_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->nullable()->constrained()->cascadeOnDelete();

            // status belajar
            $table->enum('status', ['locked','unlocked','in_progress', 'completed'])->default('locked');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('completed_practice_at')->nullable();
            $table->timestamp('completed_quiz_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id','material_id','class_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_progress');
    }
};
