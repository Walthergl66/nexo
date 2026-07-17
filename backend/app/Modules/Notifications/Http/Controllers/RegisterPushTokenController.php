<?php

namespace App\Modules\Notifications\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegisterPushTokenController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        $validated = $request->validate([
            'push_token' => ['present', 'nullable', 'string', 'max:255'],
        ]);

        $profile->forceFill(['push_token' => $validated['push_token']])->save();

        return response()->json(['data' => ['registered' => $validated['push_token'] !== null]]);
    }
}
