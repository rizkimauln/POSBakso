<?php

namespace App\Http\Resources;

use BackedEnum;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $orderStatus = $this->order_status;
        $paymentMethod = $this->payment_method;
        $paymentStatus = $this->payment_status;

        return [
            'id' => $this->id,
            'public_token' => $this->public_token,
            'table_id' => $this->table_id,
            'table' => new TableResource($this->whenLoaded('table')),
            'user_id' => $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'total_amount' => $this->total_amount,
            'order_status' => $orderStatus instanceof BackedEnum ? $orderStatus->value : $orderStatus,
            'payment_method' => $paymentMethod instanceof BackedEnum ? $paymentMethod->value : $paymentMethod,
            'payment_status' => $paymentStatus instanceof BackedEnum ? $paymentStatus->value : $paymentStatus,
            'items' => OrderItemResource::collection($this->whenLoaded('orderItems')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
