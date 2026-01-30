<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizQuestionsModel extends Model
{
    use HasFactory;

    protected $table = 'quiz_questions';

    protected $fillable = [
        'material_id',
        'quiz_text',
        'image_path',
        'feedback_correct',
        'feedback_incorrect',
    ];

    public function material()
    {
        return $this->belongsTo(MaterialModel::class, 'material_id');
    }

    public function quizzes()
    {
        return $this->belongsToMany(
            QuizModel::class,
            'quiz_map',
            'quiz_question_id',
            'quiz_id'
        )->withPivot(['points'])
         ->withTimestamps();
    }

    public function options()
    {
        // default urut by id, atau kamu bisa ->orderBy('id')
        return $this->hasMany(QuizOptionModel::class, 'quiz_questions_id');
    }

    public function answers()
    {
        return $this->hasMany(UserQuizAnswerModel::class, 'quiz_questions_id');
    }
}
