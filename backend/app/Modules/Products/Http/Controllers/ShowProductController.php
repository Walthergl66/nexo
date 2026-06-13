<?php

namespace App\Modules\Products\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Store;
use App\Modules\Products\Http\Resources\ProductResource;
use Illuminate\Http\JsonResponse;

class ShowProductController extends Controller
{
    public function __invoke(Product $product): JsonResponse
    {
        abort_unless($product->status === Product::STATUS_ACTIVE, 404);
        abort_unless($product->store()->where('status', Store::STATUS_ACTIVE)->exists(), 404);

        return (new ProductResource($product->load(['store', 'category', 'images'])))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
