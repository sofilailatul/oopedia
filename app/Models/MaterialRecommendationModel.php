<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaterialRecommendationModel extends Model
{
    use HasFactory;

    protected $table = 'material_recommendations';

    protected $fillable = [
        'user_id',
        'material_id',
        'quizzes_id',
        'reason',
        'is_completed',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(UserModel::class, 'user_id');
    }

    public function material()
    {
        return $this->belongsTo(MaterialModel::class, 'material_id');
    }

    public function quiz()
    {
        return $this->belongsTo(QuizModel::class, 'quizzes_id');
    }
}
