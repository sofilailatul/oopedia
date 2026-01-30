<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizOptionModel extends Model
{
    use HasFactory;

    protected $table = 'quiz_options';

    protected $fillable = [
        'quiz_questions_id',
        'option_text',
        'is_correct',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
    ];

    public function question()
    {
        return $this->belongsTo(QuizQuestionsModel::class, 'quiz_questions_id');
    }

    public function answers()
    {
        return $this->hasMany(UserQuizAnswerModel::class, 'quiz_options_id');
    }
}
