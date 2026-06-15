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
        $paymentMethod = $this->payment_method;
        $paymentStatus = $this->payment_status;

        return [
            'id' => $this->id,
            'public_token' => $this->public_token,
            'table_id' => $this->table_id,
            'table' => new TableResource($this->whenLoaded('table')),
            'user_id' => $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'customer_name' => $this->customer_name,
            'total_amount' => $this->total_amount,
            'cash_amount' => $this->cash_amount,
            'change_amount' => $this->change_amount,
            'payment_method' => $paymentMethod instanceof BackedEnum ? $paymentMethod->value : $paymentMethod,
            'payment_status' => $paymentStatus instanceof BackedEnum ? $paymentStatus->value : $paymentStatus,
            'payment_proof_url' => $this->payment_proof ? asset('storage/' . $this->payment_proof) : null,
            'order_status' => $this->order_status,
            'order_type' => $this->order_type,
            'items' => OrderItemResource::collection($this->whenLoaded('orderItems')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
