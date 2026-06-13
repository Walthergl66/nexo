<?php

namespace App\Modules\Profiles\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Profiles\Services\IdentityLookupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LookupIdentityController extends Controller
{
    public function __construct(private readonly IdentityLookupService $service) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identificacion' => ['required', 'string', 'size:10'],
        ]);

        $identity = $this->service->lookup($validated['identificacion']);

        return response()->json([
            'data' => [
                'national_id' => $identity['national_id'],
                'first_name' => $identity['first_name'],
                'last_name' => $identity['last_name'],
                'age' => $identity['age'],
                'gender' => $identity['gender'],
            ],
        ]);
    }
}
