<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassModel extends Model
{
    use HasFactory;

    protected $table = 'classes';
    protected $fillable = [
        'class_name',
        'class_code',
        'description',
        'created_by',
    ];

    // Relationships
    public function users()
    {
        return $this->belongsToMany(
            UserModel::class,  
            'class_user',      
            'class_id',        
            'user_id'          
        )
        ->withTimestamps()
        ->withPivot('joined_at');
    }


    public function progress()
    {
        return $this->hasMany(UserProgressModel::class, 'class_id');
    }
    
    public function lecturer()
    {
        return $this->belongsTo(UserModel::class, 'created_by');
    }
    
    public function scopeJoinedBy($query, int $userId)
    {
        return $query->whereHas('users', function($q) use ($userId) {
            $q->where('users.id', $userId);
        });
    }
}