<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_type',
        'public_token',
        'table_id',
        'customer_name',
        'user_id',
        'total_amount',
        'cash_amount',
        'change_amount',
        'payment_method',
        'payment_status',
        'payment_proof',
        'order_status',
    ];

    protected function casts(): array
    {
        return [
            'table_id' => 'integer',
            'user_id' => 'integer',
            'total_amount' => 'integer',
            'cash_amount' => 'integer',
            'change_amount' => 'integer',
            'payment_method' => PaymentMethod::class,
            'payment_status' => PaymentStatus::class,
        ];
    }

    // Meja tempat pesanan dibuat
    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    // Kasir yang memproses pesanan (null jika pesan mandiri via QR)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Detail item yang ada di dalam pesanan ini
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}
