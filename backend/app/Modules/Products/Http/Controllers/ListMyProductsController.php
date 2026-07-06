<?php

namespace App\Modules\Products\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Products\Http\Resources\ProductResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;

class ListMyProductsController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');
        $store = $profile->store()->first();

        if (! $store) {
            return ProductResource::collection(new LengthAwarePaginator([], 0, 20));
        }

        $products = $store->products()
            ->with(['store', 'category', 'images'])
            ->latest()
            ->paginate(20);

        return ProductResource::collection($products);
    }
}
