<?php

namespace App\Modules\Auth\Services;

use App\Models\Profile;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class SupabaseAuthService
{
    /**
     * @return array<string, mixed>
     */
    public function validateAccessToken(string $token): array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw new AuthenticationException('Invalid bearer token.');
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;

        $header = $this->decodeJsonSegment($encodedHeader);
        $payload = $this->decodeJsonSegment($encodedPayload);

        $algorithm = (string) config('supabase.jwt_algorithm', 'HS256');

        if (($header['alg'] ?? null) !== $algorithm) {
            throw new AuthenticationException('Unsupported token algorithm.');
        }

        if ($algorithm !== 'HS256') {
            throw new AuthenticationException('Configured Supabase JWT algorithm is not implemented.');
        }

        $this->validateHs256Signature($encodedHeader, $encodedPayload, $encodedSignature);
        $this->validateClaims($payload);

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    public function syncProfileFromClaims(array $claims): Profile
    {
        $supabaseUserId = (string) ($claims['sub'] ?? '');

        if ($supabaseUserId === '') {
            throw new AuthenticationException('Supabase user id is missing.');
        }

        return DB::transaction(function () use ($claims, $supabaseUserId): Profile {
            $email = Arr::get($claims, 'email');
            $metadata = Arr::get($claims, 'user_metadata', []);

            /** @var Profile $profile */
            $profile = Profile::query()->firstOrCreate(
                ['supabase_user_id' => $supabaseUserId],
                [
                    'email' => is_string($email) ? $email : null,
                    'display_name' => $this->displayNameFromMetadata($metadata),
                    'role' => Profile::ROLE_BUYER,
                    'verification_status' => Profile::VERIFICATION_PENDING,
                    'metadata' => is_array($metadata) ? $metadata : [],
                ],
            );

            if (is_string($email) && $email !== '' && $profile->email !== $email) {
                $profile->forceFill(['email' => $email])->save();
            }

            return $profile->refresh();
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJsonSegment(string $segment): array
    {
        $decoded = $this->base64UrlDecode($segment);
        $data = json_decode($decoded, true);

        if (! is_array($data)) {
            throw new AuthenticationException('Invalid token segment.');
        }

        return $data;
    }

    private function validateHs256Signature(string $encodedHeader, string $encodedPayload, string $encodedSignature): void
    {
        $secret = (string) config('supabase.jwt_secret');

        if ($secret === '') {
            throw new AuthenticationException('Supabase JWT secret is not configured.');
        }

        $expected = hash_hmac('sha256', $encodedHeader.'.'.$encodedPayload, $secret, true);
        $actual = $this->base64UrlDecode($encodedSignature);

        if (! hash_equals($expected, $actual)) {
            throw new AuthenticationException('Invalid token signature.');
        }
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    private function validateClaims(array $claims): void
    {
        $now = time();

        if (($claims['sub'] ?? '') === '') {
            throw new AuthenticationException('Token subject is missing.');
        }

        if (! isset($claims['exp'])) {
            throw new AuthenticationException('Token expiration is missing.');
        }

        if ((int) $claims['exp'] <= $now) {
            throw new AuthenticationException('Token has expired.');
        }

        if (isset($claims['nbf']) && (int) $claims['nbf'] > $now) {
            throw new AuthenticationException('Token is not active yet.');
        }

        $expectedAudience = config('supabase.auth_audience');

        if ($expectedAudience !== null && $expectedAudience !== '') {
            $audience = $claims['aud'] ?? null;
            $audiences = is_array($audience) ? $audience : [$audience];

            if (! in_array($expectedAudience, $audiences, true)) {
                throw new AuthenticationException('Invalid token audience.');
            }
        }
    }

    private function base64UrlDecode(string $value): string
    {
        $padding = strlen($value) % 4;

        if ($padding > 0) {
            $value .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        if ($decoded === false) {
            throw new AuthenticationException('Invalid token encoding.');
        }

        return $decoded;
    }

    private function displayNameFromMetadata(mixed $metadata): ?string
    {
        if (! is_array($metadata)) {
            return null;
        }

        $name = $metadata['name'] ?? $metadata['full_name'] ?? $metadata['display_name'] ?? null;

        return is_string($name) && $name !== '' ? $name : null;
    }
}
