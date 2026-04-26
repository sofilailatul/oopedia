<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PracticeAttemptModel extends Model
{
    use HasFactory;

    protected $table = 'practice_attempts';

    protected $fillable = [
        'user_id',
        'practices_id',
        'user_progress_id',
        'focused_subtopic_id',
        'attempt_type',
        'level',
        'mode',
        'attempt_number',
        'next_action',
        'started_at',
        'finished_at',
        'mc_correct',
        'mc_score',
        'drag_correct',
        'drag_score',
        'final_score',
        'is_passed',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'is_passed' => 'boolean',
        'attempt_number' => 'integer',
        'practices_id' => 'integer',
        'user_progress_id' => 'integer',
        'focused_subtopic_id' => 'integer',
        'total_questions' => 'integer',
        'correct_answer' => 'integer',
        'score' => 'float',
        'remediation_round' => 'integer',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(UserModel::class, 'user_id');
    }

    public function practice()
    {
        return $this->belongsTo(PracticeModel::class, 'practices_id');
    }

    public function subTopicRef()
    {
        return $this->belongsTo(SubTopicModel::class, 'subtopic_id');
    }

    public function answers()
    {
        return $this->hasMany(UserPracticeAnswerModel::class, 'practice_attempts_id');
    }

    public function progress()
    {
        return $this->belongsTo(UserProgressModel::class, 'user_progress_id');
    }
}