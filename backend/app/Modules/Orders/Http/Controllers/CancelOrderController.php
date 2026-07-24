<?php

namespace App\Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Profile;
use App\Modules\Orders\Http\Resources\OrderResource;
use App\Modules\Orders\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CancelOrderController extends Controller
{
    public function __construct(private readonly OrderService $service) {}

    public function __invoke(Request $request, Order $order): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        // 404 (no 403) si no es su pedido: no confirmamos que exista para otro.
        abort_unless($order->profile_id === $profile->id, 404);

        $order = $this->service->cancelUnpaidOrder($order);

        return (new OrderResource($order->load('items')))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
