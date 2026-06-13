<?php

namespace Tests\Feature\Categories;

use App\Models\Category;
use App\Models\Profile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoriesTest extends TestCase
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

    public function test_admin_can_create_category(): void
    {
        $admin = $this->profile([
            'role' => Profile::ROLE_ADMIN,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);

        $this->withToken($this->tokenFor($admin))
            ->postJson('/api/admin/categories', [
                'name' => 'Artesanias',
                'description' => 'Productos hechos a mano.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Artesanias')
            ->assertJsonPath('data.slug', 'artesanias')
            ->assertJsonPath('data.status', Category::STATUS_ACTIVE);

        $this->assertDatabaseHas('categories', [
            'name' => 'Artesanias',
            'slug' => 'artesanias',
            'status' => Category::STATUS_ACTIVE,
        ]);
    }

    public function test_non_admin_cannot_create_category(): void
    {
        $buyer = $this->profile();

        $this->withToken($this->tokenFor($buyer))
            ->postJson('/api/admin/categories', [
                'name' => 'No permitido',
            ])
            ->assertForbidden();
    }

    public function test_public_category_list_only_returns_active_categories(): void
    {
        Category::query()->create([
            'name' => 'Activa',
            'slug' => 'activa',
            'status' => Category::STATUS_ACTIVE,
        ]);
        Category::query()->create([
            'name' => 'Inactiva',
            'slug' => 'inactiva',
            'status' => Category::STATUS_INACTIVE,
        ]);

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'activa');
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
