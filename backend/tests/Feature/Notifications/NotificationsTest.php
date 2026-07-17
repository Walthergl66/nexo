<?php

namespace Tests\Feature\Notifications;

use App\Models\CartItem;
use App\Models\Notification;
use App\Models\Product;
use App\Models\Profile;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NotificationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake();

        config([
            'supabase.jwt_secret' => 'test-secret',
            'supabase.jwt_algorithm' => 'HS256',
            'supabase.auth_audience' => 'authenticated',
        ]);
    }

    public function test_purchase_notifies_seller_and_payment_notifies_buyer(): void
    {
        $buyer = $this->buyer();
        [$product, $seller] = $this->sellerProduct(['price_cents' => 1000, 'stock' => 5]);
        CartItem::query()->create([
            'profile_id' => $buyer->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $created = $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/orders/from-cart')
            ->assertCreated()
            ->json('data.id');

        $this->assertDatabaseHas('notifications', [
            'profile_id' => $seller->id,
            'type' => Notification::TYPE_SALE,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/orders/'.$created.'/pay')
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'profile_id' => $buyer->id,
            'type' => Notification::TYPE_PAYMENT_CONFIRMED,
        ]);
        $this->assertDatabaseHas('notifications', [
            'profile_id' => $buyer->id,
            'type' => Notification::TYPE_ORDER_STATUS,
        ]);
    }

    public function test_listing_cart_clamps_quantity_and_notifies_when_stock_dropped(): void
    {
        $buyer = $this->buyer();
        [$product] = $this->sellerProduct(['stock' => 3]);
        CartItem::query()->create([
            'profile_id' => $buyer->id,
            'product_id' => $product->id,
            'quantity' => 3,
        ]);

        // El stock baja (p. ej. otra compra) por debajo de lo reservado en el carrito.
        $product->forceFill(['stock' => 1])->save();

        $this->withToken($this->tokenFor($buyer))
            ->getJson('/api/cart')
            ->assertOk()
            ->assertJsonPath('data.0.quantity', 1)
            ->assertJsonPath('meta.item_count', 1);

        $this->assertDatabaseHas('notifications', [
            'profile_id' => $buyer->id,
            'type' => Notification::TYPE_CART_STOCK,
        ]);
    }

    public function test_listing_cart_removes_out_of_stock_item_and_notifies(): void
    {
        $buyer = $this->buyer();
        [$product] = $this->sellerProduct(['stock' => 2]);
        CartItem::query()->create([
            'profile_id' => $buyer->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $product->forceFill(['stock' => 0])->save();

        $this->withToken($this->tokenFor($buyer))
            ->getJson('/api/cart')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->assertDatabaseCount('cart_items', 0);
        $this->assertDatabaseHas('notifications', [
            'profile_id' => $buyer->id,
            'type' => Notification::TYPE_CART_STOCK,
        ]);
    }

    public function test_buyer_can_list_and_mark_notifications_read(): void
    {
        $buyer = $this->buyer();
        $notification = $buyer->notifications()->create([
            'type' => Notification::TYPE_SALE,
            'title' => 'Hola',
            'body' => 'Cuerpo',
            'data' => [],
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('data.0.id', $notification->id)
            ->assertJsonPath('unread_count', 1);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/notifications/'.$notification->id.'/read')
            ->assertOk();

        $this->assertNotNull($notification->refresh()->read_at);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 0);
    }

    public function test_buyer_cannot_read_another_profiles_notification(): void
    {
        $buyer = $this->buyer();
        $other = $this->buyer([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-0000000000aa',
            'email' => 'other-notif@example.com',
        ]);
        $notification = $other->notifications()->create([
            'type' => Notification::TYPE_SALE,
            'title' => 'Ajena',
            'body' => 'Cuerpo',
            'data' => [],
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/notifications/'.$notification->id.'/read')
            ->assertNotFound();
    }

    public function test_buyer_can_register_push_token(): void
    {
        $buyer = $this->buyer();

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/me/push-token', ['push_token' => 'ExponentPushToken[abc123]'])
            ->assertOk()
            ->assertJsonPath('data.registered', true);

        $this->assertDatabaseHas('profiles', [
            'id' => $buyer->id,
            'push_token' => 'ExponentPushToken[abc123]',
        ]);
    }

    /**
     * @param  array<string, mixed>  $productOverrides
     * @return array{0: Product, 1: Profile}
     */
    private function sellerProduct(array $productOverrides = []): array
    {
        $seller = $this->buyer([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000010',
            'email' => 'seller-notif@example.com',
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        $store = Store::query()->create([
            'profile_id' => $seller->id,
            'name' => 'Nexo Store',
            'slug' => 'nexo-store',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $product = Product::query()->create(array_merge([
            'store_id' => $store->id,
            'name' => 'Producto activo',
            'slug' => 'producto-activo',
            'price_cents' => 1000,
            'currency' => 'USD',
            'stock' => 10,
            'status' => Product::STATUS_ACTIVE,
        ], $productOverrides));

        return [$product, $seller];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function buyer(array $overrides = []): Profile
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
