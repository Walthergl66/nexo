<?php

namespace Tests\Feature\Products;

use App\Models\Category;
use App\Models\Product;
use App\Models\Profile;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'supabase.url' => 'https://project.supabase.co',
            'supabase.jwt_secret' => 'test-secret',
            'supabase.jwt_algorithm' => 'HS256',
            'supabase.auth_audience' => 'authenticated',
        ]);
    }

    public function test_store_owner_can_create_product_as_draft(): void
    {
        [$seller, $store] = $this->sellerWithStore();
        $category = $this->category();
        $imageUrl = 'https://project.supabase.co/storage/v1/object/public/product-images/'.$store->id.'/cafe.png';

        $this->withToken($this->tokenFor($seller))
            ->postJson('/api/products', [
                'category_id' => $category->id,
                'name' => 'Cafe especial',
                'description' => 'Cafe tostado por emprendedores.',
                'price_cents' => 1299,
                'stock' => 15,
                'images' => [
                    ['url' => $imageUrl, 'alt_text' => 'Cafe'],
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Cafe especial')
            ->assertJsonPath('data.slug', 'cafe-especial')
            ->assertJsonPath('data.status', Product::STATUS_DRAFT)
            ->assertJsonPath('data.images.0.url', $imageUrl);

        $this->assertDatabaseHas('products', [
            'store_id' => $store->id,
            'category_id' => $category->id,
            'name' => 'Cafe especial',
            'price_cents' => 1299,
            'status' => Product::STATUS_DRAFT,
        ]);
        $this->assertDatabaseHas('product_images', [
            'url' => $imageUrl,
            'position' => 0,
        ]);
    }

    public function test_product_images_must_use_product_images_bucket(): void
    {
        [$seller] = $this->sellerWithStore();

        $this->withToken($this->tokenFor($seller))
            ->postJson('/api/products', [
                'name' => 'Cafe especial',
                'description' => 'Cafe tostado por emprendedores.',
                'price_cents' => 1299,
                'images' => [
                    ['url' => 'https://example.com/cafe.png', 'alt_text' => 'Cafe'],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('images.0.url');
    }

    public function test_buyer_cannot_create_product(): void
    {
        $buyer = $this->profile();

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/products', [
                'name' => 'Producto',
                'price_cents' => 1000,
            ])
            ->assertNotFound();
    }

    public function test_product_cannot_be_created_for_suspended_store(): void
    {
        [$seller, $store] = $this->sellerWithStore([
            'status' => Store::STATUS_SUSPENDED,
        ]);

        $this->withToken($this->tokenFor($seller))
            ->postJson('/api/products', [
                'name' => 'Producto',
                'price_cents' => 1000,
            ])
            ->assertUnprocessable();
    }

    public function test_owner_can_publish_product_when_store_is_active(): void
    {
        [$seller, $store] = $this->sellerWithStore();
        $product = Product::query()->create([
            'store_id' => $store->id,
            'name' => 'Producto borrador',
            'slug' => 'producto-borrador',
            'price_cents' => 1000,
            'stock' => 5,
            'status' => Product::STATUS_DRAFT,
        ]);

        $this->withToken($this->tokenFor($seller))
            ->patchJson('/api/products/'.$product->slug, [
                'status' => Product::STATUS_ACTIVE,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', Product::STATUS_ACTIVE);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'status' => Product::STATUS_ACTIVE,
        ]);
    }

    public function test_public_product_list_only_returns_active_products_from_active_stores(): void
    {
        [, $store] = $this->sellerWithStore();
        Product::query()->create([
            'store_id' => $store->id,
            'name' => 'Producto activo',
            'slug' => 'producto-activo',
            'price_cents' => 1000,
            'stock' => 5,
            'status' => Product::STATUS_ACTIVE,
        ]);
        Product::query()->create([
            'store_id' => $store->id,
            'name' => 'Producto draft',
            'slug' => 'producto-draft',
            'price_cents' => 1000,
            'stock' => 5,
            'status' => Product::STATUS_DRAFT,
        ]);

        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'producto-activo');
    }

    public function test_seller_without_store_gets_empty_my_products_list(): void
    {
        $seller = $this->profile([
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);

        $this->withToken($this->tokenFor($seller))
            ->getJson('/api/my-products')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_non_owner_cannot_update_product(): void
    {
        [, $store] = $this->sellerWithStore();
        $otherSeller = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000003',
            'email' => 'seller-two@example.com',
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        Store::query()->create([
            'profile_id' => $otherSeller->id,
            'name' => 'Other Store',
            'slug' => 'other-store',
            'status' => Store::STATUS_ACTIVE,
        ]);
        $product = Product::query()->create([
            'store_id' => $store->id,
            'name' => 'Producto dueño',
            'slug' => 'producto-dueno',
            'price_cents' => 1000,
            'stock' => 5,
            'status' => Product::STATUS_DRAFT,
        ]);

        $this->withToken($this->tokenFor($otherSeller))
            ->patchJson('/api/products/'.$product->slug, [
                'name' => 'Cambio no permitido',
            ])
            ->assertForbidden();
    }

    public function test_suspended_seller_cannot_update_owned_product(): void
    {
        [$seller, $store] = $this->sellerWithStore();
        $seller->forceFill([
            'verification_status' => Profile::VERIFICATION_SUSPENDED,
        ])->save();
        $product = Product::query()->create([
            'store_id' => $store->id,
            'name' => 'Producto dueño',
            'slug' => 'producto-dueno',
            'price_cents' => 1000,
            'stock' => 5,
            'status' => Product::STATUS_DRAFT,
        ]);

        $this->withToken($this->tokenFor($seller))
            ->patchJson('/api/products/'.$product->slug, [
                'status' => Product::STATUS_ACTIVE,
            ])
            ->assertForbidden();
    }

    /**
     * @param  array<string, mixed>  $storeOverrides
     * @return array{0: Profile, 1: Store}
     */
    private function sellerWithStore(array $storeOverrides = []): array
    {
        $seller = $this->profile([
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        $store = Store::query()->create(array_merge([
            'profile_id' => $seller->id,
            'name' => 'Nexo Store',
            'slug' => 'nexo-store',
            'status' => Store::STATUS_ACTIVE,
        ], $storeOverrides));

        return [$seller, $store];
    }

    private function category(): Category
    {
        return Category::query()->create([
            'name' => 'Alimentos',
            'slug' => 'alimentos',
            'status' => Category::STATUS_ACTIVE,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function profile(array $overrides = []): Profile
    {
        return Profile::query()->create(array_merge([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000001',
            'email' => 'user@example.com',
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
