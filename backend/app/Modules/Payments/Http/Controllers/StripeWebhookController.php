<?php

namespace App\Modules\Payments\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Modules\Orders\Services\OrderService;
use App\Modules\Payments\Exceptions\WebhookSignatureException;
use App\Modules\Payments\Services\StripeGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

/**
 * Recibe los eventos de Stripe. Es la unica via que da una orden por pagada:
 * el cobro solo se cree cuando Stripe lo confirma con una firma valida, nunca
 * porque el cliente lo diga.
 */
class StripeWebhookController extends Controller
{
    public function __construct(
        private readonly StripeGateway $stripe,
        private readonly OrderService $orders,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        try {
            $event = $this->stripe->verifyAndParseEvent(
                $request->getContent(),
                $request->header('Stripe-Signature'),
            );
        } catch (WebhookSignatureException) {
            return response()->json(['message' => 'Invalid signature.'], Response::HTTP_BAD_REQUEST);
        }

        if (($event['type'] ?? null) === 'checkout.session.completed') {
            $this->handleCheckoutCompleted(Arr::get($event, 'data.object', []));
        }

        // 200 a cualquier otro evento: confirmamos recepcion para que Stripe no
        // reintente eventos que no nos interesan.
        return response()->json(['received' => true]);
    }

    /**
     * @param  array<string, mixed>  $session
     */
    private function handleCheckoutCompleted(array $session): void
    {
        $orderId = Arr::get($session, 'metadata.order_id')
            ?? Arr::get($session, 'client_reference_id');

        if (! is_string($orderId) || $orderId === '') {
            return;
        }

        /** @var Order|null $order */
        $order = Order::query()->find($orderId);

        if ($order === null) {
            return;
        }

        // Idempotencia: Stripe puede reenviar el mismo evento. Si ya esta pagada
        // o cancelada, no se vuelve a procesar ni se re-notifica.
        if ($order->payment_status === Order::PAYMENT_PAID || $order->status === Order::STATUS_CANCELLED) {
            return;
        }

        $paymentIntent = Arr::get($session, 'payment_intent');

        if (is_string($paymentIntent) && $paymentIntent !== '') {
            $order->forceFill(['stripe_payment_intent_id' => $paymentIntent])->save();
        }

        $this->orders->markAsPaid($order);
    }
}
