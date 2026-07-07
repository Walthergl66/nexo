<?php

namespace App\Modules\Stores\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeleteStoreController extends Controller
{
    public function __invoke(Request $request, Store $store): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        abort_unless($profile->isAdmin(), 403);

        $store->delete();

        return response()->json(status: JsonResponse::HTTP_NO_CONTENT);
    }
}
