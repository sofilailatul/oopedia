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
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->unsignedBigInteger('subtopic_id')->nullable()->after('material_id');

            $table->foreign('subtopic_id')
                ->references('id')
                ->on('subtopics')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropForeign(['subtopic_id']);
            $table->dropColumn('subtopic_id');
        });
    }
};
