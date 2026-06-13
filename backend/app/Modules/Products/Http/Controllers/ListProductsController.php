<?php

namespace App\Modules\Products\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Store;
use App\Modules\Products\Http\Resources\ProductResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListProductsController extends Controller
{
    public function __invoke(): AnonymousResourceCollection
    {
        $products = Product::query()
            ->with(['store', 'category', 'images'])
            ->where('status', Product::STATUS_ACTIVE)
            ->whereHas('store', fn ($query) => $query->where('status', Store::STATUS_ACTIVE))
            ->latest()
            ->paginate(20);

        return ProductResource::collection($products);
    }
}
