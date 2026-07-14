<?php

namespace App\Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Profile;
use App\Modules\Orders\Http\Resources\SaleResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;

class ListSellerSalesController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');
        $store = $profile->store()->first();

        if (! $store) {
            return SaleResource::collection(new LengthAwarePaginator([], 0, 20));
        }

        // Solo ventas ya pagadas: son las que el vendedor puede gestionar.
        $sales = OrderItem::query()
            ->where('store_id', $store->id)
            ->whereHas('order', fn ($query) => $query->where('payment_status', 'paid'))
            ->with(['order.profile', 'store'])
            ->latest()
            ->paginate(20);

        return SaleResource::collection($sales);
    }
}
