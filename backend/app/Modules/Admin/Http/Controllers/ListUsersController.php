<?php

namespace App\Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Admin\Http\Resources\AdminUserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ListUsersController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $profile = $request->attributes->get('profile');

        abort_unless($profile instanceof Profile && $profile->isAdmin(), 403);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', 'string', Rule::in([Profile::ROLE_BUYER, Profile::ROLE_SELLER, Profile::ROLE_ADMIN])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));

        $users = Profile::query()
            ->with('store')
            ->when(
                isset($validated['role']),
                fn ($query) => $query->where('role', $validated['role']),
            )
            ->when(
                $search !== '',
                fn ($query) => $query->where(fn ($sub) => $sub
                    ->whereRaw('LOWER(display_name) LIKE ?', ['%'.mb_strtolower($search).'%'])
                    ->orWhereRaw('LOWER(email) LIKE ?', ['%'.mb_strtolower($search).'%'])
                    ->orWhere('national_id', 'LIKE', '%'.$search.'%')),
            )
            ->latest()
            ->paginate($validated['per_page'] ?? 20)
            ->withQueryString();

        return AdminUserResource::collection($users);
    }
}
