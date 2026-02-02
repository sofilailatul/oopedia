<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class UserModel extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    protected $table = 'users';

    protected $fillable = [
        'nama',
        'email',
        'password',
        'role',
        'last_login',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'last_login' => 'datetime',
        'email_verified_at' => 'datetime',
    ];

    // Relationships
    public function classes()
    {
        return $this->belongsToMany(
            ClassModel::class,
            'class_user',
            'user_id',   // FK di pivot yang menunjuk user
            'class_id'   // FK di pivot yang menunjuk class
        )->withPivot('joined_at')->withTimestamps();
    }

    public function createdMaterials()
    {
        return $this->hasMany(MaterialModel::class, 'created_by');
    }

    public function practiceAttempts()
    {
        return $this->hasMany(PracticeAttemptModel::class, 'user_id');
    }

    public function quizAttempts()
    {
        return $this->hasMany(QuizAttemptModel::class, 'user_id');
    }

    public function progress()
    {
        return $this->hasMany(UserProgressModel::class, 'user_id');
    }

    public function recommendations()
    {
        return $this->hasMany(MaterialRecommendationModel::class, 'user_id');
    }
}