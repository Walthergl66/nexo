<?php

namespace App\Modules\Profiles\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'supabase_user_id' => $this->supabase_user_id,
            'email' => $this->email,
            'display_name' => $this->display_name,
            'avatar_url' => $this->avatar_url,
            'role' => $this->role,
            'verification_status' => $this->verification_status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
