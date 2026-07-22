<?php

namespace Tests\Feature\Security;

use App\Models\Profile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RateLimitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'supabase.jwt_secret' => 'test-secret',
            'supabase.jwt_algorithm' => 'HS256',
            'supabase.auth_audience' => 'authenticated',
            'services.identity_lookup.url' => 'http://identity.test/consultar',
        ]);
    }

    public function test_identity_lookup_stops_after_five_requests_per_minute(): void
    {
        Http::fake([
            'identity.test/*' => Http::response([
                'data' => ['nombreCompleto' => 'JUAN PEREZ', 'edad' => 30],
            ]),
        ]);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->getJson('/api/identity/lookup?identificacion=1710034065')
                ->assertOk();
        }

        $this->getJson('/api/identity/lookup?identificacion=1710034065')
            ->assertStatus(429)
            ->assertJsonPath('message', 'Demasiadas consultas de cedula. Espera un minuto antes de reintentar.')
            ->assertHeader('Retry-After');
    }

    public function test_rate_limited_response_keeps_the_upstream_service_untouched(): void
    {
        Http::fake([
            'identity.test/*' => Http::response([
                'data' => ['nombreCompleto' => 'JUAN PEREZ', 'edad' => 30],
            ]),
        ]);

        for ($attempt = 1; $attempt <= 6; $attempt++) {
            $this->getJson('/api/identity/lookup?identificacion=1710034065');
        }

        // El sexto intento se corta antes del controlador: el proveedor externo
        // solo ve las cinco consultas permitidas. Esa es la razon de ser del
        // cupo, porque cada consulta se paga.
        Http::assertSentCount(5);
    }

    public function test_availability_endpoint_has_its_own_quota(): void
    {
        for ($attempt = 1; $attempt <= 20; $attempt++) {
            $this->getJson('/api/profiles/availability?email=alguien@example.com')
                ->assertOk();
        }

        $this->getJson('/api/profiles/availability?email=alguien@example.com')
            ->assertStatus(429);
    }

    public function test_authenticated_requests_are_counted_per_profile(): void
    {
        $first = $this->profile();
        $second = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000002',
            'email' => 'second@example.com',
        ]);

        $this->withToken($this->tokenFor($first))->getJson('/api/me')->assertOk();

        $response = $this->withToken($this->tokenFor($first))->getJson('/api/me')->assertOk();
        $this->assertSame('120', $response->headers->get('X-RateLimit-Limit'));
        $this->assertSame('118', $response->headers->get('X-RateLimit-Remaining'));

        // El segundo perfil arranca con su propio cupo: dos usuarios detras de
        // la misma IP no se estorban.
        $response = $this->withToken($this->tokenFor($second))->getJson('/api/me')->assertOk();
        $this->assertSame('119', $response->headers->get('X-RateLimit-Remaining'));
    }

    public function test_public_routes_expose_the_general_ip_quota(): void
    {
        $response = $this->getJson('/api/products')->assertOk();

        $this->assertSame('300', $response->headers->get('X-RateLimit-Limit'));
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
