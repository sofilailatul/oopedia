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
        Schema::create('practice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practice_questions_id')->nullable()->constrained('practice_questions')->onDelete('set null');
            $table->string('item_text');
            $table->integer('order_number');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('practice_items');
    }
};
