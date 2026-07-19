<?php

namespace Tests\Feature\Profiles;

use App\Models\Profile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ProfileOnboardingTest extends TestCase
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

    public function test_identity_lookup_validates_and_normalizes_external_response(): void
    {
        Http::fake([
            'identity.test/*' => Http::response([
                'data' => [
                    'nombreCompleto' => 'JUAN CARLOS PEREZ LOPEZ',
                    'edad' => 31,
                    'genero' => 'MASCULINO',
                ],
            ]),
        ]);

        $this->getJson('/api/identity/lookup?identificacion=1710034065')
            ->assertOk()
            ->assertJsonPath('data.national_id', '1710034065')
            ->assertJsonPath('data.first_name', 'JUAN CARLOS')
            ->assertJsonPath('data.last_name', 'PEREZ LOPEZ')
            ->assertJsonPath('data.age', 31)
            ->assertJsonPath('data.gender', 'MASCULINO');
    }

    public function test_identity_lookup_normalizes_nested_registry_response(): void
    {
        Http::fake([
            'identity.test/*' => Http::response([
                'paquete' => [
                    'entidades' => [
                        'entidad' => [
                            [
                                'nombre' => 'Datos Demograficos',
                                'filas' => [
                                    'fila' => [
                                        [
                                            'columnas' => [
                                                'columna' => [
                                                    ['campo' => 'cedula', 'valor' => '1710034065'],
                                                    ['campo' => 'fechaNacimiento', 'valor' => '06/04/1974'],
                                                    ['campo' => 'nombre', 'valor' => 'ESPINOSA FLORES DORA MARGARITA'],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ]),
        ]);

        $this->getJson('/api/identity/lookup?identificacion=1710034065')
            ->assertOk()
            ->assertJsonPath('data.national_id', '1710034065')
            ->assertJsonPath('data.first_name', 'DORA MARGARITA')
            ->assertJsonPath('data.last_name', 'ESPINOSA FLORES')
            ->assertJsonPath('data.age', 52);
    }

    public function test_profile_availability_reports_duplicate_email_and_national_id(): void
    {
        Profile::query()->create([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000001',
            'email' => 'taken@example.com',
            'national_id' => '1710034065',
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ]);

        $this->getJson('/api/profiles/availability?email=taken@example.com&national_id=1710034065')
            ->assertOk()
            ->assertJsonPath('data.email_available', false)
            ->assertJsonPath('data.national_id_available', false);
    }

    public function test_authenticated_profile_can_be_completed_once_with_unique_national_id(): void
    {
        $profile = Profile::query()->create([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000002',
            'email' => 'new@example.com',
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ]);

        $this->withToken($this->tokenFor($profile))
            ->patchJson('/api/me/profile', [
                'national_id' => '1710034065',
                'first_name' => 'Juan Carlos',
                'last_name' => 'Perez Lopez',
                'age' => 31,
                'gender' => 'Masculino',
                'address' => 'Av. Siempre Viva 123',
                'phone' => '0991234567',
            ])
            ->assertOk()
            ->assertJsonPath('data.national_id', '1710034065')
            ->assertJsonPath('data.display_name', 'Juan Carlos Perez Lopez');

        $this->assertDatabaseHas('profiles', [
            'id' => $profile->id,
            'national_id' => '1710034065',
            'address' => 'Av. Siempre Viva 123',
            'phone' => '0991234567',
        ]);
    }

    public function test_profile_completion_rejects_duplicate_national_id(): void
    {
        Profile::query()->create([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000003',
            'email' => 'taken@example.com',
            'national_id' => '1710034065',
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ]);
        $profile = Profile::query()->create([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000004',
            'email' => 'new@example.com',
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ]);

        $this->withToken($this->tokenFor($profile))
            ->patchJson('/api/me/profile', [
                'national_id' => '1710034065',
                'first_name' => 'Maria',
                'last_name' => 'Lopez',
                'address' => 'Av. Siempre Viva 123',
                'phone' => '0991234567',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('national_id');
    }

    public function test_profile_completion_rejects_phone_without_ten_ecuadorian_mobile_digits(): void
    {
        $profile = Profile::query()->create([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000005',
            'email' => 'new@example.com',
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ]);

        $this->withToken($this->tokenFor($profile))
            ->patchJson('/api/me/profile', [
                'national_id' => '1710034065',
                'first_name' => 'Maria',
                'last_name' => 'Lopez',
                'address' => 'Av. Siempre Viva 123',
                'phone' => '021234567',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('phone');
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
