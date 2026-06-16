<?php

namespace App\Modules\Products\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Profile;
use App\Modules\Products\Http\Requests\UpdateProductRequest;
use App\Modules\Products\Http\Resources\ProductResource;
use App\Modules\Products\Services\ProductService;
use Illuminate\Http\JsonResponse;

class UpdateProductController extends Controller
{
    public function __construct(private readonly ProductService $service) {}

    public function __invoke(UpdateProductRequest $request, Product $product): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');
        $store = $product->store()->firstOrFail();

        abort_unless($profile->isAdmin() || ($profile->isVerifiedSeller() && $store->profile_id === $profile->id), 403);

        $product = $this->service->update($product, $request->validated());

        return (new ProductResource($product))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
