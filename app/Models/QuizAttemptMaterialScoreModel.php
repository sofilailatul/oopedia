<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizAttemptMaterialScoreModel extends Model
{
    protected $table = 'quiz_attempt_material_scores';

    protected $primaryKey = 'id';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'quiz_attempts_id',
        'material_id',
        'correct_count',
        'earned_score',
        'max_score',
        'percentage',
    ];

    /**
     * =========================
     * 🔗 RELATIONS
     * =========================
     */

    // Attempt quiz
    public function attempt()
    {
        return $this->belongsTo(
            QuizAttemptModel::class,
            'quiz_attempts_id'
        );
    }

    // Materi
    public function material()
    {
        return $this->belongsTo(
            MaterialModel::class,
            'material_id'
        );
    }
}
