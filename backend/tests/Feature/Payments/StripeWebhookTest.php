<?php

namespace Tests\Feature\Payments;

use App\Models\Notification;
use App\Models\Order;
use App\Models\Profile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class StripeWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const WEBHOOK_SECRET = 'whsec_test_secret';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.stripe.webhook_secret' => self::WEBHOOK_SECRET,
            'services.stripe.signature_tolerance' => 300,
        ]);
    }

    public function test_valid_checkout_completed_marks_the_order_paid(): void
    {
        $buyer = $this->buyer();
        $order = $this->pendingOrder($buyer);

        $this->postSignedWebhook($this->checkoutCompletedPayload($order->id, 'pi_test_1'))
            ->assertOk()
            ->assertJsonPath('received', true);

        $order->refresh();

        $this->assertSame(Order::PAYMENT_PAID, $order->payment_status);
        $this->assertSame(Order::STATUS_PROCESSING, $order->status);
        $this->assertSame('pi_test_1', $order->stripe_payment_intent_id);
    }

    public function test_a_tampered_signature_is_rejected_and_nothing_changes(): void
    {
        $buyer = $this->buyer();
        $order = $this->pendingOrder($buyer);

        $payload = $this->checkoutCompletedPayload($order->id, 'pi_test_1');

        $this->call(
            'POST',
            '/api/webhooks/stripe',
            [],
            [],
            [],
            [
                'HTTP_STRIPE_SIGNATURE' => 't='.time().',v1=deadbeef',
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
            ],
            $payload,
        )->assertStatus(400);

        $this->assertSame(Order::PAYMENT_PENDING, $order->refresh()->payment_status);
    }

    public function test_a_signature_outside_the_tolerance_is_rejected(): void
    {
        $buyer = $this->buyer();
        $order = $this->pendingOrder($buyer);

        $payload = $this->checkoutCompletedPayload($order->id, 'pi_test_1');
        // Firma valida pero con un timestamp de hace una hora: replay viejo.
        $staleTimestamp = time() - 3600;
        $signature = 't='.$staleTimestamp.',v1='.hash_hmac('sha256', $staleTimestamp.'.'.$payload, self::WEBHOOK_SECRET);

        $this->postRawWebhook($payload, $signature)->assertStatus(400);

        $this->assertSame(Order::PAYMENT_PENDING, $order->refresh()->payment_status);
    }

    public function test_the_webhook_is_idempotent(): void
    {
        $buyer = $this->buyer();
        $order = $this->pendingOrder($buyer);
        $payload = $this->checkoutCompletedPayload($order->id, 'pi_test_1');

        $this->postSignedWebhook($payload)->assertOk();
        $this->postSignedWebhook($payload)->assertOk();

        // markAsPaid notifica al comprador (pago confirmado + orden en
        // preparacion). Si el segundo evento se reprocesara, se duplicarian.
        $this->assertSame(
            2,
            Notification::query()->where('profile_id', $buyer->id)->count(),
        );
    }

    public function test_an_unknown_order_is_acknowledged_without_error(): void
    {
        $this->postSignedWebhook($this->checkoutCompletedPayload('01ky000000000000000000zzzz', 'pi_x'))
            ->assertOk()
            ->assertJsonPath('received', true);
    }

    private function checkoutCompletedPayload(string $orderId, string $paymentIntent): string
    {
        return json_encode([
            'id' => 'evt_test_'.uniqid(),
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test_123',
                    'payment_intent' => $paymentIntent,
                    'client_reference_id' => $orderId,
                    'metadata' => ['order_id' => $orderId],
                ],
            ],
        ], JSON_THROW_ON_ERROR);
    }

    private function postSignedWebhook(string $payload): TestResponse
    {
        $timestamp = time();
        $signature = 't='.$timestamp.',v1='.hash_hmac('sha256', $timestamp.'.'.$payload, self::WEBHOOK_SECRET);

        return $this->postRawWebhook($payload, $signature);
    }

    private function postRawWebhook(string $payload, string $signature): TestResponse
    {
        return $this->call(
            'POST',
            '/api/webhooks/stripe',
            [],
            [],
            [],
            [
                'HTTP_STRIPE_SIGNATURE' => $signature,
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
            ],
            $payload,
        );
    }

    private function pendingOrder(Profile $buyer): Order
    {
        return Order::query()->create([
            'profile_id' => $buyer->id,
            'order_number' => 'NX-'.uniqid(),
            'status' => Order::STATUS_PENDING,
            'payment_status' => Order::PAYMENT_PENDING,
            'currency' => 'USD',
            'subtotal_cents' => 4000,
            'shipping_cents' => 500,
            'total_cents' => 4500,
            'metadata' => [],
        ]);
    }

    private function buyer(): Profile
    {
        return Profile::query()->create([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000001',
            'email' => 'buyer@example.com',
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ]);
    }
}
