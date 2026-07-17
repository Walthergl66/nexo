<?php

namespace Tests\Feature\Orders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Profile;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerSalesTest extends TestCase
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

    public function test_seller_can_advance_a_paid_sale_forward(): void
    {
        [$seller, , $item] = $this->paidSale();

        $this->withToken($this->tokenFor($seller))
            ->patchJson('/api/seller/sales/'.$item->id, ['status' => 'packed'])
            ->assertOk()
            ->assertJsonPath('data.fulfillment_status', 'packed')
            ->assertJsonPath('data.next_status', 'shipped');

        $this->assertDatabaseHas('order_items', [
            'id' => $item->id,
            'fulfillment_status' => 'packed',
        ]);
    }

    public function test_delivering_the_only_item_rolls_up_the_order_status(): void
    {
        [$seller, $order, $item] = $this->paidSale();

        foreach (['packed', 'shipped', 'delivered'] as $target) {
            $this->withToken($this->tokenFor($seller))
                ->patchJson('/api/seller/sales/'.$item->id, ['status' => $target])
                ->assertOk();
        }

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => Order::STATUS_DELIVERED,
        ]);
    }

    public function test_seller_cannot_skip_states(): void
    {
        [$seller, , $item] = $this->paidSale();

        $this->withToken($this->tokenFor($seller))
            ->patchJson('/api/seller/sales/'.$item->id, ['status' => 'shipped'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->assertDatabaseHas('order_items', [
            'id' => $item->id,
            'fulfillment_status' => 'processing',
        ]);
    }

    public function test_other_seller_cannot_manage_the_sale(): void
    {
        [, , $item] = $this->paidSale();
        $intruder = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000077',
            'email' => 'intruder@example.com',
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        Store::query()->create([
            'profile_id' => $intruder->id,
            'name' => 'Otra tienda',
            'slug' => 'otra-tienda',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $this->withToken($this->tokenFor($intruder))
            ->patchJson('/api/seller/sales/'.$item->id, ['status' => 'packed'])
            ->assertNotFound();
    }

    public function test_seller_sales_listing_only_returns_paid_items(): void
    {
        [$seller, , $item] = $this->paidSale();

        $this->withToken($this->tokenFor($seller))
            ->getJson('/api/seller/sales')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $item->id)
            ->assertJsonPath('data.0.fulfillment_status', 'processing');
    }

    /**
     * Build a paid, single-item order and return [seller, order, orderItem].
     *
     * @return array{0: Profile, 1: Order, 2: OrderItem}
     */
    private function paidSale(): array
    {
        $seller = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000010',
            'email' => 'seller@example.com',
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        $store = Store::query()->create([
            'profile_id' => $seller->id,
            'name' => 'Nexo Store',
            'slug' => 'nexo-store',
            'status' => Store::STATUS_ACTIVE,
        ]);
        $product = Product::query()->create([
            'store_id' => $store->id,
            'name' => 'Producto activo',
            'slug' => 'producto-activo',
            'price_cents' => 1000,
            'currency' => 'USD',
            'stock' => 10,
            'status' => Product::STATUS_ACTIVE,
        ]);
        $buyer = $this->profile();
        $order = Order::query()->create([
            'profile_id' => $buyer->id,
            'order_number' => 'NX-TEST-SALE1',
            'status' => Order::STATUS_PROCESSING,
            'payment_status' => Order::PAYMENT_PAID,
            'currency' => 'USD',
            'subtotal_cents' => 1000,
            'shipping_cents' => 0,
            'total_cents' => 1000,
        ]);
        $item = $order->items()->create([
            'product_id' => $product->id,
            'store_id' => $store->id,
            'product_name' => $product->name,
            'product_slug' => $product->slug,
            'store_name' => $store->name,
            'store_slug' => $store->slug,
            'unit_price_cents' => 1000,
            'quantity' => 1,
            'fulfillment_status' => OrderItem::FULFILLMENT_PROCESSING,
            'subtotal_cents' => 1000,
            'currency' => 'USD',
        ]);

        return [$seller, $order, $item];
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
