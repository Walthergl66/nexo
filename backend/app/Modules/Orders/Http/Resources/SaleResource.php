<?php

namespace App\Modules\Orders\Http\Resources;

use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A single sold item as seen by the seller who owns the product's store.
 *
 * @mixin OrderItem
 */
class SaleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $order = $this->order;
        $buyer = $order?->profile;

        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'order_number' => $order?->order_number,
            'product_name' => $this->product_name,
            'quantity' => $this->quantity,
            'unit_price_cents' => $this->unit_price_cents,
            'subtotal_cents' => $this->subtotal_cents,
            'currency' => $this->currency,
            'fulfillment_status' => $this->fulfillment_status,
            'next_status' => $this->nextFulfillmentStatus(),
            'payment_status' => $order?->payment_status,
            'buyer_name' => $buyer?->display_name ?? trim(($buyer?->first_name ?? '').' '.($buyer?->last_name ?? '')) ?: null,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
