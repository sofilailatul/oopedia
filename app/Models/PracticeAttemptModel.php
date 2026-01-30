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

    public function answers()
    {
        return $this->hasMany(UserPracticeAnswerModel::class, 'practice_attempts_id');
    }
}