<?php

namespace App\Modules\Products\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeleteProductController extends Controller
{
    public function __invoke(Request $request, Product $product): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');
        $store = $product->store()->firstOrFail();

        abort_unless($profile->isAdmin() || ($profile->isVerifiedSeller() && $store->profile_id === $profile->id), 403);

        $product->images()->delete();
        $product->delete();

        return response()->json(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
