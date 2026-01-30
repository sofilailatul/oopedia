<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PracticeItemModel extends Model
{
    use HasFactory;

    protected $table = 'practice_items';

    protected $fillable = [
        'practice_questions_id',
        'item_text',
        'order_number',
    ];

    // Relationships
    public function question()
    {
        return $this->belongsTo(PracticeQuestionModel::class, 'practice_questions_id');
    }
}