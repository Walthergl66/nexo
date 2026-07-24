<?php

namespace App\Modules\Profiles\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Profiles\Http\Resources\PublicProfileResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SearchUsersController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
        ]);

        $query = trim((string) ($validated['q'] ?? ''));

        // Menos de 2 caracteres devuelve vacío: evita listar a media base con
        // una sola letra.
        if (mb_strlen($query) < 2) {
            return PublicProfileResource::collection([]);
        }

        /** @var Profile|null $me */
        $me = $request->attributes->get('profile');
        $term = '%'.mb_strtolower($query).'%';

        $profiles = Profile::query()
            ->with('store')
            ->when($me instanceof Profile, fn ($builder) => $builder->whereKeyNot($me->id))
            ->where(function ($builder) use ($term): void {
                // Por nombre de usuario...
                $builder->whereRaw('LOWER(display_name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(first_name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', [$term])
                    // ...o por el nombre/slug de su tienda: muchas veces se
                    // conoce la tienda pero no al usuario detrás.
                    ->orWhereHas('store', function ($storeQuery) use ($term): void {
                        $storeQuery->whereRaw('LOWER(name) LIKE ?', [$term])
                            ->orWhereRaw('LOWER(slug) LIKE ?', [$term]);
                    });
            })
            ->orderBy('display_name')
            ->limit(20)
            ->get();

        return PublicProfileResource::collection($profiles);
    }
}
