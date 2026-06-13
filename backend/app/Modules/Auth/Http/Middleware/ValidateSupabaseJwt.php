<?php

namespace App\Modules\Auth\Http\Middleware;

use App\Modules\Auth\Services\SupabaseAuthService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateSupabaseJwt
{
    public function __construct(private readonly SupabaseAuthService $authService) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if ($token === null || $token === '') {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $claims = $this->authService->validateAccessToken($token);
        $profile = $this->authService->syncProfileFromClaims($claims);

        $request->attributes->set('supabase_claims', $claims);
        $request->attributes->set('profile', $profile);

        return $next($request);
    }
}
