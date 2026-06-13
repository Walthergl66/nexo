<?php

namespace Tests\Feature\Stores;

use App\Models\Profile;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoresTest extends TestCase
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

    public function test_approved_seller_can_create_store(): void
    {
        $seller = $this->profile([
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);

        $this->withToken($this->tokenFor($seller))
            ->postJson('/api/stores', [
                'name' => 'Nexo Store',
                'description' => 'Productos hechos por emprendedores.',
                'logo_url' => 'https://example.com/logo.png',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Nexo Store')
            ->assertJsonPath('data.slug', 'nexo-store')
            ->assertJsonPath('data.status', Store::STATUS_ACTIVE);

        $this->assertDatabaseHas('stores', [
            'profile_id' => $seller->id,
            'name' => 'Nexo Store',
            'slug' => 'nexo-store',
            'status' => Store::STATUS_ACTIVE,
        ]);
    }

    public function test_buyer_cannot_create_store(): void
    {
        $buyer = $this->profile([
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ]);

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/stores', [
                'name' => 'Unauthorized Store',
            ])
            ->assertUnprocessable();
    }

    public function test_seller_can_have_only_one_store(): void
    {
        $seller = $this->profile([
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);

        Store::query()->create([
            'profile_id' => $seller->id,
            'name' => 'Existing Store',
            'slug' => 'existing-store',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $this->withToken($this->tokenFor($seller))
            ->postJson('/api/stores', [
                'name' => 'Second Store',
            ])
            ->assertUnprocessable();
    }

    public function test_public_store_list_only_returns_active_stores(): void
    {
        $seller = $this->profile([
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        $activeStore = Store::query()->create([
            'profile_id' => $seller->id,
            'name' => 'Active Store',
            'slug' => 'active-store',
            'status' => Store::STATUS_ACTIVE,
        ]);
        $suspendedSeller = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000002',
            'email' => 'seller-two@example.com',
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_SUSPENDED,
        ]);
        Store::query()->create([
            'profile_id' => $suspendedSeller->id,
            'name' => 'Suspended Store',
            'slug' => 'suspended-store',
            'status' => Store::STATUS_SUSPENDED,
        ]);

        $this->getJson('/api/stores')
            ->assertOk()
            ->assertJsonPath('data.0.id', $activeStore->id)
            ->assertJsonCount(1, 'data');
    }

    public function test_store_owner_can_update_store(): void
    {
        $seller = $this->profile([
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        $store = Store::query()->create([
            'profile_id' => $seller->id,
            'name' => 'Old Store',
            'slug' => 'old-store',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $this->withToken($this->tokenFor($seller))
            ->patchJson('/api/stores/'.$store->slug, [
                'name' => 'New Store',
                'description' => 'Nueva descripcion.',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'New Store')
            ->assertJsonPath('data.slug', 'new-store');

        $this->assertDatabaseHas('stores', [
            'id' => $store->id,
            'name' => 'New Store',
            'slug' => 'new-store',
        ]);
    }

    public function test_non_owner_cannot_update_store(): void
    {
        $seller = $this->profile([
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        $otherSeller = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000003',
            'email' => 'seller-three@example.com',
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        $store = Store::query()->create([
            'profile_id' => $seller->id,
            'name' => 'Owner Store',
            'slug' => 'owner-store',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $this->withToken($this->tokenFor($otherSeller))
            ->patchJson('/api/stores/'.$store->slug, [
                'name' => 'Hijacked Store',
            ])
            ->assertForbidden();
    }

    public function test_my_store_returns_authenticated_seller_store(): void
    {
        $seller = $this->profile([
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        Store::query()->create([
            'profile_id' => $seller->id,
            'name' => 'My Store',
            'slug' => 'my-store',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $this->withToken($this->tokenFor($seller))
            ->getJson('/api/my-store')
            ->assertOk()
            ->assertJsonPath('data.slug', 'my-store');
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function profile(array $overrides = []): Profile
    {
        return Profile::query()->create(array_merge([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000001',
            'email' => 'seller@example.com',
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
