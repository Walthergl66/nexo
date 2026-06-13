<?php

namespace Tests\Feature\Sellers;

use App\Models\Profile;
use App\Models\SellerVerificationRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerVerificationTest extends TestCase
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

    public function test_buyer_can_request_seller_verification(): void
    {
        $supabaseUserId = '018f1d4c-40a5-7fd2-9a5a-123456789abc';

        $this->withToken($this->supabaseToken([
            'sub' => $supabaseUserId,
            'aud' => 'authenticated',
            'email' => 'buyer@example.com',
            'exp' => time() + 3600,
        ]))
            ->postJson('/api/seller-verification/request', [
                'business_name' => 'Nexo Store',
                'business_description' => 'Productos hechos por emprendedores.',
                'document_type' => 'ruc',
                'document_number' => '1234567890001',
            ])
            ->assertCreated()
            ->assertJsonPath('data.business_name', 'Nexo Store')
            ->assertJsonPath('data.status', SellerVerificationRequest::STATUS_PENDING);

        $profile = Profile::query()->where('supabase_user_id', $supabaseUserId)->firstOrFail();

        $this->assertDatabaseHas('seller_verification_requests', [
            'profile_id' => $profile->id,
            'business_name' => 'Nexo Store',
            'status' => SellerVerificationRequest::STATUS_PENDING,
        ]);
    }

    public function test_profile_cannot_have_two_pending_seller_verification_requests(): void
    {
        $profile = Profile::query()->create([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-123456789abc',
            'email' => 'buyer@example.com',
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ]);

        SellerVerificationRequest::query()->create([
            'profile_id' => $profile->id,
            'business_name' => 'Existing Store',
            'status' => SellerVerificationRequest::STATUS_PENDING,
        ]);

        $this->withToken($this->supabaseToken([
            'sub' => $profile->supabase_user_id,
            'aud' => 'authenticated',
            'email' => 'buyer@example.com',
            'exp' => time() + 3600,
        ]))
            ->postJson('/api/seller-verification/request', [
                'business_name' => 'Another Store',
            ])
            ->assertUnprocessable();
    }

    public function test_only_admin_can_list_seller_verification_requests(): void
    {
        $profile = Profile::query()->create([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-123456789abc',
            'email' => 'buyer@example.com',
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ]);

        SellerVerificationRequest::query()->create([
            'profile_id' => $profile->id,
            'business_name' => 'Nexo Store',
            'status' => SellerVerificationRequest::STATUS_PENDING,
        ]);

        $this->withToken($this->supabaseToken([
            'sub' => $profile->supabase_user_id,
            'aud' => 'authenticated',
            'email' => 'buyer@example.com',
            'exp' => time() + 3600,
        ]))
            ->getJson('/api/admin/seller-verification-requests')
            ->assertForbidden();
    }

    public function test_admin_can_approve_seller_verification_request(): void
    {
        $buyer = Profile::query()->create([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-123456789abc',
            'email' => 'buyer@example.com',
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ]);
        $admin = Profile::query()->create([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-abcdefabcdef',
            'email' => 'admin@example.com',
            'role' => Profile::ROLE_ADMIN,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        $verificationRequest = SellerVerificationRequest::query()->create([
            'profile_id' => $buyer->id,
            'business_name' => 'Nexo Store',
            'status' => SellerVerificationRequest::STATUS_PENDING,
        ]);

        $this->withToken($this->supabaseToken([
            'sub' => $admin->supabase_user_id,
            'aud' => 'authenticated',
            'email' => 'admin@example.com',
            'exp' => time() + 3600,
        ]))
            ->patchJson('/api/admin/seller-verification-requests/'.$verificationRequest->id, [
                'status' => SellerVerificationRequest::STATUS_APPROVED,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', SellerVerificationRequest::STATUS_APPROVED)
            ->assertJsonPath('data.profile.role', Profile::ROLE_SELLER)
            ->assertJsonPath('data.profile.verification_status', Profile::VERIFICATION_APPROVED);

        $this->assertDatabaseHas('profiles', [
            'id' => $buyer->id,
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        $this->assertDatabaseHas('seller_verification_requests', [
            'id' => $verificationRequest->id,
            'status' => SellerVerificationRequest::STATUS_APPROVED,
            'reviewed_by' => $admin->id,
        ]);
    }

    public function test_admin_must_provide_rejection_reason_when_rejecting_request(): void
    {
        $buyer = Profile::query()->create([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-123456789abc',
            'email' => 'buyer@example.com',
            'role' => Profile::ROLE_BUYER,
            'verification_status' => Profile::VERIFICATION_PENDING,
        ]);
        $admin = Profile::query()->create([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-abcdefabcdef',
            'email' => 'admin@example.com',
            'role' => Profile::ROLE_ADMIN,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);
        $verificationRequest = SellerVerificationRequest::query()->create([
            'profile_id' => $buyer->id,
            'business_name' => 'Nexo Store',
            'status' => SellerVerificationRequest::STATUS_PENDING,
        ]);

        $this->withToken($this->supabaseToken([
            'sub' => $admin->supabase_user_id,
            'aud' => 'authenticated',
            'email' => 'admin@example.com',
            'exp' => time() + 3600,
        ]))
            ->patchJson('/api/admin/seller-verification-requests/'.$verificationRequest->id, [
                'status' => SellerVerificationRequest::STATUS_REJECTED,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('rejection_reason');
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
