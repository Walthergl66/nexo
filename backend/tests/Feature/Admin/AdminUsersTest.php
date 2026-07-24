<?php

namespace Tests\Feature\Admin;

use App\Models\Profile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUsersTest extends TestCase
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

    public function test_admin_can_list_users_paginated(): void
    {
        $admin = $this->admin();
        foreach (range(1, 24) as $index) {
            $this->user($index);
        }

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 20);

        // 24 usuarios + el admin = 25 en total.
        $this->assertSame(25, $response->json('meta.total'));
        $this->assertCount(20, $response->json('data'));
    }

    public function test_admin_user_list_can_search_and_exposes_contact_data(): void
    {
        $admin = $this->admin();
        $this->user(1, ['display_name' => 'Maria Buscada', 'email' => 'maria@example.com', 'phone' => '0999019074']);
        $this->user(2, ['display_name' => 'Otro Usuario', 'email' => 'otro@example.com']);

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson('/api/admin/users?search=maria')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.display_name', 'Maria Buscada');

        // El admin SÍ ve datos de contacto (a diferencia del perfil público).
        $this->assertSame('0999019074', $response->json('data.0.phone'));
        $this->assertSame('maria@example.com', $response->json('data.0.email'));
    }

    public function test_admin_can_change_a_user_role(): void
    {
        $admin = $this->admin();
        $user = $this->user(1);

        $this->withToken($this->tokenFor($admin))
            ->patchJson('/api/admin/users/'.$user->id, ['role' => Profile::ROLE_SELLER])
            ->assertOk()
            ->assertJsonPath('data.role', Profile::ROLE_SELLER);

        $this->assertDatabaseHas('profiles', ['id' => $user->id, 'role' => Profile::ROLE_SELLER]);
    }

    public function test_admin_can_suspend_and_reactivate_a_user(): void
    {
        $admin = $this->admin();
        $user = $this->user(1, ['role' => Profile::ROLE_SELLER, 'verification_status' => Profile::VERIFICATION_APPROVED]);

        $this->withToken($this->tokenFor($admin))
            ->patchJson('/api/admin/users/'.$user->id, ['verification_status' => Profile::VERIFICATION_SUSPENDED])
            ->assertOk()
            ->assertJsonPath('data.verification_status', Profile::VERIFICATION_SUSPENDED);

        $this->withToken($this->tokenFor($admin))
            ->patchJson('/api/admin/users/'.$user->id, ['verification_status' => Profile::VERIFICATION_APPROVED])
            ->assertOk()
            ->assertJsonPath('data.verification_status', Profile::VERIFICATION_APPROVED);
    }

    public function test_admin_cannot_modify_their_own_account(): void
    {
        $admin = $this->admin();

        $this->withToken($this->tokenFor($admin))
            ->patchJson('/api/admin/users/'.$admin->id, ['role' => Profile::ROLE_BUYER])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('user');

        $this->assertDatabaseHas('profiles', ['id' => $admin->id, 'role' => Profile::ROLE_ADMIN]);
    }

    public function test_invalid_role_is_rejected(): void
    {
        $admin = $this->admin();
        $user = $this->user(1);

        $this->withToken($this->tokenFor($admin))
            ->patchJson('/api/admin/users/'.$user->id, ['role' => 'superadmin'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('role');
    }

    public function test_non_admin_cannot_list_or_update_users(): void
    {
        $buyer = $this->user(1);
        $other = $this->user(2);

        $this->withToken($this->tokenFor($buyer))
            ->getJson('/api/admin/users')
            ->assertForbidden();

        $this->withToken($this->tokenFor($buyer))
            ->patchJson('/api/admin/users/'.$other->id, ['role' => Profile::ROLE_ADMIN])
            ->assertForbidden();

        $this->assertDatabaseHas('profiles', ['id' => $other->id, 'role' => Profile::ROLE_BUYER]);
    }

    private function admin(): Profile
    {
        return $this->user(0, [
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-0000000000ad',
            'email' => 'admin@example.com',
            'display_name' => 'Admin',
            'role' => Profile::ROLE_ADMIN,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function user(int $index, array $overrides = []): Profile
    {
        return Profile::query()->create(array_merge([
            'supabase_user_id' => sprintf('018f1d4c-40a5-7fd2-9a5a-%012d', $index),
            'email' => "user{$index}@example.com",
            'display_name' => "Usuario {$index}",
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ], $overrides));
    }

    private function tokenFor(Profile $profile): string
    {
        $header = $this->base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR));
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
