<?php

namespace App\Modules\Payments\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Profile;
use App\Modules\Payments\Services\StripeGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CreateCheckoutSessionController extends Controller
{
    public function __construct(private readonly StripeGateway $stripe) {}

    public function __invoke(Request $request, Order $order): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        // 404 (no 403) si no es su orden: no confirmamos que exista para otro.
        abort_unless($order->profile_id === $profile->id, 404);

        if ($order->payment_status === Order::PAYMENT_PAID) {
            throw ValidationException::withMessages([
                'payment' => 'Esta orden ya esta pagada.',
            ]);
        }

        if ($order->status === Order::STATUS_CANCELLED) {
            throw ValidationException::withMessages([
                'payment' => 'Esta orden fue cancelada.',
            ]);
        }

        $session = $this->stripe->createCheckoutSession($order);

        // Se guarda el id de sesion para conciliar; el pago se confirma cuando
        // llegue el webhook, no aqui.
        $order->forceFill(['stripe_session_id' => $session['id']])->save();

        return response()->json([
            'data' => [
                'checkout_url' => $session['url'],
            ],
        ]);
    }
}
