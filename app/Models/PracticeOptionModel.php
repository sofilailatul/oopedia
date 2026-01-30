<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PracticeOptionModel extends Model
{
    use HasFactory;

    protected $table = 'practice_options';

    protected $fillable = [
        'practice_questions_id',
        'option_text',
        'is_correct',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
    ];

    // Relationships
    public function question()
    {
        return $this->belongsTo(PracticeQuestionModel::class, 'practice_questions_id');
    }

    public function answers()
    {
        return $this->hasMany(UserPracticeAnswerModel::class, 'practice_options_id');
    }
}