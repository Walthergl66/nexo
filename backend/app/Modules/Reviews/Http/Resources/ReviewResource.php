<?php

namespace App\Modules\Reviews\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'rating'     => $this->rating,
            'body'       => $this->body,
            'created_at' => $this->created_at?->toISOString(),
            'author'     => $this->whenLoaded('profile', fn () => [
                'id'           => $this->profile->id,
                'display_name' => $this->profile->display_name
                    ?? trim(($this->profile->first_name ?? '') . ' ' . ($this->profile->last_name ?? ''))
                    ?: 'Comprador verificado',
                'avatar_url'   => $this->profile->avatar_url,
            ]),
        ];
    }
}
