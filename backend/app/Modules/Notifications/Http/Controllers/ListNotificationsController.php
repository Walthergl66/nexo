<?php

namespace App\Modules\Notifications\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Notifications\Http\Resources\NotificationResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListNotificationsController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        $notifications = $profile->notifications()
            ->latest()
            ->paginate(30);

        return NotificationResource::collection($notifications)
            ->additional(['unread_count' => $profile->notifications()->unread()->count()]);
    }
}
