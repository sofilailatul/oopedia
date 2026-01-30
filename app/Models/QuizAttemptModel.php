<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizAttemptModel extends Model
{
    use HasFactory;

    protected $table = 'quiz_attempts';

    protected $fillable = [
        'user_id',
        'quizzes_id',
        'started_at',
        'finished_at',
        'total_score',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'total_score' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(UserModel::class, 'user_id');
    }

    public function quiz()
    {
        return $this->belongsTo(QuizModel::class, 'quizzes_id');
    }

    public function answers()
    {
        return $this->hasMany(UserQuizAnswerModel::class, 'quiz_attempts_id');
    }
}