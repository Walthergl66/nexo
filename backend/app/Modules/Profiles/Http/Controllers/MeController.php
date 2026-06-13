<?php

namespace App\Modules\Profiles\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Profiles\Http\Resources\ProfileResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        return (new ProfileResource($profile))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
