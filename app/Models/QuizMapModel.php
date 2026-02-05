<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizMapModel extends Model
{
    protected $table = 'quiz_map';

    protected $fillable = [
        'quiz_id',
        'quiz_question_id',
        'points',
    ];

    public $timestamps = true;

    /**
     * Relasi ke Quiz
     */
    public function quiz()
    {
        return $this->belongsTo(QuizModel::class, 'quiz_id');
    }

    /**
     * Relasi ke Quiz Question
     */
    public function quizQuestion()
    {
        return $this->belongsTo(QuizQuestionModel::class, 'quiz_question_id');
    }
}
