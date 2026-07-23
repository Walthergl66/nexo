<?php

namespace App\Modules\Stores\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\Store;
use App\Modules\Stores\Http\Resources\StoreResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ListStoresController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        abort_unless($profile->isAdmin(), 403);

        $validated = $request->validate([
            'status' => ['nullable', 'string', Rule::in([
                Store::STATUS_PENDING,
                Store::STATUS_ACTIVE,
                Store::STATUS_SUSPENDED,
            ])],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));

        $stores = Store::query()
            ->with('profile')
            ->when(
                isset($validated['status']),
                fn ($query) => $query->where('status', $validated['status']),
            )
            ->when(
                $search !== '',
                fn ($query) => $query->where(fn ($sub) => $sub
                    ->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%'])
                    ->orWhereRaw('LOWER(slug) LIKE ?', ['%'.mb_strtolower($search).'%'])),
            )
            ->latest()
            ->paginate($validated['per_page'] ?? 20)
            ->withQueryString();

        return StoreResource::collection($stores);
    }
}
