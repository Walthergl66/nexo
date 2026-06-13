<?php

namespace App\Modules\Products\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Products\Http\Requests\ProductRequest;
use App\Modules\Products\Http\Resources\ProductResource;
use App\Modules\Products\Services\ProductService;
use Illuminate\Http\JsonResponse;

class CreateProductController extends Controller
{
    public function __construct(private readonly ProductService $service) {}

    public function __invoke(ProductRequest $request): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');
        $store = $profile->store()->firstOrFail();

        abort_unless($profile->isVerifiedSeller() && $store->profile_id === $profile->id, 403);

        $product = $this->service->create($store, $request->validated());

        return (new ProductResource($product))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }
}
