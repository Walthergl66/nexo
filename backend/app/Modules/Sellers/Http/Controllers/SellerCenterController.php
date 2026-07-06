<?php

namespace App\Modules\Sellers\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\Store;
use App\Modules\Products\Http\Resources\ProductResource;
use App\Modules\Profiles\Http\Resources\ProfileResource;
use App\Modules\Stores\Http\Resources\StoreResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SellerCenterController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');
        $store = $profile->store()->with('profile')->first();
        $products = $store
            ? $store->products()->with(['store', 'category', 'images'])->latest()->get()
            : collect();

        return response()->json([
            'data' => [
                'state' => $this->stateFor($profile, $store, $products->isNotEmpty()),
                'profile' => (new ProfileResource($profile))->resolve($request),
                'store' => $store ? (new StoreResource($store))->resolve($request) : null,
                'products' => ProductResource::collection($products)->resolve($request),
            ],
        ]);
    }

    private function stateFor(Profile $profile, ?Store $store, bool $hasProducts): string
    {
        if ($profile->role === Profile::ROLE_BUYER && $profile->verification_status === Profile::VERIFICATION_PENDING) {
            return 'verification_required';
        }

        if ($profile->verification_status === Profile::VERIFICATION_PENDING) {
            return 'verification_pending';
        }

        if ($profile->verification_status === Profile::VERIFICATION_REJECTED) {
            return 'verification_rejected';
        }

        if ($profile->verification_status === Profile::VERIFICATION_SUSPENDED) {
            return 'seller_suspended';
        }

        if (! $profile->isVerifiedSeller()) {
            return 'verification_required';
        }

        if (! $store) {
            return 'store_required';
        }

        if ($store->status !== Store::STATUS_ACTIVE) {
            return 'store_suspended';
        }

        return $hasProducts ? 'catalog_ready' : 'catalog_required';
    }
}
