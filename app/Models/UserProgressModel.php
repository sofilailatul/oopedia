<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'read_at',
        'completed_practice_at',
        'completed_quiz_at',
    ];

    protected $casts = [
    'read_at' => 'datetime',
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
}
