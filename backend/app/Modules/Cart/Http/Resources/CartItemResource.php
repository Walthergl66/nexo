<?php

namespace App\Modules\Cart\Http\Resources;

use App\Modules\Products\Http\Resources\ProductResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $unitPriceCents = $this->product?->price_cents ?? 0;

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'quantity' => $this->quantity,
            'unit_price_cents' => $unitPriceCents,
            'subtotal_cents' => $unitPriceCents * $this->quantity,
            'currency' => $this->product?->currency,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'product' => $this->whenLoaded('product', fn () => new ProductResource($this->product)),
        ];
    }
}
