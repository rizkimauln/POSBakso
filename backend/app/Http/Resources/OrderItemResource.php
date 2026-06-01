<?php

namespace App\Http\Resources;

use BackedEnum;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {


        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'menu_id' => $this->menu_id,
            'menu' => new MenuResource($this->whenLoaded('menu')),
            'quantity' => $this->quantity,
            'price' => $this->price,
            'subtotal' => $this->price * $this->quantity,
            'notes' => $this->notes,

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
