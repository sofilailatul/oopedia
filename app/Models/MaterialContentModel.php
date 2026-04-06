<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class MaterialContentModel extends Model
{
    use HasFactory;

    protected $table = 'material_contents';

    protected $fillable = [
        'material_id',
        'subtopic_id',
        'title',
        'content_text',
        'image_path',
        'sort_order',
    ];

    public function material()
    {
        return $this->belongsTo(MaterialModel::class, 'material_id');
    }

    public function subTopic()
    {
        return $this->belongsTo(SubTopicModel::class, 'subtopic_id');
    }

    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        if (!$this->image_path) return null;

        if (str_starts_with($this->image_path, 'http://') || str_starts_with($this->image_path, 'https://')) {
            return $this->image_path;
        }

        if (str_starts_with($this->image_path, '/storage/')) {
            return $this->image_path;
        }

        return asset('storage/' . ltrim($this->image_path, '/'));
    }
}
