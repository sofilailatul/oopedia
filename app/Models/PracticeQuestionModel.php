<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PracticeQuestionModel extends Model
{
    use HasFactory;

    protected $table = 'practice_questions';

    protected $fillable = [
        'practices_id',
        'question_text',
        'sub_topic',
        'sub_topic_id',
        'type',
        'question_type',
        'image_path',
        'points',
        'output_code',
        'feedback_correct',
        'feedback_incorrect',
    ];

    protected $casts = [
        'type' => 'string',
        'question_type' => 'string',
        'points' => 'integer',
        'sub_topic' => 'string',
        'sub_topic_id' => 'integer',
    ];

    // Relationships
    public function practice()
    {
        return $this->belongsTo(PracticeModel::class, 'practices_id');
    }

    public function subTopicRef()
    {
        return $this->belongsTo(SubTopicModel::class, 'sub_topic_id');
    }

    public function options()
    {
        return $this->hasMany(PracticeOptionModel::class, 'practice_questions_id');
    }

    public function items()
    {
        return $this->hasMany(PracticeItemModel::class, 'practice_questions_id')
            ->orderBy('order_number');
    }

    public function answers()
    {
        return $this->hasMany(UserPracticeAnswerModel::class, 'practice_questions_id');
    }
}