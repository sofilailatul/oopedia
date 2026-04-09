<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('practice_attempts', function (Blueprint $table) {
            $table->dropForeign(['subtopic_id']);

            $table->dropColumn([
                'pretest_result',
                'source_from',
                'subtopic_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('practice_attempts', function (Blueprint $table) {
            $table->unsignedBigInteger('subtopic_id')->nullable()->after('user_progress_id');
            $table->enum('pretest_result', ['easy', 'medium', 'hard'])->nullable()->after('attempt_number');
            $table->string('source_from')->nullable()->after('pretest_result');
        });
    }
};