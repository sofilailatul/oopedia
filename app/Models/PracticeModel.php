<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PracticeModel extends Model
{
    use HasFactory;

    protected $table = 'practices';

    protected $fillable = [
        'material_id',
        'type',
        'level',
        'min_score',
        'max_attempts'
    ];

    protected $casts = [
        'type' => 'string',
        'level' => 'string',
        'min_score' => 'integer',
        'max_attempts' => 'integer',
    ];

    // Relationships
    public function material()
    {
        return $this->belongsTo(MaterialModel::class, 'material_id');
    }

    public function questions()
    {
        return $this->hasMany(PracticeQuestionModel::class, 'practices_id');
    }

    public function attempts()
    {
        return $this->hasMany(PracticeAttemptModel::class, 'practices_id');
    }
}
