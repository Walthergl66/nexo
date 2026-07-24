<?php

namespace App\Modules\Profiles\Http\Resources;

use App\Models\Profile;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Perfil de un usuario visto por OTRO usuario (búsqueda / visitar perfil).
 *
 * Solo campos seguros: nunca correo, teléfono, cédula, dirección, edad ni
 * género. Esos son PII y no salen de aquí bajo ningún concepto. Lo público es
 * el nombre para mostrar, el avatar, el rol, el badge de verificado y —si es
 * vendedor— su tienda.
 *
 * @mixin Profile
 */
class PublicProfileResource extends JsonResource
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
            'avatar_url' => $this->avatar_url,
            'role' => $this->role,
            // Solo un booleano: no exponemos "rejected"/"suspended" (estado de
            // moderación) al resto de los usuarios.
            'is_verified' => $this->verification_status === Profile::VERIFICATION_APPROVED,
            'store' => $store instanceof Store ? [
                'id' => $store->id,
                'slug' => $store->slug,
                'name' => $store->name,
                'description' => $store->description,
                'logo_url' => $store->logo_url,
                'banner_url' => $store->banner_url,
                'status' => $store->status,
            ] : null,
        ];
    }
}
