<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("
            ALTER TABLE practice_attempts
            MODIFY attempt_type ENUM('pretest', 'practice') NOT NULL
        ");

        DB::statement("
            ALTER TABLE practice_attempts
            MODIFY mode ENUM('normal', 'focused_remedial') NULL DEFAULT NULL
        ");

        DB::statement("
            ALTER TABLE practice_attempts
            MODIFY level ENUM('easy', 'medium', 'hard') NULL
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE practice_attempts
            MODIFY attempt_type ENUM('pretest', 'practice', 'remedial') NOT NULL
        ");

        DB::statement("
            ALTER TABLE practice_attempts
            MODIFY mode VARCHAR(255) NOT NULL DEFAULT 'normal'
        ");

        DB::statement("
            ALTER TABLE practice_attempts
            MODIFY level VARCHAR(255) NULL
        ");
    }
};