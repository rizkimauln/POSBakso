<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name'];

    // Relasi: Satu kategori memiliki banyak menu (Bakso, Minuman, dsb)
    public function menus()
    {
        return $this->hasMany(Menu::class);
    }
}
