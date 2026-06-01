<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'menu_id',
        'quantity',
        'price',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'order_id' => 'integer',
            'menu_id' => 'integer',
            'quantity' => 'integer',
            'price' => 'integer',
        ];
    }

    // Pesanan induk
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // Menu yang dipesan
    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }
}
