<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubTopicModel extends Model
{
    use HasFactory;

    protected $table = 'subtopics';

    protected $fillable = [
        'material_id',
        'name',
    ];

    public function material()
    {
        return $this->belongsTo(MaterialModel::class, 'material_id');
    }
}
