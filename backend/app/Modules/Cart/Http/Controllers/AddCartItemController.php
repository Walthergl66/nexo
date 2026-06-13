<?php

namespace App\Modules\Cart\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Profile;
use App\Modules\Cart\Http\Requests\AddCartItemRequest;
use App\Modules\Cart\Http\Resources\CartItemResource;
use App\Modules\Cart\Services\CartService;
use Illuminate\Http\JsonResponse;

class AddCartItemController extends Controller
{
    public function __construct(private readonly CartService $service) {}

    public function __invoke(AddCartItemRequest $request): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');
        $product = Product::query()->findOrFail($request->validated('product_id'));

        $cartItem = $this->service->add($profile, $product, $request->integer('quantity'));

        return (new CartItemResource($cartItem))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }
}
