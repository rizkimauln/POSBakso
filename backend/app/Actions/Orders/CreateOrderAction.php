<?php

namespace App\Actions\Orders;

use App\Enums\PaymentStatus;
use App\Enums\TableStatus;
use App\Models\Menu;
use App\Models\Order;
use App\Models\Table;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CreateOrderAction
{
    /**
     * @param array<int, array{menu_id:int, quantity:int, notes?:string|null}> $items
     */
    public function execute(?Table $table, string $customerName, array $items, string $orderType = 'dine_in', ?User $user = null, ?string $paymentMethod = null, ?string $paymentProof = null): Order
    {
        return DB::transaction(function () use ($table, $customerName, $items, $orderType, $user, $paymentMethod, $paymentProof): Order {
            $menuIds = collect($items)->pluck('menu_id')->unique()->values();
            $menus = Menu::query()
                ->whereIn('id', $menuIds)
                ->where('is_active', true)
                ->get()
                ->keyBy('id');

            if ($menus->count() !== $menuIds->count()) {
                throw ValidationException::withMessages([
                    'items' => ['Salah satu menu tidak aktif atau tidak ditemukan.'],
                ]);
            }

            $order = Order::query()->create([
                'public_token' => $this->generateUniquePublicToken(),
                'order_type' => $orderType,
                'table_id' => $table?->id,
                'customer_name' => $customerName,
                'user_id' => $user?->id,
                'total_amount' => 0,
                'payment_method' => $paymentMethod,
                'payment_proof' => $paymentProof,
                'payment_status' => PaymentStatus::BelumLunas->value,
                'order_status' => $user ? 'diproses' : 'pending',
            ]);

            $totalAmount = 0;

            foreach ($items as $item) {
                $menu = $menus->get($item['menu_id']);
                $quantity = (int) $item['quantity'];
                $price = (int) $menu->price;
                $totalAmount += $price * $quantity;

                $order->orderItems()->create([
                    'menu_id' => $menu->id,
                    'quantity' => $quantity,
                    'price' => $price,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            $order->update([
                'total_amount' => $totalAmount,
            ]);

            if ($table) {
                $table->update([
                    'status' => TableStatus::Terisi->value,
                ]);
            }

            return $order->refresh()->load(['table', 'user', 'orderItems.menu.category']);
        });
    }

    private function generateUniquePublicToken(): string
    {
        do {
            $token = Str::random(48);
        } while (Order::query()->where('public_token', $token)->exists());

        return $token;
    }
}
