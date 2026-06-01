<?php

namespace App\Actions\Orders;

use App\Models\Menu;
use App\Models\Order;
use App\Models\Table;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateOrderAction
{
    /**
     * @param array<int, array{menu_id:int, quantity:int, notes?:string|null}> $items
     */
    public function execute(Order $order, Table $table, string $customerName, array $items): Order
    {
        return DB::transaction(function () use ($order, $table, $customerName, $items): Order {
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

            // Hapus item pesanan yang lama
            $order->orderItems()->delete();

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

            // Update order
            $order->update([
                'table_id' => $table->id,
                'customer_name' => $customerName,
                'total_amount' => $totalAmount,
            ]);

            return $order->refresh()->load(['table', 'user', 'orderItems.menu.category']);
        });
    }
}
