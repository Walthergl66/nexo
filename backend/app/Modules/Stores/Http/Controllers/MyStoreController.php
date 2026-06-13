<?php

namespace App\Modules\Stores\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Stores\Http\Resources\StoreResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MyStoreController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');
        $store = $profile->store()->with('profile')->firstOrFail();

        return (new StoreResource($store))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
