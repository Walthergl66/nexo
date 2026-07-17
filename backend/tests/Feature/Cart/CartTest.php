<?php

namespace Tests\Feature\Cart;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\Profile;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
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

    public function test_buyer_can_add_active_product_to_cart(): void
    {
        $buyer = $this->profile();
        $product = $this->activeProduct([
            'price_cents' => 1500,
            'stock' => 5,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/cart/items', [
                'product_id' => $product->id,
                'quantity' => 2,
            ])
            ->assertCreated()
            ->assertJsonPath('data.product_id', $product->id)
            ->assertJsonPath('data.quantity', 2)
            ->assertJsonPath('data.unit_price_cents', 1500)
            ->assertJsonPath('data.subtotal_cents', 3000);

        $this->assertDatabaseHas('cart_items', [
            'profile_id' => $buyer->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);
    }

    public function test_adding_same_product_accumulates_quantity(): void
    {
        $buyer = $this->profile();
        $product = $this->activeProduct(['stock' => 5]);

        CartItem::query()->create([
            'profile_id' => $buyer->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/cart/items', [
                'product_id' => $product->id,
                'quantity' => 2,
            ])
            ->assertCreated()
            ->assertJsonPath('data.quantity', 3);

        $this->assertDatabaseHas('cart_items', [
            'profile_id' => $buyer->id,
            'product_id' => $product->id,
            'quantity' => 3,
        ]);
    }

    public function test_cart_rejects_quantity_above_stock(): void
    {
        $buyer = $this->profile();
        $product = $this->activeProduct(['stock' => 1]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/cart/items', [
                'product_id' => $product->id,
                'quantity' => 2,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('quantity');
    }

    public function test_cart_rejects_inactive_products(): void
    {
        $buyer = $this->profile();
        $product = $this->activeProduct([
            'status' => Product::STATUS_DRAFT,
            'stock' => 5,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/cart/items', [
                'product_id' => $product->id,
                'quantity' => 1,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('product_id');
    }

    public function test_cart_rejects_products_from_suspended_stores(): void
    {
        $buyer = $this->profile();
        $product = $this->activeProduct([
            'stock' => 5,
        ], [
            'status' => Store::STATUS_SUSPENDED,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/cart/items', [
                'product_id' => $product->id,
                'quantity' => 1,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('product_id');
    }

    public function test_buyer_can_list_update_and_remove_own_cart_items(): void
    {
        $buyer = $this->profile();
        $product = $this->activeProduct(['stock' => 5]);
        $cartItem = CartItem::query()->create([
            'profile_id' => $buyer->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->getJson('/api/cart')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $cartItem->id)
            ->assertJsonPath('meta.subtotal_cents', 1000)
            ->assertJsonPath('meta.shipping_cents', 499)
            ->assertJsonPath('meta.total_cents', 1499)
            ->assertJsonPath('meta.item_count', 1);

        $this->withToken($this->tokenFor($buyer))
            ->patchJson('/api/cart/items/'.$cartItem->id, [
                'quantity' => 4,
            ])
            ->assertOk()
            ->assertJsonPath('data.quantity', 4);

        $this->withToken($this->tokenFor($buyer))
            ->deleteJson('/api/cart/items/'.$cartItem->id)
            ->assertNoContent();

        $this->assertDatabaseMissing('cart_items', [
            'id' => $cartItem->id,
        ]);
    }

    public function test_buyer_cannot_update_another_profiles_cart_item(): void
    {
        $buyer = $this->profile();
        $otherBuyer = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000002',
            'email' => 'other@example.com',
        ]);
        $product = $this->activeProduct(['stock' => 5]);
        $cartItem = CartItem::query()->create([
            'profile_id' => $otherBuyer->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->patchJson('/api/cart/items/'.$cartItem->id, [
                'quantity' => 2,
            ])
            ->assertNotFound();
    }

    public function test_buyer_can_clear_cart(): void
    {
        $buyer = $this->profile();
        $product = $this->activeProduct(['stock' => 5]);
        CartItem::query()->create([
            'profile_id' => $buyer->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->deleteJson('/api/cart')
            ->assertNoContent();

        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_seller_cannot_add_its_own_product_to_cart(): void
    {
        $seller = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000099',
            'email' => 'owner@example.com',
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        $store = Store::query()->create([
            'profile_id' => $seller->id,
            'name' => 'Owner Store',
            'slug' => 'owner-store',
            'status' => Store::STATUS_ACTIVE,
        ]);
        $product = Product::query()->create([
            'store_id' => $store->id,
            'name' => 'Producto propio',
            'slug' => 'producto-propio',
            'price_cents' => 1000,
            'currency' => 'USD',
            'stock' => 5,
            'status' => Product::STATUS_ACTIVE,
        ]);

        $this->withToken($this->tokenFor($seller))
            ->postJson('/api/cart/items', [
                'product_id' => $product->id,
                'quantity' => 1,
            ])
            ->assertStatus(422)
            ->assertJsonPath('errors.product_id.0', 'No puedes comprar tu propio producto.');

        $this->assertDatabaseMissing('cart_items', [
            'profile_id' => $seller->id,
            'product_id' => $product->id,
        ]);
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
