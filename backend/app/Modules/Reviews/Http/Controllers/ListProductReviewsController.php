<?php

namespace App\Modules\Reviews\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Modules\Reviews\Http\Resources\ReviewResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListProductReviewsController extends Controller
{
    public function __invoke(Product $product): AnonymousResourceCollection
    {
        $reviews = $product->reviews()
            ->with('profile')
            ->paginate(20);

        return ReviewResource::collection($reviews);
    }
}
