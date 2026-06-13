<?php

namespace App\Modules\Orders\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'currency' => $this->currency,
            'subtotal_cents' => $this->subtotal_cents,
            'total_cents' => $this->total_cents,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'store_id' => $item->store_id,
                'product_name' => $item->product_name,
                'product_slug' => $item->product_slug,
                'store_name' => $item->store_name,
                'store_slug' => $item->store_slug,
                'unit_price_cents' => $item->unit_price_cents,
                'quantity' => $item->quantity,
                'subtotal_cents' => $item->subtotal_cents,
                'currency' => $item->currency,
            ])->values()),
        ];
    }
}
