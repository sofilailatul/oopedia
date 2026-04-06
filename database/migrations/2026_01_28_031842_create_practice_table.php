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
        Schema::create('practices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->nullable()
                ->constrained('materials')
                ->onDelete('set null');
            $table->enum ('type', ['pretest', 'practice']);
            $table->enum('level', ['easy','medium','hard']);
            $table->integer('min_score')->default(0)->nullable();
            $table->integer('max_attempts')->default(1)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('practices');
    }
};
