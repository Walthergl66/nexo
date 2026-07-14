<?php

namespace App\Modules\Notifications\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Profile;
use App\Modules\Notifications\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarkNotificationReadController extends Controller
{
    public function __invoke(Request $request, Notification $notification): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        abort_unless($notification->profile_id === $profile->id, 404);

        if ($notification->read_at === null) {
            $notification->forceFill(['read_at' => now()])->save();
        }

        return (new NotificationResource($notification))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
