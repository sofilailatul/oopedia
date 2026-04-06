<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaterialModel extends Model
{
    use HasFactory;

    protected $table = 'materials';

    protected $fillable = [
        'material_name',
        'order_number',
        'description',
        'content',
        'created_by',
    ];


    // Relationships
    public function creator()
    {
        return $this->belongsTo(UserModel::class, 'created_by');
    }

    public function classes()
    {
        return $this->belongsToMany(
            ClassModel::class,
            'material_class',
            'material_id',
            'class_id'
        )->withPivot(['publish_date', 'is_active', 'actived_at', 'deactived_at'])
         ->withTimestamps();
    }

    public function practices()
    {
        return $this->hasMany(PracticeModel::class, 'material_id');
    }

    public function progress()
    {
        return $this->hasMany(UserProgressModel::class, 'material_id');
    }

    public function recommendations()
    {
        return $this->hasMany(MaterialRecommendationModel::class, 'material_id');
    }
    
    public function quizQuestions()
    {
        return $this->hasMany(QuizQuestionsModel::class, 'material_id');
    }

    public function contents()
    {
        return $this->hasMany(
            MaterialContentModel::class,
            'material_id'
        )->orderBy('sort_order');
    }

    public function subTopics()
    {
        return $this->hasMany(SubTopicModel::class, 'material_id')->orderBy('name');
    }
}