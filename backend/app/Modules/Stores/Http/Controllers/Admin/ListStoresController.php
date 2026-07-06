<?php

namespace App\Modules\Stores\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\Store;
use App\Modules\Stores\Http\Resources\StoreResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListStoresController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        abort_unless($profile->isAdmin(), 403);

        $stores = Store::query()
            ->with('profile')
            ->latest()
            ->get();

        return StoreResource::collection($stores);
    }
}
