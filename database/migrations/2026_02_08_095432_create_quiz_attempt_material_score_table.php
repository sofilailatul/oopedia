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
        Schema::create('quiz_attempt_material_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_attempts_id')->constrained('quiz_attempts')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('materials')->cascadeOnDelete();

            $table->unsignedInteger('correct_count')->default(0);
            $table->unsignedInteger('earned_score')->default(0);
            $table->unsignedInteger('max_score')->default(0);
            $table->unsignedInteger('percentage')->default(0);

            $table->timestamps();

            $table->unique(['quiz_attempts_id', 'material_id'], 'quiz_attempt_material_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_attempt_material_scores');
    }
};
