<?php

namespace App\Actions\Orders;

use App\Enums\OrderItemStatus;
use App\Enums\OrderStatus;
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
    public function execute(Table $table, array $items, ?User $user = null): Order
    {
        return DB::transaction(function () use ($table, $items, $user): Order {
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
                'table_id' => $table->id,
                'user_id' => $user?->id,
                'total_amount' => 0,
                'order_status' => OrderStatus::Pending->value,
                'payment_status' => PaymentStatus::BelumLunas->value,
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
                    'item_status' => OrderItemStatus::Pending->value,
                ]);
            }

            $order->update([
                'total_amount' => $totalAmount,
            ]);

            $table->update([
                'status' => TableStatus::Terisi->value,
            ]);

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
