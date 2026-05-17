<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Events\OrderCompleted;
use App\Events\OrderItemStatusUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Kds\UpdateOrderItemStatusRequest;
use App\Http\Resources\OrderItemResource;
use App\Http\Resources\OrderResource;
use App\Models\OrderItem;
use App\Services\KdsService;
use App\Support\ApiResponse;

class KdsController extends Controller
{
    public function __construct(private readonly KdsService $kdsService)
    {
    }

    public function orders()
    {
        return ApiResponse::success(
            'Antrean dapur berhasil diambil',
            OrderResource::collection($this->kdsService->activeOrders())
        );
    }

    public function updateItemStatus(UpdateOrderItemStatusRequest $request, OrderItem $orderItem)
    {
        $orderItem = $this->kdsService->updateItemStatus(
            $orderItem,
            $request->validated('item_status')
        );

        event(new OrderItemStatusUpdated($orderItem));

        if ($orderItem->order->order_status === OrderStatus::Selesai) {
            event(new OrderCompleted($orderItem->order));
        }

        return ApiResponse::success(
            'Status item berhasil diperbarui',
            new OrderItemResource($orderItem)
        );
    }
}
