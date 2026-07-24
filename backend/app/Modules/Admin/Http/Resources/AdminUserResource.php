<?php

namespace App\Modules\Admin\Http\Resources;

use App\Models\Profile;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Un usuario visto por un administrador. A diferencia del perfil público, aquí
 * SÍ se exponen los datos de contacto e identidad: el admin los necesita para
 * moderar, y es un rol de confianza. Este recurso NO debe usarse en endpoints
 * que no sean admin.
 *
 * @mixin Profile
 */
class AdminUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Store|null $store */
        $store = $this->relationLoaded('store') ? $this->store : null;

        return [
            'id' => $this->id,
            'display_name' => $this->display_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'national_id' => $this->national_id,
            'role' => $this->role,
            'verification_status' => $this->verification_status,
            'store' => $store instanceof Store ? [
                'id' => $store->id,
                'slug' => $store->slug,
                'name' => $store->name,
                'status' => $store->status,
            ] : null,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
