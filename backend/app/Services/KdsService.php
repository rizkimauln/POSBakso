<?php

namespace App\Services;

use App\Enums\OrderItemStatus;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class KdsService
{
    /**
     * @return Collection<int, Order>
     */
    public function activeOrders(): Collection
    {
        return Order::query()
            ->with(['table', 'orderItems.menu.category'])
            ->whereIn('order_status', [
                OrderStatus::Pending->value,
                OrderStatus::Diproses->value,
            ])
            ->oldest()
            ->get();
    }

    public function updateItemStatus(OrderItem $orderItem, string $status): OrderItem
    {
        return DB::transaction(function () use ($orderItem, $status): OrderItem {
            $orderItem = OrderItem::query()
                ->with('order')
                ->lockForUpdate()
                ->findOrFail($orderItem->id);

            $orderItem->update([
                'item_status' => $status,
            ]);

            $order = $orderItem->order()->lockForUpdate()->firstOrFail();

            if ($status === OrderItemStatus::Dimasak->value && $order->order_status === OrderStatus::Pending) {
                $order->update([
                    'order_status' => OrderStatus::Diproses->value,
                ]);
            }

            $hasUnfinishedItems = $order->orderItems()
                ->where('item_status', '!=', OrderItemStatus::Selesai->value)
                ->exists();

            if (! $hasUnfinishedItems) {
                $order->update([
                    'order_status' => OrderStatus::Selesai->value,
                ]);
            }

            return $orderItem->refresh()->load(['menu.category', 'order.table']);
        });
    }
}
