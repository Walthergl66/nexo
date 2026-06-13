<?php

namespace App\Modules\Profiles\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckProfileAvailabilityController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['nullable', 'email:rfc', 'max:255'],
            'national_id' => ['nullable', 'string', 'max:20'],
        ]);

        $email = isset($validated['email']) ? strtolower($validated['email']) : null;
        $nationalId = isset($validated['national_id']) ? preg_replace('/\D+/', '', $validated['national_id']) : null;

        return response()->json([
            'data' => [
                'email_available' => $email === null || ! Profile::query()->where('email', $email)->exists(),
                'national_id_available' => $nationalId === null || ! Profile::query()->where('national_id', $nationalId)->exists(),
            ],
        ]);
    }
}
