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
        'sub_topic_id',
        'attempt_mode',
        'attempt_type',
        'attempt_no',
        'target_level',
        'placement_level_result',
        'source_from',
        'next_action',
        'total_questions',
        'correct_answer',
        'score',
        'weak_sub_topic',
        'remediation_round',
        'started_at',
        'finished_at',
        'mc_correct',
        'mc_score',
        'drag_correct',
        'drag_score',
        'total_earned',
        'final_score',
        'is_passed',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'is_passed' => 'boolean',
        'attempt_no' => 'integer',
        'sub_topic_id' => 'integer',
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
        return $this->belongsTo(SubTopicModel::class, 'sub_topic_id');
    }

    public function answers()
    {
        return $this->hasMany(UserPracticeAnswerModel::class, 'practice_attempts_id');
    }
}