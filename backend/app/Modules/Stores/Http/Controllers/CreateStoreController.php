<?php

namespace App\Modules\Stores\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Stores\Http\Requests\StoreRequest;
use App\Modules\Stores\Http\Resources\StoreResource;
use App\Modules\Stores\Services\StoreService;
use Illuminate\Http\JsonResponse;

class CreateStoreController extends Controller
{
    public function __construct(private readonly StoreService $service) {}

    public function __invoke(StoreRequest $request): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        $store = $this->service->create($profile, $request->validated());

        return (new StoreResource($store))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }
}
