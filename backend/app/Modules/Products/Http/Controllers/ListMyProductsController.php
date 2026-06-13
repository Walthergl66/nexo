<?php

namespace App\Modules\Products\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Products\Http\Resources\ProductResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListMyProductsController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');
        $store = $profile->store()->firstOrFail();

        $products = $store->products()
            ->with(['store', 'category', 'images'])
            ->latest()
            ->paginate(20);

        return ProductResource::collection($products);
    }
}
