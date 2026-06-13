<?php

namespace App\Modules\Cart\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Cart\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClearCartController extends Controller
{
    public function __construct(private readonly CartService $service) {}

    public function __invoke(Request $request): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        $this->service->clear($profile);

        return response()->json(status: JsonResponse::HTTP_NO_CONTENT);
    }
}
