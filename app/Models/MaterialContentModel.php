<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaterialContentModel extends Model
{
    use HasFactory;

    protected $table = 'material_contents';

    protected $fillable = [
        'material_id',
        'title',
        'content_text',
        'image_path',
        'sort_order',
    ];

    public function material()
    {
        return $this->belongsTo(MaterialModel::class, 'material_id');
    }
}
