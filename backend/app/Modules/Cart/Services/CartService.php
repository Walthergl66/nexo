<?php

namespace App\Modules\Cart\Services;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\Profile;
use App\Models\Store;
use App\Modules\Orders\Services\ShippingCalculator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function __construct(private readonly ShippingCalculator $shipping) {}

    /**
     * @return Collection<int, CartItem>
     */
    public function items(Profile $profile): Collection
    {
        return $profile->cartItems()
            ->with(['product.store', 'product.category', 'product.images'])
            ->latest()
            ->get();
    }

    /**
     * Totals for the given cart items, including the shipping quote.
     *
     * @param  Collection<int, CartItem>  $items
     * @return array<string, int|string>
     */
    public function summarize(Collection $items): array
    {
        $subtotal = $items->sum(
            fn (CartItem $item): int => ($item->product?->price_cents ?? 0) * $item->quantity,
        );
        $shipping = $this->shipping->quote($subtotal);

        return [
            'subtotal_cents' => $subtotal,
            'shipping_cents' => $shipping,
            'total_cents' => $subtotal + $shipping,
            'currency' => $items->first()?->product?->currency ?? 'USD',
            'item_count' => (int) $items->sum('quantity'),
        ];
    }

    public function add(Profile $profile, Product $product, int $quantity): CartItem
    {
        return DB::transaction(function () use ($profile, $product, $quantity): CartItem {
            $product = Product::query()
                ->with('store')
                ->lockForUpdate()
                ->findOrFail($product->id);

            $this->ensureProductCanBePurchased($product, $quantity);

            /** @var CartItem|null $cartItem */
            $cartItem = CartItem::query()
                ->where('profile_id', $profile->id)
                ->where('product_id', $product->id)
                ->lockForUpdate()
                ->first();

            $newQuantity = ($cartItem?->quantity ?? 0) + $quantity;
            $this->ensureQuantityIsAvailable($product, $newQuantity);

            if ($cartItem === null) {
                $cartItem = CartItem::query()->create([
                    'profile_id' => $profile->id,
                    'product_id' => $product->id,
                    'quantity' => $newQuantity,
                ]);
            } else {
                $cartItem->forceFill(['quantity' => $newQuantity])->save();
            }

            return $cartItem->refresh()->load(['product.store', 'product.category', 'product.images']);
        });
    }

    public function update(Profile $profile, CartItem $cartItem, int $quantity): CartItem
    {
        if ($cartItem->profile_id !== $profile->id) {
            abort(404);
        }

        return DB::transaction(function () use ($cartItem, $quantity): CartItem {
            $cartItem = CartItem::query()
                ->with('product.store')
                ->lockForUpdate()
                ->findOrFail($cartItem->id);

            $this->ensureProductCanBePurchased($cartItem->product, $quantity);

            $cartItem->forceFill(['quantity' => $quantity])->save();

            return $cartItem->refresh()->load(['product.store', 'product.category', 'product.images']);
        });
    }

    public function remove(Profile $profile, CartItem $cartItem): void
    {
        if ($cartItem->profile_id !== $profile->id) {
            abort(404);
        }

        $cartItem->delete();
    }

    public function clear(Profile $profile): void
    {
        $profile->cartItems()->delete();
    }

    private function ensureProductCanBePurchased(Product $product, int $quantity): void
    {
        if (! $product->isActive()) {
            throw ValidationException::withMessages([
                'product_id' => 'Only active products can be added to cart.',
            ]);
        }

        if (! $product->store instanceof Store || ! $product->store->isActive()) {
            throw ValidationException::withMessages([
                'product_id' => 'Products from inactive stores cannot be added to cart.',
            ]);
        }

        $this->ensureQuantityIsAvailable($product, $quantity);
    }

    private function ensureQuantityIsAvailable(Product $product, int $quantity): void
    {
        if ($quantity > $product->stock) {
            throw ValidationException::withMessages([
                'quantity' => 'Requested quantity exceeds available stock.',
            ]);
        }
    }
}
