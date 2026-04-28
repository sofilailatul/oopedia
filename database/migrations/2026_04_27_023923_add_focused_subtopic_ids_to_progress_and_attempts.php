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
        Schema::table('user_progress', function (Blueprint $table) {
            $table->text('focused_subtopic_ids')->nullable()->after('focused_subtopic_id');
        });

        Schema::table('practice_attempts', function (Blueprint $table) {
            $table->text('focused_subtopic_ids')->nullable()->after('focused_subtopic_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_progress', function (Blueprint $table) {
            $table->dropColumn('focused_subtopic_ids');
        });

        Schema::table('practice_attempts', function (Blueprint $table) {
            $table->dropColumn('focused_subtopic_ids');
        });
    }
};
