<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProgressModel extends Model
{
    use HasFactory;

    protected $table = 'user_progress';
    
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'material_id',
        'class_id',
        'status',
        'current_level',
        'current_mode',
        'focused_subtopic_id',
        'focused_subtopic_ids',
        'pretest_score',
        'last_score',
        'easy_remidial_score',
        'medium_remidial_score',
        'hard_remidial_score',
        'easy_remedial_count',
        'medium_remedial_count',
        'hard_remedial_count',
        'next_action',
        'passed_at',
        'read_at',
        'completed_pretest_at',
        'completed_practice_at',
        'completed_quiz_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'completed_pretest_at' => 'datetime',
        'completed_practice_at' => 'datetime',
        'completed_quiz_at' => 'datetime',
    ];


    public function user()
    {
        return $this->belongsTo(UserModel::class, 'user_id');
    }

    public function material()
    {
        return $this->belongsTo(MaterialModel::class, 'material_id');
    }

    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }
    
    public function focusedSubtopic(): BelongsTo
    {
        return $this->belongsTo(SubtopicModel::class, 'focused_subtopic_id');
    }
}
