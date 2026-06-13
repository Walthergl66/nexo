<?php

namespace Tests\Feature\Auth;

use App\Models\Profile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MeEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_requires_a_bearer_token(): void
    {
        $this->getJson('/api/me')
            ->assertUnauthorized()
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_me_creates_profile_from_valid_supabase_jwt(): void
    {
        config([
            'supabase.jwt_secret' => 'test-secret',
            'supabase.jwt_algorithm' => 'HS256',
            'supabase.auth_audience' => 'authenticated',
        ]);

        $supabaseUserId = '018f1d4c-40a5-7fd2-9a5a-123456789abc';
        $token = $this->supabaseToken([
            'sub' => $supabaseUserId,
            'aud' => 'authenticated',
            'email' => 'buyer@example.com',
            'user_metadata' => [
                'full_name' => 'Nexo Buyer',
            ],
            'exp' => time() + 3600,
        ]);

        $this->withToken($token)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.supabase_user_id', $supabaseUserId)
            ->assertJsonPath('data.email', 'buyer@example.com')
            ->assertJsonPath('data.display_name', 'Nexo Buyer')
            ->assertJsonPath('data.role', Profile::ROLE_BUYER)
            ->assertJsonPath('data.verification_status', Profile::VERIFICATION_PENDING);

        $this->assertDatabaseHas('profiles', [
            'supabase_user_id' => $supabaseUserId,
            'email' => 'buyer@example.com',
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ]);
    }

    public function test_me_rejects_invalid_token_signature(): void
    {
        config([
            'supabase.jwt_secret' => 'test-secret',
            'supabase.jwt_algorithm' => 'HS256',
            'supabase.auth_audience' => 'authenticated',
        ]);

        $token = $this->supabaseToken([
            'sub' => '018f1d4c-40a5-7fd2-9a5a-123456789abc',
            'aud' => 'authenticated',
            'exp' => time() + 3600,
        ], 'wrong-secret');

        $this->withToken($token)
            ->getJson('/api/me')
            ->assertUnauthorized();
    }

    public function test_me_rejects_tokens_without_expiration(): void
    {
        config([
            'supabase.jwt_secret' => 'test-secret',
            'supabase.jwt_algorithm' => 'HS256',
            'supabase.auth_audience' => 'authenticated',
        ]);

        $token = $this->supabaseToken([
            'sub' => '018f1d4c-40a5-7fd2-9a5a-123456789abc',
            'aud' => 'authenticated',
        ]);

        $this->withToken($token)
            ->getJson('/api/me')
            ->assertUnauthorized();
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
