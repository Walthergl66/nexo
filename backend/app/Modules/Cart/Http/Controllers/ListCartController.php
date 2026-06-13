<?php

namespace App\Modules\Cart\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Cart\Http\Resources\CartItemResource;
use App\Modules\Cart\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListCartController extends Controller
{
    public function __construct(private readonly CartService $service) {}

    public function __invoke(Request $request): AnonymousResourceCollection
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        return CartItemResource::collection($this->service->items($profile));
    }
}
