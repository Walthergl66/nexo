<?php

namespace App\Modules\Notifications\Services;

use App\Models\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ExpoPushSender
{
    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    /**
     * Deliver a persisted notification to the owner's device via Expo, when a
     * push token is available. Failures never bubble up: push is best-effort.
     */
    public function send(Notification $notification): void
    {
        $token = $notification->profile?->push_token;

        if (! is_string($token) || ! $this->isExpoToken($token)) {
            return;
        }

        try {
            Http::acceptJson()
                ->timeout(5)
                ->post(self::ENDPOINT, [
                    'to' => $token,
                    'title' => $notification->title,
                    'body' => $notification->body,
                    'data' => array_merge($notification->data ?? [], [
                        'notification_id' => $notification->id,
                        'type' => $notification->type,
                    ]),
                    'sound' => 'default',
                ]);
        } catch (Throwable $exception) {
            Log::warning('Expo push delivery failed', [
                'notification_id' => $notification->id,
                'message' => $exception->getMessage(),
            ]);
        }
    }

    private function isExpoToken(string $token): bool
    {
        return str_starts_with($token, 'ExponentPushToken[')
            || str_starts_with($token, 'ExpoPushToken[');
    }
}
