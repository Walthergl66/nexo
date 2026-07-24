<?php

namespace App\Modules\Orders\Services;

use App\Models\CartItem;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
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

    /**
     * Crea un pedido POR TIENDA a partir del carrito: los productos de una misma
     * tienda van en un solo pedido (un solo pago), y los de tiendas distintas en
     * pedidos separados que se pagan por separado. Es lo que le da lógica al
     * carrito en un marketplace: cada vendedor cobra lo suyo.
     *
     * @return Collection<int, Order>
     */
    public function createFromCart(Profile $profile): Collection
    {
        /** @var array<string, array{seller: Profile, store: string, quantity: int, order: Order}> $sales */
        $sales = [];

        $orders = DB::transaction(function () use ($profile, &$sales): Collection {
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

            $this->validateCartItems($cartItems, $products, $profile);

            // Un grupo por tienda -> un pedido por tienda.
            $itemsByStore = $cartItems->groupBy(fn (CartItem $item): string => $item->product->store_id);

            /** @var Collection<int, Order> $orders */
            $orders = new Collection;

            foreach ($itemsByStore as $storeItems) {
                $currency = $this->resolveCurrency($storeItems);
                $subtotalCents = $storeItems->sum(
                    fn (CartItem $item): int => $item->product->price_cents * $item->quantity,
                );
                // El envío se cotiza por tienda: cada pedido lleva el suyo.
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

                foreach ($storeItems as $cartItem) {
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
                        $sales[$store->id] ??= ['seller' => $seller, 'store' => $store->name, 'quantity' => 0, 'order' => $order];
                        $sales[$store->id]['quantity'] += $cartItem->quantity;
                    }
                }

                $orders->push($order->refresh()->load(['items.product', 'items.store']));
            }

            CartItem::query()->where('profile_id', $profile->id)->delete();

            return $orders;
        });

        // Notificar a cada vendedor fuera de la transacción (push best-effort).
        foreach ($sales as $sale) {
            $units = $sale['quantity'];

            $this->notifications->notify(
                $sale['seller'],
                Notification::TYPE_SALE,
                'Nueva venta',
                sprintf('Vendiste %d %s de %s.', $units, $units === 1 ? 'unidad' : 'unidades', $sale['store']),
                ['order_id' => $sale['order']->id, 'order_number' => $sale['order']->order_number],
            );
        }

        return $orders;
    }

    /**
     * Cancela un pedido del comprador que aún no fue pagado y devuelve el stock
     * reservado. Solo aplica a pedidos pendientes de pago: una vez pagado, la
     * cancelación es otra historia (reembolso), fuera de este método.
     */
    public function cancelUnpaidOrder(Order $order): Order
    {
        return DB::transaction(function () use ($order): Order {
            /** @var Order $order */
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);

            if ($order->payment_status === Order::PAYMENT_PAID) {
                throw ValidationException::withMessages([
                    'order' => 'No puedes cancelar un pedido ya pagado.',
                ]);
            }

            if ($order->status === Order::STATUS_CANCELLED) {
                throw ValidationException::withMessages([
                    'order' => 'Este pedido ya estaba cancelado.',
                ]);
            }

            // Devolver a stock lo que este pedido tenía reservado.
            foreach ($order->items()->get() as $item) {
                if ($item->product_id !== null) {
                    Product::query()->whereKey($item->product_id)->increment('stock', $item->quantity);
                }

                $item->forceFill(['fulfillment_status' => OrderItem::FULFILLMENT_CANCELLED])->save();
            }

            $order->forceFill(['status' => Order::STATUS_CANCELLED])->save();

            return $order->refresh()->load('items');
        });
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

        // El pago habilita la gestion del vendedor: cada item entra en preparacion.
        $order->items()->update(['fulfillment_status' => OrderItem::FULFILLMENT_PROCESSING]);

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
     * @param  Profile  $buyer  The profile placing the order (cannot buy its own products).
     */
    private function validateCartItems(iterable $cartItems, Collection $lockedProducts, Profile $buyer): void
    {
        foreach ($cartItems as $cartItem) {
            $product = $cartItem->product;

            if (! $product instanceof Product || ! $product->isActive()) {
                throw ValidationException::withMessages([
                    'cart' => 'Cart contains unavailable products.',
                ]);
            }

            if ($product->store instanceof Store && $product->store->profile_id === $buyer->id) {
                throw ValidationException::withMessages([
                    'cart' => 'No puedes comprar tu propio producto.',
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
