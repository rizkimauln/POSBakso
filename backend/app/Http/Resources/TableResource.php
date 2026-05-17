<?php

namespace App\Http\Resources;

use BackedEnum;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TableResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = $this->status;

        return [
            'id' => $this->id,
            'table_number' => $this->table_number,
            'qr_token' => $this->when(! $request->routeIs('public.*'), $this->qr_token),
            'status' => $status instanceof BackedEnum ? $status->value : $status,
            'orders_count' => $this->whenCounted('orders'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
