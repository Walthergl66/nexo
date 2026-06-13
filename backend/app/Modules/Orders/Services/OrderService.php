<?php

namespace App\Modules\Orders\Services;

use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\Profile;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function createFromCart(Profile $profile): Order
    {
        return DB::transaction(function () use ($profile): Order {
            $cartItems = CartItem::query()
                ->with(['product.store'])
                ->where('profile_id', $profile->id)
                ->lockForUpdate()
                ->get();

            if ($cartItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => 'Cart is empty.',
                ]);
            }

            $this->validateCartItems($cartItems);
            $currency = $this->resolveCurrency($cartItems);
            $totalCents = $cartItems->sum(
                fn (CartItem $item): int => $item->product->price_cents * $item->quantity,
            );

            $order = Order::query()->create([
                'profile_id' => $profile->id,
                'order_number' => $this->orderNumber(),
                'status' => Order::STATUS_PENDING,
                'payment_status' => Order::PAYMENT_PENDING,
                'currency' => $currency,
                'subtotal_cents' => $totalCents,
                'total_cents' => $totalCents,
                'metadata' => [],
            ]);

            foreach ($cartItems as $cartItem) {
                $product = $cartItem->product;
                $store = $product->store;

                $order->items()->create([
                    'product_id' => $product->id,
                    'store_id' => $store->id,
                    'product_name' => $product->name,
                    'product_slug' => $product->slug,
                    'store_name' => $store->name,
                    'store_slug' => $store->slug,
                    'unit_price_cents' => $product->price_cents,
                    'quantity' => $cartItem->quantity,
                    'subtotal_cents' => $product->price_cents * $cartItem->quantity,
                    'currency' => $product->currency,
                    'metadata' => [],
                ]);
            }

            CartItem::query()->where('profile_id', $profile->id)->delete();

            return $order->refresh()->load(['items.product', 'items.store']);
        });
    }

    /**
     * @param  iterable<CartItem>  $cartItems
     */
    private function validateCartItems(iterable $cartItems): void
    {
        foreach ($cartItems as $cartItem) {
            $product = $cartItem->product;

            if (! $product instanceof Product || ! $product->isActive()) {
                throw ValidationException::withMessages([
                    'cart' => 'Cart contains unavailable products.',
                ]);
            }

            if (! $product->store instanceof Store || ! $product->store->isActive()) {
                throw ValidationException::withMessages([
                    'cart' => 'Cart contains products from inactive stores.',
                ]);
            }

            if ($cartItem->quantity > $product->stock) {
                throw ValidationException::withMessages([
                    'cart' => 'Cart contains products without enough stock.',
                ]);
            }
        }
    }

    /**
     * @param  iterable<CartItem>  $cartItems
     */
    private function resolveCurrency(iterable $cartItems): string
    {
        $currency = null;

        foreach ($cartItems as $cartItem) {
            $itemCurrency = $cartItem->product->currency;

            if ($currency === null) {
                $currency = $itemCurrency;

                continue;
            }

            if ($currency !== $itemCurrency) {
                throw ValidationException::withMessages([
                    'cart' => 'Cart contains multiple currencies.',
                ]);
            }
        }

        return $currency ?? 'USD';
    }

    private function orderNumber(): string
    {
        do {
            $orderNumber = 'NX-'.now()->format('Ymd').'-'.Str::upper(Str::random(8));
        } while (Order::query()->where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }
}
