<?php

namespace App\Actions\Orders;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\TableStatus;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutOrderAction
{
    public function execute(Order $order, string $paymentMethod): Order
    {
        return DB::transaction(function () use ($order, $paymentMethod): Order {
            $order = Order::query()
                ->with('table')
                ->lockForUpdate()
                ->findOrFail($order->id);

            if ($order->payment_status === PaymentStatus::Lunas) {
                throw ValidationException::withMessages([
                    'order' => ['Order sudah lunas dan tidak bisa checkout ulang.'],
                ]);
            }

            if ($order->order_status !== OrderStatus::Selesai) {
                throw ValidationException::withMessages([
                    'order_status' => ['Order harus selesai sebelum checkout.'],
                ]);
            }

            $order->update([
                'payment_method' => $paymentMethod,
                'payment_status' => PaymentStatus::Lunas->value,
            ]);

            $order->table()->update([
                'status' => TableStatus::Kosong->value,
            ]);

            return $order->refresh()->load(['table', 'user', 'orderItems.menu.category']);
        });
    }
}
