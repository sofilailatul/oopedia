<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserQuizAnswerModel extends Model
{
    use HasFactory;

    protected $table = 'user_quiz_answers';

    protected $fillable = [
        'quiz_attempts_id',
        'quiz_questions_id',
        'quiz_options_id',
        'is_correct',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
    ];

    public function attempt()
    {
        return $this->belongsTo(QuizAttemptModel::class, 'quiz_attempts_id');
    }

    public function question()
    {
        return $this->belongsTo(QuizQuestionsModel::class, 'quiz_questions_id');
    }

    public function option()
    {
        return $this->belongsTo(QuizOptionModel::class, 'quiz_options_id');
    }
    // akses user: $answer->attempt->user
}