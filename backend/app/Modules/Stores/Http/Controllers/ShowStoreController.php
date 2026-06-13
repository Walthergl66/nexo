<?php

namespace App\Modules\Stores\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Modules\Stores\Http\Resources\StoreResource;
use Illuminate\Http\JsonResponse;

class ShowStoreController extends Controller
{
    public function __invoke(Store $store): JsonResponse
    {
        abort_unless($store->isActive(), 404);

        return (new StoreResource($store->load('profile')))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
