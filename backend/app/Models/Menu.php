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
        'is_active',
        'is_best_seller',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'category_id' => 'integer',
        'price' => 'integer',
        'is_active' => 'boolean',
        'is_best_seller' => 'boolean',
    ];

    // Relasi: Menu dimiliki oleh sebuah kategori
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
