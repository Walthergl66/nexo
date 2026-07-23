<?php

namespace Tests\Feature\Admin;

use App\Models\Profile;
use App\Models\SellerVerificationRequest;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminStoresTest extends TestCase
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

    public function test_admin_store_list_is_paginated(): void
    {
        $admin = $this->admin();

        foreach (range(1, 25) as $index) {
            $this->store($index);
        }

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson('/api/admin/stores')
            ->assertOk()
            ->assertJsonCount(20, 'data')
            ->assertJsonPath('meta.total', 25)
            ->assertJsonPath('meta.per_page', 20)
            ->assertJsonPath('meta.current_page', 1);

        $this->assertSame(2, $response->json('meta.last_page'));

        $this->withToken($this->tokenFor($admin))
            ->getJson('/api/admin/stores?page=2')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 2);
    }

    public function test_admin_store_list_respects_per_page_and_caps_it(): void
    {
        $admin = $this->admin();

        foreach (range(1, 5) as $index) {
            $this->store($index);
        }

        $this->withToken($this->tokenFor($admin))
            ->getJson('/api/admin/stores?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.per_page', 2);

        // per_page por encima del tope se rechaza en validacion, no se sirve.
        $this->withToken($this->tokenFor($admin))
            ->getJson('/api/admin/stores?per_page=500')
            ->assertStatus(422);
    }

    public function test_admin_store_list_filters_by_status(): void
    {
        $admin = $this->admin();
        $this->store(1, Store::STATUS_ACTIVE);
        $this->store(2, Store::STATUS_SUSPENDED);

        $this->withToken($this->tokenFor($admin))
            ->getJson('/api/admin/stores?status=suspended')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', Store::STATUS_SUSPENDED);
    }

    public function test_non_admin_cannot_list_admin_stores(): void
    {
        $buyer = $this->profile();

        $this->withToken($this->tokenFor($buyer))
            ->getJson('/api/admin/stores')
            ->assertForbidden();
    }

    public function test_overview_counts_come_from_the_database_not_the_page(): void
    {
        $admin = $this->admin();

        $this->store(1, Store::STATUS_ACTIVE);
        $this->store(2, Store::STATUS_ACTIVE);
        $this->store(3, Store::STATUS_SUSPENDED);

        SellerVerificationRequest::query()->create([
            'profile_id' => $this->profile([
                'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-0000000000aa',
                'email' => 'pending@example.com',
            ])->id,
            'business_name' => 'Pendiente',
            'status' => SellerVerificationRequest::STATUS_PENDING,
        ]);

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson('/api/admin/overview')
            ->assertOk();

        $this->assertSame(2, $response->json('data.active_stores'));
        $this->assertSame(1, $response->json('data.suspended_stores'));
        $this->assertSame(1, $response->json('data.pending_requests'));
        $this->assertSame(0, $response->json('data.active_products'));
    }

    public function test_non_admin_cannot_read_overview(): void
    {
        $buyer = $this->profile();

        $this->withToken($this->tokenFor($buyer))
            ->getJson('/api/admin/overview')
            ->assertForbidden();
    }

    private function admin(): Profile
    {
        return $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-0000000000ad',
            'email' => 'admin@example.com',
            'role' => Profile::ROLE_ADMIN,
        ]);
    }

    private function store(int $index, string $status = Store::STATUS_ACTIVE): Store
    {
        $owner = $this->profile([
            'supabase_user_id' => sprintf('018f1d4c-40a5-7fd2-9a5a-%012d', $index),
            'email' => "owner{$index}@example.com",
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);

        return Store::query()->create([
            'profile_id' => $owner->id,
            'name' => "Store {$index}",
            'slug' => "store-{$index}",
            'status' => $status,
        ]);
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
