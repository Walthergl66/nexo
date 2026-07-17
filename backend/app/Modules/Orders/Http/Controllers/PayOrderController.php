<?php

namespace App\Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Profile;
use App\Modules\Orders\Http\Resources\OrderResource;
use App\Modules\Orders\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayOrderController extends Controller
{
    public function __construct(private readonly OrderService $service) {}

    public function __invoke(Request $request, Order $order): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        abort_unless($order->profile_id === $profile->id, 404);

        $order = $this->service->markAsPaid($order);

        return (new OrderResource($order))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
