<?php

namespace Tests\Feature\Payments;

use App\Models\Order;
use App\Models\Profile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'supabase.jwt_secret' => 'test-secret',
            'supabase.jwt_algorithm' => 'HS256',
            'supabase.auth_audience' => 'authenticated',
            'services.stripe.secret' => 'sk_test_fake',
            'services.stripe.success_url' => 'https://nexo.test/checkout/success',
            'services.stripe.cancel_url' => 'https://nexo.test/checkout/cancel',
        ]);
    }

    public function test_buyer_can_start_checkout_for_their_pending_order(): void
    {
        Http::fake([
            'api.stripe.com/*' => Http::response([
                'id' => 'cs_test_123',
                'url' => 'https://checkout.stripe.com/c/pay/cs_test_123',
            ]),
        ]);

        $buyer = $this->profile();
        $order = $this->order($buyer, ['total_cents' => 4500, 'currency' => 'USD']);

        $this->withToken($this->tokenFor($buyer))
            ->postJson("/api/orders/{$order->id}/checkout")
            ->assertOk()
            ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.com/c/pay/cs_test_123');

        $this->assertSame('cs_test_123', $order->refresh()->stripe_session_id);

        // La sesion se crea con el total y la moneda de la orden, y con el id de
        // la orden en metadata para reencontrarla desde el webhook.
        Http::assertSent(function ($request) use ($order) {
            $data = $request->data();

            return $request->url() === 'https://api.stripe.com/v1/checkout/sessions'
                && $data['line_items'][0]['price_data']['unit_amount'] === 4500
                && $data['line_items'][0]['price_data']['currency'] === 'usd'
                && $data['metadata']['order_id'] === $order->id;
        });
    }

    public function test_buyer_cannot_checkout_another_users_order(): void
    {
        Http::fake();

        $buyer = $this->profile();
        $stranger = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000002',
            'email' => 'stranger@example.com',
        ]);
        $order = $this->order($stranger);

        $this->withToken($this->tokenFor($buyer))
            ->postJson("/api/orders/{$order->id}/checkout")
            ->assertNotFound();

        Http::assertNothingSent();
    }

    public function test_cannot_checkout_an_already_paid_order(): void
    {
        Http::fake();

        $buyer = $this->profile();
        $order = $this->order($buyer, ['payment_status' => Order::PAYMENT_PAID]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson("/api/orders/{$order->id}/checkout")
            ->assertStatus(422);

        Http::assertNothingSent();
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function order(Profile $buyer, array $overrides = []): Order
    {
        return Order::query()->create(array_merge([
            'profile_id' => $buyer->id,
            'order_number' => 'NX-'.uniqid(),
            'status' => Order::STATUS_PENDING,
            'payment_status' => Order::PAYMENT_PENDING,
            'currency' => 'USD',
            'subtotal_cents' => 4000,
            'shipping_cents' => 500,
            'total_cents' => 4500,
            'metadata' => [],
        ], $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function profile(array $overrides = []): Profile
    {
        return Profile::query()->create(array_merge([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000001',
            'email' => 'buyer@example.com',
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ], $overrides));
    }

    private function tokenFor(Profile $profile): string
    {
        $header = $this->base64UrlEncode(json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ], JSON_THROW_ON_ERROR));

        $payload = $this->base64UrlEncode(json_encode([
            'sub' => $profile->supabase_user_id,
            'aud' => 'authenticated',
            'email' => $profile->email,
            'exp' => time() + 3600,
        ], JSON_THROW_ON_ERROR));

        $signature = hash_hmac('sha256', $header.'.'.$payload, 'test-secret', true);

        return $header.'.'.$payload.'.'.$this->base64UrlEncode($signature);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
