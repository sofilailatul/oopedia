<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('user_progress', function (Blueprint $table) {
            $table->string('current_level')->nullable()->after('status');
            // easy | medium | hard

            $table->string('current_mode')->default('pretest')->after('current_level');
            // pretest | normal | focused_remedial | repeat_material | passed

            $table->unsignedBigInteger('focused_subtopic_id')->nullable()->after('current_mode');

            $table->integer('pretest_score')->nullable()->after('focused_subtopic_id');
            $table->integer('last_score')->nullable()->after('pretest_score');

            $table->unsignedInteger('easy_remedial_count')->default(0)->after('last_score');
            $table->unsignedInteger('medium_remedial_count')->default(0)->after('easy_remedial_count');
            $table->unsignedInteger('hard_remedial_count')->default(0)->after('medium_remedial_count');

            $table->string('next_action')->nullable()->after('hard_remedial_count');
            $table->timestamp('passed_at')->nullable()->after('next_action');

            $table->index(['user_id', 'material_id']);
            $table->index('focused_subtopic_id');

            $table->foreign('focused_subtopic_id')->references('id')->on('subtopics')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('user_progress', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'material_id']);
            $table->dropIndex(['focused_subtopic_id']);

            $table->dropColumn([
                'current_level',
                'current_mode',
                'focused_subtopic_id',
                'pretest_score',
                'last_score',
                'easy_remedial_count',
                'medium_remedial_count',
                'hard_remedial_count',
                'next_action',
                'passed_at',
            ]);
        });
    }
};