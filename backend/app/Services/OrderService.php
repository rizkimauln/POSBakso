<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Pagination\LengthAwarePaginator;

class OrderService
{
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return Order::query()
            ->with(['table', 'user'])
            ->when($filters['order_status'] ?? null, function ($query, string $status): void {
                $query->where('order_status', $status);
            })
            ->when($filters['payment_status'] ?? null, function ($query, string $status): void {
                $query->where('payment_status', $status);
            })
            ->when($filters['table_id'] ?? null, function ($query, int|string $tableId): void {
                $query->where('table_id', $tableId);
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findDetailed(Order $order): Order
    {
        return $order->load(['table', 'user', 'orderItems.menu.category']);
    }

    public function updateStatus(Order $order, string $status): Order
    {
        $order->update([
            'order_status' => $status,
        ]);

        return $this->findDetailed($order->refresh());
    }
}
