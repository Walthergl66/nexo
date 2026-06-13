<?php

namespace App\Modules\Stores\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Modules\Stores\Http\Resources\StoreResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListStoresController extends Controller
{
    public function __invoke(): AnonymousResourceCollection
    {
        $stores = Store::query()
            ->with('profile')
            ->where('status', Store::STATUS_ACTIVE)
            ->latest()
            ->paginate(20);

        return StoreResource::collection($stores);
    }
}
