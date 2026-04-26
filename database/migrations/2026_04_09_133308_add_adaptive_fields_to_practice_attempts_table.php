<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('practice_attempts', function (Blueprint $table) {
            $table->string('level')->nullable()->after('attempt_type');
            // easy | medium | hard

            $table->string('mode')->default('normal')->after('level');
            // normal | focused_remedial

            $table->unsignedBigInteger('focused_subtopic_id')->nullable()->after('mode');

            $table->unsignedBigInteger('user_progress_id')->nullable()->after('practices_id');

            $table->index(['user_id', 'practices_id']);
            $table->index(['user_id', 'level']);
            $table->index('focused_subtopic_id');
            $table->index('user_progress_id');

            // optional
            $table->foreign('user_progress_id')->references('id')->on('user_progress')->nullOnDelete();
            $table->foreign('focused_subtopic_id')->references('id')->on('subtopics')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('practice_attempts', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'practices_id']);
            $table->dropIndex(['user_id', 'level']);
            $table->dropIndex(['focused_subtopic_id']);
            $table->dropIndex(['user_progress_id']);

            $table->dropColumn([
                'level',
                'mode',
                'focused_subtopic_id',
                'user_progress_id',
            ]);
        });
    }
};