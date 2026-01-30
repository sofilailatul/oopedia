<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizModel extends Model
{
    use HasFactory;

    protected $table = 'quizzes';

    protected $fillable = [
        'title',
        'class_id',
        'created_by',
        'duration',
        'passing_score',
        'start_at',
        'end_at',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(UserModel::class, 'created_by');
    }

    public function questions()
    {
        return $this->belongsToMany(
            QuizQuestionsModel::class,
            'quiz_map',
            'quiz_id',
            'quiz_question_id'
        )->withPivot(['points'])
         ->withTimestamps();
    }

    public function attempts()
    {
        return $this->hasMany(QuizAttemptModel::class, 'quizzes_id');
    }
}
