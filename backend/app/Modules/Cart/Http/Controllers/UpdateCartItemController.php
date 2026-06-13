<?php

namespace App\Modules\Cart\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Profile;
use App\Modules\Cart\Http\Requests\UpdateCartItemRequest;
use App\Modules\Cart\Http\Resources\CartItemResource;
use App\Modules\Cart\Services\CartService;
use Illuminate\Http\JsonResponse;

class UpdateCartItemController extends Controller
{
    public function __construct(private readonly CartService $service) {}

    public function __invoke(UpdateCartItemRequest $request, CartItem $cartItem): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        $cartItem = $this->service->update($profile, $cartItem, $request->integer('quantity'));

        return (new CartItemResource($cartItem))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
