<?php

namespace App\Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Orders\Http\Resources\OrderResource;
use App\Modules\Orders\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreateOrderFromCartController extends Controller
{
    public function __construct(private readonly OrderService $service) {}

    public function __invoke(Request $request): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        $order = $this->service->createFromCart($profile);

        return (new OrderResource($order))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }
}
