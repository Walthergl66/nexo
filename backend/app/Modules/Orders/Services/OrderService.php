<?php

namespace App\Modules\Orders\Services;

use App\Models\CartItem;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Product;
use App\Models\Profile;
use App\Models\Store;
use App\Modules\Notifications\Services\NotificationService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private readonly ShippingCalculator $shipping,
        private readonly NotificationService $notifications,
    ) {}

    public function createFromCart(Profile $profile): Order
    {
        /** @var array<string, array{seller: Profile, store: string, quantity: int}> $sales */
        $sales = [];

        $order = DB::transaction(function () use ($profile, &$sales): Order {
            $cartItems = CartItem::query()
                ->with(['product.store.profile'])
                ->where('profile_id', $profile->id)
                ->lockForUpdate()
                ->get();

            if ($cartItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => 'Cart is empty.',
                ]);
            }

            // Bloquear las filas de producto para validar y descontar inventario
            // de forma atómica frente a compras concurrentes.
            $products = Product::query()
                ->whereIn('id', $cartItems->pluck('product_id')->all())
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $this->validateCartItems($cartItems, $products);
            $currency = $this->resolveCurrency($cartItems);
            $subtotalCents = $cartItems->sum(
                fn (CartItem $item): int => $item->product->price_cents * $item->quantity,
            );
            $shippingCents = $this->shipping->quote($subtotalCents);

            $order = Order::query()->create([
                'profile_id' => $profile->id,
                'order_number' => $this->orderNumber(),
                'status' => Order::STATUS_PENDING,
                'payment_status' => Order::PAYMENT_PENDING,
                'currency' => $currency,
                'subtotal_cents' => $subtotalCents,
                'shipping_cents' => $shippingCents,
                'total_cents' => $subtotalCents + $shippingCents,
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

                // Descontar el inventario vendido sobre la fila bloqueada.
                $products[$product->id]->decrement('stock', $cartItem->quantity);

                $seller = $store->profile;

                if ($seller instanceof Profile) {
                    $sales[$store->id] ??= ['seller' => $seller, 'store' => $store->name, 'quantity' => 0];
                    $sales[$store->id]['quantity'] += $cartItem->quantity;
                }
            }

            CartItem::query()->where('profile_id', $profile->id)->delete();

            return $order->refresh()->load(['items.product', 'items.store']);
        });

        // Notificar a cada vendedor fuera de la transacción (push best-effort).
        foreach ($sales as $sale) {
            $units = $sale['quantity'];

            $this->notifications->notify(
                $sale['seller'],
                Notification::TYPE_SALE,
                'Nueva venta',
                sprintf('Vendiste %d %s de %s.', $units, $units === 1 ? 'unidad' : 'unidades', $sale['store']),
                ['order_id' => $order->id, 'order_number' => $order->order_number],
            );
        }

        return $order;
    }

    /**
     * Confirm payment for an order, moving it into fulfilment.
     */
    public function markAsPaid(Order $order): Order
    {
        if ($order->payment_status === Order::PAYMENT_PAID) {
            throw ValidationException::withMessages([
                'payment' => 'Order is already paid.',
            ]);
        }

        if ($order->status === Order::STATUS_CANCELLED) {
            throw ValidationException::withMessages([
                'payment' => 'Cancelled orders cannot be paid.',
            ]);
        }

        $order->forceFill([
            'payment_status' => Order::PAYMENT_PAID,
            'status' => Order::STATUS_PROCESSING,
        ])->save();

        $order = $order->refresh()->load(['items', 'profile']);
        $buyer = $order->profile;

        if ($buyer instanceof Profile) {
            $total = $this->formatMoney($order->total_cents, $order->currency);

            $this->notifications->notify(
                $buyer,
                Notification::TYPE_PAYMENT_CONFIRMED,
                'Pago confirmado',
                sprintf('Confirmamos el pago de %s de tu orden %s.', $total, $order->order_number),
                ['order_id' => $order->id, 'order_number' => $order->order_number],
            );

            $this->notifications->notify(
                $buyer,
                Notification::TYPE_ORDER_STATUS,
                'Tu orden esta en preparacion',
                sprintf('La orden %s paso a preparacion.', $order->order_number),
                ['order_id' => $order->id, 'order_number' => $order->order_number, 'status' => $order->status],
            );
        }

        return $order;
    }

    /**
     * @param  iterable<CartItem>  $cartItems
     * @param  Collection<string, Product>  $lockedProducts
     */
    private function validateCartItems(iterable $cartItems, Collection $lockedProducts): void
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

            $availableStock = $lockedProducts[$product->id]->stock ?? 0;

            if ($cartItem->quantity > $availableStock) {
                throw ValidationException::withMessages([
                    'cart' => 'Cart contains products without enough stock.',
                ]);
            }
        }
    }

    private function formatMoney(int $cents, string $currency): string
    {
        return number_format($cents / 100, 2).' '.$currency;
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
