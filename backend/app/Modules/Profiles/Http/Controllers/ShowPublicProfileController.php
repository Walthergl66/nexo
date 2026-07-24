<?php

namespace App\Modules\Profiles\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Profiles\Http\Resources\PublicProfileResource;
use Illuminate\Http\JsonResponse;

class ShowPublicProfileController extends Controller
{
    public function __invoke(Profile $profile): JsonResponse
    {
        return (new PublicProfileResource($profile->load('store')))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
