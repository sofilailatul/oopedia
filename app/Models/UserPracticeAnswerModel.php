<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPracticeAnswerModel extends Model
{
    use HasFactory;

    protected $table = 'user_practice_answers';

    protected $fillable = [
        'practice_attempts_id',
        'practice_questions_id',
        'practice_options_id',
        'attempt',
        'selection_items',
        'is_correct',
        'score',
        'timespent',
    ];

    protected $casts = [
        'selection_items' => 'array',
        'is_correct' => 'boolean',
        'attempt' => 'integer',
    ];

    // Relationships
    public function attempt()
    {
        return $this->belongsTo(PracticeAttemptModel::class, 'practice_attempts_id');
    }

    public function question()
    {
        return $this->belongsTo(PracticeQuestionModel::class, 'practice_questions_id');
    }

    public function option()
    {
        return $this->belongsTo(PracticeOptionModel::class, 'practice_options_id');
    }
}