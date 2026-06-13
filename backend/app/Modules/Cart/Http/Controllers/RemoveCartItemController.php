<?php

namespace App\Modules\Cart\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Profile;
use App\Modules\Cart\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RemoveCartItemController extends Controller
{
    public function __construct(private readonly CartService $service) {}

    public function __invoke(Request $request, CartItem $cartItem): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        $this->service->remove($profile, $cartItem);

        return response()->json(status: JsonResponse::HTTP_NO_CONTENT);
    }
}
