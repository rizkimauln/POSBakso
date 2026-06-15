<?php

namespace App\Actions\Orders;

use App\Enums\PaymentStatus;
use App\Enums\TableStatus;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutOrderAction
{
    public function execute(Order $order, string $paymentMethod, ?int $cashAmount = null): Order
    {
        return DB::transaction(function () use ($order, $paymentMethod, $cashAmount): Order {
            $order = Order::query()
                ->with('table')
                ->lockForUpdate()
                ->findOrFail($order->id);

            if ($order->payment_status === PaymentStatus::Lunas) {
                throw ValidationException::withMessages([
                    'order' => ['Order sudah lunas dan tidak bisa checkout ulang.'],
                ]);
            }

            $changeAmount = null;
            if ($paymentMethod === 'tunai' && $cashAmount !== null) {
                if ($cashAmount < $order->total_amount) {
                    throw ValidationException::withMessages([
                        'cash_amount' => ['Uang yang dibayarkan kurang dari total tagihan.'],
                    ]);
                }
                $changeAmount = $cashAmount - $order->total_amount;
            }

            $order->update([
                'payment_method' => $paymentMethod,
                'payment_status' => PaymentStatus::Lunas->value,
                'cash_amount' => $cashAmount,
                'change_amount' => $changeAmount,
                'order_status' => 'selesai',
            ]);

            if ($order->table_id) {
                $order->table()->update([
                    'status' => TableStatus::Kosong->value,
                ]);
            }

            return $order->refresh()->load(['table', 'user', 'orderItems.menu.category']);
        });
    }
}
