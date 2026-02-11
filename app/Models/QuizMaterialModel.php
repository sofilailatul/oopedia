<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizMaterialModel extends Model
{
    protected $table = 'quiz_materials';

    protected $fillable = [
        'quizzes_id',
        'material_id',
    ];
}
