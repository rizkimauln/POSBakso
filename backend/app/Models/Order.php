<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'public_token',
        'table_id',
        'user_id',
        'total_amount',
        'order_status',
        'payment_method',
        'payment_status'
    ];

    protected function casts(): array
    {
        return [
            'table_id' => 'integer',
            'user_id' => 'integer',
            'total_amount' => 'integer',
            'order_status' => OrderStatus::class,
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
}
