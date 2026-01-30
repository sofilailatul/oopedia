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
        Schema::create('material_contents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('material_id')
                ->constrained('materials')
                ->cascadeOnDelete();

            $table->string('title')->nullable();     // judul section (opsional)
            $table->longText('content_text');        // isi materi
            $table->string('image_path')->nullable(); // 1 section 1 gambar

            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index(['material_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('material_contents');
    }
};
