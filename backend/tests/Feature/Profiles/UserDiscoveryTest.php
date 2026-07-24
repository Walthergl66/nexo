<?php

namespace Tests\Feature\Profiles;

use App\Models\Profile;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserDiscoveryTest extends TestCase
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

    public function test_user_search_finds_by_display_name(): void
    {
        $me = $this->profile();
        $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-0000000000a1',
            'email' => 'aka@example.com',
            'display_name' => 'Akamnex Tienda',
        ]);
        $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-0000000000a2',
            'email' => 'other@example.com',
            'display_name' => 'Otra Persona',
        ]);

        $this->withToken($this->tokenFor($me))
            ->getJson('/api/users/search?q=akam')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.display_name', 'Akamnex Tienda');
    }

    public function test_user_search_finds_by_store_name(): void
    {
        $me = $this->profile();
        $seller = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-0000000000e1',
            'email' => 'seller3@example.com',
            'display_name' => 'Nombre Poco Conocido',
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        Store::query()->create([
            'profile_id' => $seller->id,
            'name' => 'Zapateria Central',
            'slug' => 'zapateria-central',
            'status' => Store::STATUS_ACTIVE,
        ]);

        // Buscando el nombre de la tienda encuentra al vendedor detrás.
        $this->withToken($this->tokenFor($me))
            ->getJson('/api/users/search?q=zapateria')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.display_name', 'Nombre Poco Conocido')
            ->assertJsonPath('data.0.store.name', 'Zapateria Central');
    }

    public function test_user_search_never_leaks_personal_data(): void
    {
        $me = $this->profile();
        $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-0000000000b1',
            'email' => 'target@example.com',
            'display_name' => 'Objetivo Buscado',
            'national_id' => '1710034065',
            'phone' => '0999019074',
            'address' => 'Calle secreta 123',
            'first_name' => 'Nombre',
            'last_name' => 'Apellido',
        ]);

        $response = $this->withToken($this->tokenFor($me))
            ->getJson('/api/users/search?q=objetivo')
            ->assertOk();

        $user = $response->json('data.0');

        // Lo público:
        $this->assertSame('Objetivo Buscado', $user['display_name']);
        $this->assertArrayHasKey('is_verified', $user);

        // Lo que NUNCA debe salir:
        foreach (['email', 'phone', 'national_id', 'address', 'first_name', 'last_name', 'age', 'gender'] as $forbidden) {
            $this->assertArrayNotHasKey($forbidden, $user, "El campo {$forbidden} no debe exponerse.");
        }
    }

    public function test_search_excludes_the_requester_and_short_queries(): void
    {
        $me = $this->profile(['display_name' => 'Yo Mismo']);

        // Se excluye a uno mismo aunque coincida.
        $this->withToken($this->tokenFor($me))
            ->getJson('/api/users/search?q=yo mismo')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // Menos de 2 caracteres no busca.
        $this->withToken($this->tokenFor($me))
            ->getJson('/api/users/search?q=a')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_user_search_requires_authentication(): void
    {
        $this->getJson('/api/users/search?q=akam')->assertUnauthorized();
    }

    public function test_visiting_a_seller_profile_returns_public_data_and_store(): void
    {
        $me = $this->profile();
        $seller = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-0000000000c1',
            'email' => 'seller@example.com',
            'display_name' => 'Vendedor Estrella',
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
            'phone' => '0999019074',
        ]);
        Store::query()->create([
            'profile_id' => $seller->id,
            'name' => 'Tienda Estrella',
            'slug' => 'tienda-estrella',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $response = $this->withToken($this->tokenFor($me))
            ->getJson('/api/users/'.$seller->id)
            ->assertOk()
            ->assertJsonPath('data.display_name', 'Vendedor Estrella')
            ->assertJsonPath('data.is_verified', true)
            ->assertJsonPath('data.store.slug', 'tienda-estrella');

        $this->assertArrayNotHasKey('phone', $response->json('data'));
    }

    public function test_visiting_a_buyer_profile_has_no_store(): void
    {
        $me = $this->profile();
        $buyer = $this->profile([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-0000000000d1',
            'email' => 'buyer2@example.com',
            'display_name' => 'Comprador Comun',
        ]);

        $this->withToken($this->tokenFor($me))
            ->getJson('/api/users/'.$buyer->id)
            ->assertOk()
            ->assertJsonPath('data.store', null);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function profile(array $overrides = []): Profile
    {
        return Profile::query()->create(array_merge([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000001',
            'email' => 'me@example.com',
            'display_name' => 'Buscador',
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
