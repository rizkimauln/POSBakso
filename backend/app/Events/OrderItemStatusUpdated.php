<?php

namespace App\Events;

use App\Http\Resources\OrderItemResource;
use App\Http\Resources\OrderResource;
use App\Models\OrderItem;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderItemStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public OrderItem $orderItem)
    {
        $this->orderItem->loadMissing(['menu.category', 'order.table', 'order.user', 'order.orderItems.menu.category']);
    }

    /**
     * @return array<int, Channel|PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('kds.orders'),
            new Channel('orders.'.$this->orderItem->order->public_token),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.item.status.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'order_item' => (new OrderItemResource($this->orderItem))->resolve(),
            'order' => (new OrderResource($this->orderItem->order))->resolve(),
        ];
    }
}
