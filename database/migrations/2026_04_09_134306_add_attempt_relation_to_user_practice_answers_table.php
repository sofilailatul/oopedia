<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('user_practice_answers', function (Blueprint $table) {
            $table->unsignedBigInteger('practice_attempts_id')->nullable()->change();

            $table->index('practice_attempts_id');
            $table->index('practice_questions_id');
            $table->index(['practice_attempts_id', 'practice_questions_id'], 'upa_attempt_question_idx');
        });

        /**
         * Opsional:
         * kalau mau sekalian isi practice_attempts_id lama berdasarkan attempt terbaru user,
         * sebaiknya dikerjakan lewat seeder / command terpisah, bukan migration.
         */
    }

    public function down(): void
    {
        Schema::table('user_practice_answers', function (Blueprint $table) {
            $table->dropIndex(['practice_attempts_id']);
            $table->dropIndex(['practice_questions_id']);
            $table->dropIndex('upa_attempt_question_idx');
        });
    }
};