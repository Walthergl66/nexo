<?php

namespace App\Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Profile;
use App\Modules\Orders\Http\Requests\UpdateSaleStatusRequest;
use App\Modules\Orders\Http\Resources\SaleResource;
use App\Modules\Orders\Services\FulfillmentService;
use Illuminate\Http\JsonResponse;

class UpdateSaleStatusController extends Controller
{
    public function __construct(private readonly FulfillmentService $service) {}

    public function __invoke(UpdateSaleStatusRequest $request, OrderItem $orderItem): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        $item = $this->service->advance($orderItem, $profile, $request->string('status')->toString());

        return (new SaleResource($item->load(['order.profile', 'store'])))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
