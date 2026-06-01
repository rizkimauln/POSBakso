<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $fillable = [
        'category_id', 
        'name', 
        'price', 
        'image_path', 
        'is_active'
    ];

    protected function casts(): array
    {
        return [
            'category_id' => 'integer',
            'price' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    // Relasi: Menu dimiliki oleh sebuah kategori
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
