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
        Schema::create('practice_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null');
            $table->foreignId('practices_id')
                ->nullable()
                ->constrained('practices')
                ->onDelete('set null');
            $table->foreignId('subtopic_id')
                ->nullable();
            $table->enum('attempt_type', ['pretest', 'practice','remedial']);
            $table->integer('attempt_number')->default(1);
            $table->enum('pretest_result',['easy','medium','hard'])->nullable();
            $table->string('source_from')->nullable();
            $table->string('next_action')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->integer('mc_correct')->default(0);
            $table->integer('mc_score')->default(0);
            $table->integer('drag_correct')->default(0);
            $table->integer('drag_score')->default(0);
            $table->integer('final_score')->default(0);
            $table->boolean('is_passed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('practice_attempts');
    }
};
