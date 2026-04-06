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
        Schema::table('material_contents', function (Blueprint $table) {
            if (Schema::hasColumn('material_contents', 'subtopic_id')) {
                $table->foreign('subtopic_id')
                    ->references('id')
                    ->on('subtopics')
                    ->cascadeOnUpdate()
                    ->nullOnDelete();
            }
        });

        Schema::table('practice_questions', function (Blueprint $table) {
            if (Schema::hasColumn('practice_questions', 'subtopic_id')) {
                $table->foreign('subtopic_id')
                    ->references('id')
                    ->on('subtopics')
                    ->nullOnDelete();
            }
        });

        Schema::table('practice_attempts', function (Blueprint $table) {
            if (Schema::hasColumn('practice_attempts', 'subtopic_id')) {
                $table->foreign('subtopic_id')
                    ->references('id')
                    ->on('subtopics')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('practice_attempts', function (Blueprint $table) {
            if (Schema::hasColumn('practice_attempts', 'subtopic_id')) {
                $table->dropForeign(['subtopic_id']);
            }
        });

        Schema::table('practice_questions', function (Blueprint $table) {
            if (Schema::hasColumn('practice_questions', 'subtopic_id')) {
                $table->dropForeign(['subtopic_id']);
            }
        });

        Schema::table('material_contents', function (Blueprint $table) {
            if (Schema::hasColumn('material_contents', 'subtopic_id')) {
                $table->dropForeign(['subtopic_id']);
            }
        });
    }
};
