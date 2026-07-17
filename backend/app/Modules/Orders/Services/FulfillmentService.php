<?php

namespace App\Modules\Orders\Services;

use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Profile;
use App\Models\Store;
use App\Modules\Notifications\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FulfillmentService
{
    public function __construct(private readonly NotificationService $notifications) {}

    /**
     * Human labels for buyer-facing notifications, keyed by fulfilment status.
     *
     * @var array<string, string>
     */
    private const STATUS_LABELS = [
        OrderItem::FULFILLMENT_PROCESSING => 'en preparacion',
        OrderItem::FULFILLMENT_PACKED => 'empacado',
        OrderItem::FULFILLMENT_SHIPPED => 'enviado',
        OrderItem::FULFILLMENT_DELIVERED => 'entregado',
    ];

    /**
     * Advance a sold item to the next fulfilment stage on behalf of its seller.
     * Only the store owner can move it, only forward, and only once paid.
     */
    public function advance(OrderItem $item, Profile $seller, string $target): OrderItem
    {
        return DB::transaction(function () use ($item, $seller, $target): OrderItem {
            /** @var OrderItem $item */
            $item = OrderItem::query()
                ->with(['store', 'order'])
                ->lockForUpdate()
                ->findOrFail($item->id);

            $store = $item->store;

            if (! $store instanceof Store || $store->profile_id !== $seller->id) {
                abort(404);
            }

            $order = $item->order;

            if (! $order instanceof Order || $order->payment_status !== Order::PAYMENT_PAID) {
                throw ValidationException::withMessages([
                    'status' => 'Solo puedes gestionar ventas ya pagadas.',
                ]);
            }

            if ($item->nextFulfillmentStatus() !== $target) {
                throw ValidationException::withMessages([
                    'status' => 'Transicion de estado invalida.',
                ]);
            }

            $item->forceFill(['fulfillment_status' => $target])->save();

            $this->recomputeOrderStatus($order);
            $this->notifyBuyer($order, $item, $target);

            return $item->refresh()->load(['store', 'order']);
        });
    }

    /**
     * Roll the parent order's status up from its items so the buyer summary
     * stays coherent while individual products move independently.
     */
    private function recomputeOrderStatus(Order $order): void
    {
        $statuses = $order->items()->pluck('fulfillment_status');

        if ($statuses->isEmpty()) {
            return;
        }

        $active = $statuses->reject(fn (string $status): bool => $status === OrderItem::FULFILLMENT_CANCELLED);

        if ($active->isEmpty()) {
            $order->forceFill(['status' => Order::STATUS_CANCELLED])->save();

            return;
        }

        $rolled = match (true) {
            $active->every(fn (string $status): bool => $status === OrderItem::FULFILLMENT_DELIVERED) => Order::STATUS_DELIVERED,
            $active->contains(OrderItem::FULFILLMENT_SHIPPED) => Order::STATUS_SHIPPED,
            default => Order::STATUS_PROCESSING,
        };

        if ($order->status !== $rolled) {
            $order->forceFill(['status' => $rolled])->save();
        }
    }

    private function notifyBuyer(Order $order, OrderItem $item, string $target): void
    {
        $buyer = $order->profile;

        if (! $buyer instanceof Profile) {
            return;
        }

        $label = self::STATUS_LABELS[$target] ?? $target;

        $this->notifications->notify(
            $buyer,
            Notification::TYPE_ORDER_STATUS,
            'Actualizacion de tu pedido',
            sprintf('%s ahora esta %s.', $item->product_name, $label),
            [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'order_item_id' => $item->id,
                'fulfillment_status' => $target,
            ],
        );
    }
}
