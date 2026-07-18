<?php

namespace App\Modules\Reviews\Services;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Profile;
use App\Models\Review;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReviewService
{
    /**
     * @param array{rating: int, body?: string|null, order_item_id?: string|null} $data
     */
    public function create(Product $product, Profile $profile, array $data): Review
    {
        // Verificar que el comprador haya recibido el producto.
        $orderItemId = $data['order_item_id'] ?? null;

        $hasDelivered = OrderItem::query()
            ->where('product_id', $product->id)
            ->where('fulfillment_status', OrderItem::FULFILLMENT_DELIVERED)
            ->whereHas('order', fn ($q) => $q->where('profile_id', $profile->id))
            ->exists();

        if (! $hasDelivered) {
            throw ValidationException::withMessages([
                'order_item_id' => 'Solo puedes resenar productos que hayas recibido.',
            ]);
        }

        // Validar order_item_id si se provee.
        if ($orderItemId !== null) {
            $validItem = OrderItem::query()
                ->where('id', $orderItemId)
                ->where('product_id', $product->id)
                ->where('fulfillment_status', OrderItem::FULFILLMENT_DELIVERED)
                ->whereHas('order', fn ($q) => $q->where('profile_id', $profile->id))
                ->exists();

            if (! $validItem) {
                $orderItemId = null;
            }
        }

        return DB::transaction(function () use ($product, $profile, $data, $orderItemId): Review {
            $review = Review::query()->create([
                'profile_id'    => $profile->id,
                'product_id'    => $product->id,
                'order_item_id' => $orderItemId,
                'rating'        => $data['rating'],
                'body'          => $data['body'] ?? null,
            ]);

            // Recalcular agregados en el producto.
            $stats = Review::query()
                ->where('product_id', $product->id)
                ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
                ->first();

            $product->forceFill([
                'average_rating' => round((float) ($stats?->avg_rating ?? 0), 2),
                'review_count'   => (int) ($stats?->total ?? 0),
            ])->save();

            return $review->load('profile');
        });
    }
}
