<?php

namespace App\Modules\Profiles\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Profiles\Http\Requests\CompleteProfileRequest;
use App\Modules\Profiles\Http\Resources\ProfileResource;
use Illuminate\Http\JsonResponse;

class CompleteProfileController extends Controller
{
    public function __invoke(CompleteProfileRequest $request): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');
        $validated = $request->validated();

        $profile->forceFill([
            ...$validated,
            'display_name' => trim($validated['first_name'].' '.$validated['last_name']),
        ])->save();

        return (new ProfileResource($profile->refresh()))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
