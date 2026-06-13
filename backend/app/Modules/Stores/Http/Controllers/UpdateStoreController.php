<?php

namespace App\Modules\Stores\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Modules\Stores\Http\Requests\UpdateStoreRequest;
use App\Modules\Stores\Http\Resources\StoreResource;
use App\Modules\Stores\Services\StoreService;
use Illuminate\Http\JsonResponse;

class UpdateStoreController extends Controller
{
    public function __construct(private readonly StoreService $service) {}

    public function __invoke(UpdateStoreRequest $request, Store $store): JsonResponse
    {
        $store = $this->service->update($store, $request->validated());

        return (new StoreResource($store))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
