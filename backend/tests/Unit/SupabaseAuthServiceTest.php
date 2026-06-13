<?php

namespace Tests\Unit;

use App\Modules\Auth\Services\SupabaseAuthService;
use Illuminate\Auth\AuthenticationException;
use PHPUnit\Framework\TestCase;

class SupabaseAuthServiceTest extends TestCase
{
    public function test_it_rejects_malformed_tokens(): void
    {
        $service = new SupabaseAuthService;

        $this->expectException(AuthenticationException::class);

        $service->validateAccessToken('not-a-jwt');
    }
}
