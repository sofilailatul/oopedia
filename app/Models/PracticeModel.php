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
        'difficulty_level',
    ];

    protected $casts = [
        'difficulty_level' => 'string',
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
