<?php

namespace App\Modules\Stores\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Modules\Stores\Http\Requests\Admin\UpdateStoreStatusRequest;
use App\Modules\Stores\Http\Resources\StoreResource;
use Illuminate\Http\JsonResponse;

class UpdateStoreStatusController extends Controller
{
    public function __invoke(UpdateStoreStatusRequest $request, Store $store): JsonResponse
    {
        $store->forceFill([
            'status' => $request->validated('status'),
        ])->save();

        return (new StoreResource($store->refresh()->load('profile')))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
