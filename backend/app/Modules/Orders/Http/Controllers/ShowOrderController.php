<?php

namespace App\Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Profile;
use App\Modules\Orders\Http\Resources\OrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShowOrderController extends Controller
{
    public function __invoke(Request $request, Order $order): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        abort_unless($profile->isAdmin() || $order->profile_id === $profile->id, 404);

        return (new OrderResource($order->load('items')))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
