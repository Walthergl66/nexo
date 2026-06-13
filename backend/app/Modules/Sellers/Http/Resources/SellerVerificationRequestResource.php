<?php

namespace App\Modules\Sellers\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SellerVerificationRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'profile_id' => $this->profile_id,
            'business_name' => $this->business_name,
            'business_description' => $this->business_description,
            'document_type' => $this->document_type,
            'document_number' => $this->document_number,
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'profile' => $this->whenLoaded('profile', fn () => [
                'id' => $this->profile->id,
                'supabase_user_id' => $this->profile->supabase_user_id,
                'email' => $this->profile->email,
                'display_name' => $this->profile->display_name,
                'role' => $this->profile->role,
                'verification_status' => $this->profile->verification_status,
            ]),
            'reviewer' => $this->whenLoaded('reviewer', fn () => $this->reviewer ? [
                'id' => $this->reviewer->id,
                'email' => $this->reviewer->email,
                'display_name' => $this->reviewer->display_name,
            ] : null),
        ];
    }
}
