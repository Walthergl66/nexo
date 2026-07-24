<?php

namespace App\Modules\Payments\Services;

use App\Models\Order;
use App\Modules\Payments\Exceptions\WebhookSignatureException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Envoltura minima sobre la API REST de Stripe.
 *
 * Se usa el cliente HTTP de Laravel en vez del SDK oficial a proposito: encaja
 * con el resto del proyecto (SupabaseAuthService verifica firmas HMAC a mano,
 * IdentityLookupService y ExpoPushSender pegan con el facade Http y se prueban
 * con Http::fake) y evita sumar una dependencia para el demo. En produccion el
 * SDK oficial sigue siendo lo recomendado.
 */
class StripeGateway
{
    private const CHECKOUT_SESSIONS_URL = 'https://api.stripe.com/v1/checkout/sessions';

    /**
     * Crea una Checkout Session para cobrar el total de la orden y devuelve su
     * id y la URL a la que hay que mandar al comprador.
     *
     * @return array{id: string, url: string}
     */
    public function createCheckoutSession(Order $order): array
    {
        $secret = (string) config('services.stripe.secret');

        if ($secret === '') {
            throw ValidationException::withMessages([
                'payment' => 'El cobro no esta configurado.',
            ]);
        }

        $response = Http::asForm()
            ->withToken($secret)
            ->post(self::CHECKOUT_SESSIONS_URL, [
                'mode' => 'payment',
                'success_url' => (string) config('services.stripe.success_url'),
                'cancel_url' => (string) config('services.stripe.cancel_url'),
                // Dos vias para reencontrar la orden desde el webhook.
                'client_reference_id' => $order->id,
                'metadata' => ['order_id' => $order->id],
                'line_items' => [
                    [
                        'quantity' => 1,
                        'price_data' => [
                            'currency' => strtolower($order->currency),
                            'unit_amount' => $order->total_cents,
                            'product_data' => [
                                'name' => 'Orden '.$order->order_number,
                            ],
                        ],
                    ],
                ],
            ]);

        if (! $response->successful()) {
            // El motivo real de Stripe (clave invalida, success_url no absoluta,
            // etc.) solo queda en el log; al usuario se le da un mensaje neutro.
            Log::warning('Stripe checkout session failed', [
                'order_id' => $order->id,
                'status' => $response->status(),
                'stripe_error' => $response->json('error.message') ?? $response->body(),
            ]);

            throw ValidationException::withMessages([
                'payment' => 'No se pudo iniciar el pago. Intenta de nuevo.',
            ]);
        }

        $id = $response->json('id');
        $url = $response->json('url');

        if (! is_string($id) || ! is_string($url) || $id === '' || $url === '') {
            throw ValidationException::withMessages([
                'payment' => 'Stripe no devolvio una sesion de pago valida.',
            ]);
        }

        return ['id' => $id, 'url' => $url];
    }

    /**
     * Verifica la firma de un webhook y devuelve el evento decodificado.
     *
     * El esquema es el mismo HMAC-SHA256 que documenta Stripe: se firma
     * "<timestamp>.<cuerpo>" con el webhook secret. Se compara con hash_equals
     * (tiempo constante) y se rechaza si el timestamp cae fuera de la tolerancia,
     * para que una firma vieja capturada no se pueda reproducir.
     *
     * @return array<string, mixed>
     */
    public function verifyAndParseEvent(string $payload, ?string $signatureHeader): array
    {
        $secret = (string) config('services.stripe.webhook_secret');

        if ($secret === '') {
            throw new WebhookSignatureException('Stripe webhook secret is not configured.');
        }

        if ($signatureHeader === null || $signatureHeader === '') {
            throw new WebhookSignatureException('Missing Stripe signature header.');
        }

        $parsed = $this->parseSignatureHeader($signatureHeader);
        $timestamp = $parsed['timestamp'];
        $signatures = $parsed['signatures'];

        if ($timestamp === null || $signatures === []) {
            throw new WebhookSignatureException('Malformed Stripe signature header.');
        }

        $tolerance = max(0, (int) config('services.stripe.signature_tolerance', 300));

        if ($tolerance > 0 && abs(time() - $timestamp) > $tolerance) {
            throw new WebhookSignatureException('Stripe signature timestamp is outside the tolerance.');
        }

        $expected = hash_hmac('sha256', $timestamp.'.'.$payload, $secret);

        $matches = false;

        foreach ($signatures as $signature) {
            if (hash_equals($expected, $signature)) {
                $matches = true;

                break;
            }
        }

        if (! $matches) {
            throw new WebhookSignatureException('Stripe signature does not match.');
        }

        $event = json_decode($payload, true);

        if (! is_array($event)) {
            throw new WebhookSignatureException('Stripe event payload is not valid JSON.');
        }

        return $event;
    }

    /**
     * Parte el header "t=123,v1=abc,v1=def" en su timestamp y sus firmas v1.
     *
     * @return array{timestamp: ?int, signatures: list<string>}
     */
    private function parseSignatureHeader(string $header): array
    {
        $timestamp = null;
        $signatures = [];

        foreach (explode(',', $header) as $part) {
            [$key, $value] = array_pad(explode('=', trim($part), 2), 2, null);

            if ($key === 't' && is_numeric($value)) {
                $timestamp = (int) $value;
            } elseif ($key === 'v1' && is_string($value) && $value !== '') {
                $signatures[] = $value;
            }
        }

        return ['timestamp' => $timestamp, 'signatures' => $signatures];
    }
}
