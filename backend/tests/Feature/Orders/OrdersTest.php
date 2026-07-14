<?php

namespace Tests\Feature\Orders;

use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\Profile;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrdersTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'supabase.jwt_secret' => 'test-secret',
            'supabase.jwt_algorithm' => 'HS256',
            'supabase.auth_audience' => 'authenticated',
        ]);
    }

    public function test_buyer_can_create_order_from_cart(): void
    {
        $buyer = $this->profile();
        $product = $this->activeProduct([
            'price_cents' => 1250,
            'stock' => 5,
        ]);
        CartItem::query()->create([
            'profile_id' => $buyer->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/orders/from-cart')
            ->assertCreated()
            ->assertJsonPath('data.status', Order::STATUS_PENDING)
            ->assertJsonPath('data.payment_status', Order::PAYMENT_PENDING)
            ->assertJsonPath('data.currency', 'USD')
            ->assertJsonPath('data.subtotal_cents', 2500)
            ->assertJsonPath('data.shipping_cents', 499)
            ->assertJsonPath('data.total_cents', 2999)
            ->assertJsonPath('data.items.0.product_name', 'Producto activo')
            ->assertJsonPath('data.items.0.unit_price_cents', 1250)
            ->assertJsonPath('data.items.0.quantity', 2);

        $this->assertDatabaseHas('orders', [
            'profile_id' => $buyer->id,
            'status' => Order::STATUS_PENDING,
            'payment_status' => Order::PAYMENT_PENDING,
            'subtotal_cents' => 2500,
            'shipping_cents' => 499,
            'total_cents' => 2999,
        ]);
        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'product_name' => 'Producto activo',
            'unit_price_cents' => 1250,
            'quantity' => 2,
            'subtotal_cents' => 2500,
        ]);
        $this->assertDatabaseCount('cart_items', 0);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 5,
        ]);
    }

    public function test_order_qualifies_for_free_shipping_over_threshold(): void
    {
        $buyer = $this->profile();
        $product = $this->activeProduct([
            'price_cents' => 6000,
            'stock' => 5,
        ]);
        CartItem::query()->create([
            'profile_id' => $buyer->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/orders/from-cart')
            ->assertCreated()
            ->assertJsonPath('data.subtotal_cents', 6000)
            ->assertJsonPath('data.shipping_cents', 0)
            ->assertJsonPath('data.total_cents', 6000);
    }

    public function test_buyer_can_pay_a_pending_order(): void
    {
        $buyer = $this->profile();
        $order = Order::query()->create([
            'profile_id' => $buyer->id,
            'order_number' => 'NX-TEST-PAY1',
            'status' => Order::STATUS_PENDING,
            'payment_status' => Order::PAYMENT_PENDING,
            'currency' => 'USD',
            'subtotal_cents' => 1000,
            'shipping_cents' => 499,
            'total_cents' => 1499,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/orders/'.$order->id.'/pay')
            ->assertOk()
            ->assertJsonPath('data.status', Order::STATUS_PROCESSING)
            ->assertJsonPath('data.payment_status', Order::PAYMENT_PAID);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => Order::STATUS_PROCESSING,
            'payment_status' => Order::PAYMENT_PAID,
        ]);
    }

    public function test_paying_an_already_paid_order_is_rejected(): void
    {
        $buyer = $this->profile();
        $order = Order::query()->create([
            'profile_id' => $buyer->id,
            'order_number' => 'NX-TEST-PAY2',
            'status' => Order::STATUS_PROCESSING,
            'payment_status' => Order::PAYMENT_PAID,
            'currency' => 'USD',
            'subtotal_cents' => 1000,
            'shipping_cents' => 0,
            'total_cents' => 1000,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/orders/'.$order->id.'/pay')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment');
    }

    public function test_buyer_cannot_pay_another_buyers_order(): void
    {
        $buyer = $this->profile();
        $otherBuyer = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000003',
            'email' => 'third@example.com',
        ]);
        $order = Order::query()->create([
            'profile_id' => $otherBuyer->id,
            'order_number' => 'NX-TEST-PAY3',
            'status' => Order::STATUS_PENDING,
            'payment_status' => Order::PAYMENT_PENDING,
            'currency' => 'USD',
            'subtotal_cents' => 1000,
            'shipping_cents' => 0,
            'total_cents' => 1000,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/orders/'.$order->id.'/pay')
            ->assertNotFound();

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => Order::PAYMENT_PENDING,
        ]);
    }

    public function test_order_creation_rejects_empty_cart(): void
    {
        $buyer = $this->profile();

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/orders/from-cart')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cart');
    }

    public function test_order_creation_revalidates_stock(): void
    {
        $buyer = $this->profile();
        $product = $this->activeProduct([
            'stock' => 1,
        ]);
        CartItem::query()->create([
            'profile_id' => $buyer->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/orders/from-cart')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cart');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('cart_items', 1);
    }

    public function test_order_creation_rejects_inactive_store_products(): void
    {
        $buyer = $this->profile();
        $product = $this->activeProduct([], [
            'status' => Store::STATUS_SUSPENDED,
        ]);
        CartItem::query()->create([
            'profile_id' => $buyer->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/orders/from-cart')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cart');
    }

    public function test_buyer_can_list_and_show_own_orders(): void
    {
        $buyer = $this->profile();
        $order = Order::query()->create([
            'profile_id' => $buyer->id,
            'order_number' => 'NX-TEST-0001',
            'status' => Order::STATUS_PENDING,
            'payment_status' => Order::PAYMENT_PENDING,
            'currency' => 'USD',
            'subtotal_cents' => 1000,
            'total_cents' => 1000,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->getJson('/api/orders')
            ->assertOk()
            ->assertJsonPath('data.0.id', $order->id);

        $this->withToken($this->tokenFor($buyer))
            ->getJson('/api/orders/'.$order->id)
            ->assertOk()
            ->assertJsonPath('data.id', $order->id);
    }

    public function test_buyer_cannot_show_another_buyers_order(): void
    {
        $buyer = $this->profile();
        $otherBuyer = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000002',
            'email' => 'other@example.com',
        ]);
        $order = Order::query()->create([
            'profile_id' => $otherBuyer->id,
            'order_number' => 'NX-TEST-0002',
            'status' => Order::STATUS_PENDING,
            'payment_status' => Order::PAYMENT_PENDING,
            'currency' => 'USD',
            'subtotal_cents' => 1000,
            'total_cents' => 1000,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->getJson('/api/orders/'.$order->id)
            ->assertNotFound();
    }

    /**
     * @param  array<string, mixed>  $productOverrides
     * @param  array<string, mixed>  $storeOverrides
     */
    private function activeProduct(array $productOverrides = [], array $storeOverrides = []): Product
    {
        $seller = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000010',
            'email' => 'seller@example.com',
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        $store = Store::query()->create(array_merge([
            'profile_id' => $seller->id,
            'name' => 'Nexo Store',
            'slug' => 'nexo-store',
            'status' => Store::STATUS_ACTIVE,
        ], $storeOverrides));

        return Product::query()->create(array_merge([
            'store_id' => $store->id,
            'name' => 'Producto activo',
            'slug' => 'producto-activo',
            'price_cents' => 1000,
            'currency' => 'USD',
            'stock' => 10,
            'status' => Product::STATUS_ACTIVE,
        ], $productOverrides));
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
        return $this->supabaseToken([
            'sub' => $profile->supabase_user_id,
            'aud' => 'authenticated',
            'email' => $profile->email,
            'exp' => time() + 3600,
        ]);
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    private function supabaseToken(array $claims, string $secret = 'test-secret'): string
    {
        $header = $this->base64UrlEncode(json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ], JSON_THROW_ON_ERROR));

        $payload = $this->base64UrlEncode(json_encode($claims, JSON_THROW_ON_ERROR));
        $signature = hash_hmac('sha256', $header.'.'.$payload, $secret, true);

        return $header.'.'.$payload.'.'.$this->base64UrlEncode($signature);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
