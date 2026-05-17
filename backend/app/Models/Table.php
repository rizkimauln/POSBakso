<?php

namespace App\Models;

use App\Enums\TableStatus;
use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    protected $fillable = ['table_number', 'qr_token', 'status'];

    protected function casts(): array
    {
        return [
            'status' => TableStatus::class,
        ];
    }

    // Relasi: Satu meja bisa memiliki banyak riwayat pesanan
    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
