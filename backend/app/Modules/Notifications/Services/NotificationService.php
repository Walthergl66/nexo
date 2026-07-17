<?php

namespace App\Modules\Notifications\Services;

use App\Models\Notification;
use App\Models\Profile;

class NotificationService
{
    public function __construct(private readonly ExpoPushSender $push) {}

    /**
     * Persist a notification for a profile and best-effort deliver it via push.
     *
     * @param  array<string, mixed>  $data
     */
    public function notify(Profile $profile, string $type, string $title, string $body, array $data = []): Notification
    {
        /** @var Notification $notification */
        $notification = $profile->notifications()->create([
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);

        $notification->setRelation('profile', $profile);
        $this->push->send($notification);

        return $notification;
    }
}
