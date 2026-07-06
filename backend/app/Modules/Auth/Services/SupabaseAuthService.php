<?php

namespace App\Modules\Auth\Services;

use App\Models\Profile;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

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

        $algorithm = $header['alg'] ?? null;

        if (! is_string($algorithm)) {
            throw new AuthenticationException('Unsupported token algorithm.');
        }

        if ($algorithm === 'HS256') {
            $this->validateHs256Signature($encodedHeader, $encodedPayload, $encodedSignature);
        } elseif (in_array($algorithm, ['RS256', 'ES256'], true)) {
            $this->validateJwksSignature($algorithm, $header, $encodedHeader, $encodedPayload, $encodedSignature);
        } else {
            throw new AuthenticationException('Unsupported token algorithm.');
        }

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

        $email = Arr::get($claims, 'email');
        $metadata = Arr::get($claims, 'user_metadata', []);

        /** @var Profile|null $profile */
        $profile = Profile::query()
            ->where('supabase_user_id', $supabaseUserId)
            ->first();

        if ($profile === null) {
            return DB::transaction(function () use ($email, $metadata, $supabaseUserId): Profile {
                /** @var Profile $newProfile */
                $newProfile = Profile::query()->create(
                    [
                        'supabase_user_id' => $supabaseUserId,
                        'email' => is_string($email) ? $email : null,
                        'display_name' => $this->displayNameFromMetadata($metadata),
                        ...$this->profileFieldsFromMetadata($metadata),
                        'role' => Profile::ROLE_BUYER,
                        'verification_status' => Profile::VERIFICATION_PENDING,
                        'metadata' => is_array($metadata) ? $metadata : [],
                    ],
                );

                return $newProfile;
            });
        }

        $updates = [];

        if (is_string($email) && $email !== '' && $profile->email !== $email) {
            $updates['email'] = $email;
        }

        foreach ($this->profileFieldsFromMetadata($metadata) as $key => $value) {
            if ($value !== null && blank($profile->{$key})) {
                $updates[$key] = $value;
            }
        }

        if ($updates !== []) {
            $profile->forceFill($updates)->save();
        }

        return $profile;
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
     * @param  array<string, mixed>  $header
     */
    private function validateJwksSignature(
        string $algorithm,
        array $header,
        string $encodedHeader,
        string $encodedPayload,
        string $encodedSignature
    ): void {
        $keyId = $header['kid'] ?? null;

        if (! is_string($keyId) || $keyId === '') {
            throw new AuthenticationException('Token key id is missing.');
        }

        $jwk = $this->findJwk($keyId, $algorithm);
        $publicKey = $this->publicKeyFromJwk($jwk);
        $signature = $this->base64UrlDecode($encodedSignature);

        if ($algorithm === 'ES256') {
            $signature = $this->ecdsaRawSignatureToDer($signature);
        }

        $result = openssl_verify(
            $encodedHeader.'.'.$encodedPayload,
            $signature,
            $publicKey,
            $algorithm === 'RS256' ? OPENSSL_ALGO_SHA256 : 'sha256',
        );

        if ($result !== 1) {
            throw new AuthenticationException('Invalid token signature.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function findJwk(string $keyId, string $algorithm): array
    {
        $keys = $this->jwks();

        foreach ($keys as $key) {
            if (
                is_array($key)
                && ($key['kid'] ?? null) === $keyId
                && (($key['alg'] ?? $algorithm) === $algorithm)
            ) {
                /** @var array<string, mixed> $key */
                return $key;
            }
        }

        Cache::forget($this->jwksCacheKey());

        foreach ($this->jwks() as $key) {
            if (
                is_array($key)
                && ($key['kid'] ?? null) === $keyId
                && (($key['alg'] ?? $algorithm) === $algorithm)
            ) {
                /** @var array<string, mixed> $key */
                return $key;
            }
        }

        throw new AuthenticationException('Supabase signing key was not found.');
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function jwks(): array
    {
        return Cache::remember($this->jwksCacheKey(), now()->addHour(), function (): array {
            $supabaseUrl = rtrim((string) config('supabase.url'), '/');

            if ($supabaseUrl === '') {
                throw new AuthenticationException('Supabase URL is not configured.');
            }

            $request = Http::timeout(5)->acceptJson();

            if (! (bool) config('supabase.http_verify_ssl', true)) {
                $request = $request->withoutVerifying();
            }

            $response = $request->get($supabaseUrl.'/auth/v1/.well-known/jwks.json');

            if (! $response->successful()) {
                throw new AuthenticationException('Could not fetch Supabase signing keys.');
            }

            $keys = $response->json('keys');

            if (! is_array($keys)) {
                throw new AuthenticationException('Supabase signing keys response is invalid.');
            }

            return array_values(array_filter($keys, fn (mixed $key): bool => is_array($key)));
        });
    }

    private function jwksCacheKey(): string
    {
        return 'supabase:jwks:'.sha1((string) config('supabase.url'));
    }

    /**
     * @param  array<string, mixed>  $jwk
     */
    private function publicKeyFromJwk(array $jwk): string
    {
        return match ($jwk['kty'] ?? null) {
            'RSA' => $this->rsaPublicKeyFromJwk($jwk),
            'EC' => $this->ecPublicKeyFromJwk($jwk),
            default => throw new AuthenticationException('Unsupported Supabase signing key type.'),
        };
    }

    /**
     * @param  array<string, mixed>  $jwk
     */
    private function rsaPublicKeyFromJwk(array $jwk): string
    {
        if (! is_string($jwk['n'] ?? null) || ! is_string($jwk['e'] ?? null)) {
            throw new AuthenticationException('Invalid Supabase RSA signing key.');
        }

        $modulus = $this->asn1Integer($this->base64UrlDecode($jwk['n']));
        $exponent = $this->asn1Integer($this->base64UrlDecode($jwk['e']));
        $rsaPublicKey = $this->asn1Sequence($modulus.$exponent);
        $algorithm = $this->asn1Sequence($this->asn1ObjectIdentifier('1.2.840.113549.1.1.1').$this->asn1Null());
        $subjectPublicKeyInfo = $this->asn1Sequence($algorithm.$this->asn1BitString($rsaPublicKey));

        return $this->pem('PUBLIC KEY', $subjectPublicKeyInfo);
    }

    /**
     * @param  array<string, mixed>  $jwk
     */
    private function ecPublicKeyFromJwk(array $jwk): string
    {
        if (($jwk['crv'] ?? null) !== 'P-256' || ! is_string($jwk['x'] ?? null) || ! is_string($jwk['y'] ?? null)) {
            throw new AuthenticationException('Invalid Supabase EC signing key.');
        }

        $point = "\x04".$this->base64UrlDecode($jwk['x']).$this->base64UrlDecode($jwk['y']);
        $algorithm = $this->asn1Sequence(
            $this->asn1ObjectIdentifier('1.2.840.10045.2.1').
            $this->asn1ObjectIdentifier('1.2.840.10045.3.1.7'),
        );
        $subjectPublicKeyInfo = $this->asn1Sequence($algorithm.$this->asn1BitString($point));

        return $this->pem('PUBLIC KEY', $subjectPublicKeyInfo);
    }

    private function ecdsaRawSignatureToDer(string $signature): string
    {
        if (strlen($signature) !== 64) {
            throw new AuthenticationException('Invalid ECDSA token signature.');
        }

        return $this->asn1Sequence(
            $this->asn1Integer(substr($signature, 0, 32)).
            $this->asn1Integer(substr($signature, 32, 32)),
        );
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

    private function asn1Sequence(string $value): string
    {
        return "\x30".$this->asn1Length(strlen($value)).$value;
    }

    private function asn1Integer(string $value): string
    {
        $value = ltrim($value, "\x00");
        $value = $value === '' ? "\x00" : $value;

        if ((ord($value[0]) & 0x80) !== 0) {
            $value = "\x00".$value;
        }

        return "\x02".$this->asn1Length(strlen($value)).$value;
    }

    private function asn1BitString(string $value): string
    {
        return "\x03".$this->asn1Length(strlen($value) + 1)."\x00".$value;
    }

    private function asn1Null(): string
    {
        return "\x05\x00";
    }

    private function asn1ObjectIdentifier(string $oid): string
    {
        $parts = array_map('intval', explode('.', $oid));
        $value = chr(($parts[0] * 40) + $parts[1]);

        foreach (array_slice($parts, 2) as $part) {
            $encoded = chr($part & 0x7f);
            $part >>= 7;

            while ($part > 0) {
                $encoded = chr(($part & 0x7f) | 0x80).$encoded;
                $part >>= 7;
            }

            $value .= $encoded;
        }

        return "\x06".$this->asn1Length(strlen($value)).$value;
    }

    private function asn1Length(int $length): string
    {
        if ($length < 128) {
            return chr($length);
        }

        $bytes = '';

        while ($length > 0) {
            $bytes = chr($length & 0xff).$bytes;
            $length >>= 8;
        }

        return chr(0x80 | strlen($bytes)).$bytes;
    }

    private function pem(string $type, string $der): string
    {
        return "-----BEGIN {$type}-----\n".
            chunk_split(base64_encode($der), 64, "\n").
            "-----END {$type}-----\n";
    }

    private function displayNameFromMetadata(mixed $metadata): ?string
    {
        if (! is_array($metadata)) {
            return null;
        }

        $name = $metadata['name'] ?? $metadata['full_name'] ?? $metadata['display_name'] ?? null;

        return is_string($name) && $name !== '' ? $name : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function profileFieldsFromMetadata(mixed $metadata): array
    {
        if (! is_array($metadata)) {
            return [];
        }

        $firstName = $this->stringFromMetadata($metadata, 'first_name');
        $lastName = $this->stringFromMetadata($metadata, 'last_name');

        return [
            'national_id' => preg_replace('/\D+/', '', $this->stringFromMetadata($metadata, 'national_id') ?? '') ?: null,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'age' => is_numeric($metadata['age'] ?? null) ? (int) $metadata['age'] : null,
            'gender' => $this->stringFromMetadata($metadata, 'gender'),
            'address' => $this->stringFromMetadata($metadata, 'address'),
            'phone' => $this->stringFromMetadata($metadata, 'phone'),
            'display_name' => trim(($firstName ?? '').' '.($lastName ?? '')) ?: $this->displayNameFromMetadata($metadata),
        ];
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function stringFromMetadata(array $metadata, string $key): ?string
    {
        $value = $metadata[$key] ?? null;

        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }
}
