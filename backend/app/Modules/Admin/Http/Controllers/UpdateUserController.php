<?php

namespace App\Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Admin\Http\Resources\AdminUserResource;
use App\Modules\Auth\Services\SupabaseAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UpdateUserController extends Controller
{
    public function __construct(private readonly SupabaseAuthService $authService) {}

    public function __invoke(Request $request, Profile $user): JsonResponse
    {
        $admin = $request->attributes->get('profile');

        abort_unless($admin instanceof Profile && $admin->isAdmin(), 403);

        // Un admin no puede modificarse a sí mismo por aquí: evita quitarse el
        // rol admin o suspenderse y quedar fuera sin querer.
        if ($user->id === $admin->id) {
            throw ValidationException::withMessages([
                'user' => 'No puedes cambiar tu propia cuenta desde aquí.',
            ]);
        }

        $validated = $request->validate([
            'role' => ['sometimes', 'string', Rule::in([
                Profile::ROLE_BUYER,
                Profile::ROLE_SELLER,
                Profile::ROLE_ADMIN,
            ])],
            'verification_status' => ['sometimes', 'string', Rule::in([
                Profile::VERIFICATION_PENDING,
                Profile::VERIFICATION_APPROVED,
                Profile::VERIFICATION_REJECTED,
                Profile::VERIFICATION_SUSPENDED,
            ])],
        ]);

        if ($validated === []) {
            throw ValidationException::withMessages([
                'user' => 'No hay cambios para aplicar.',
            ]);
        }

        // forceFill: role y verification_status son sensibles; no dependemos de
        // que estén en $fillable (ver S10).
        $user->forceFill($validated)->save();

        // El perfil se cachea por sesión (SupabaseAuthService). Sin invalidarlo,
        // el cambio de rol/estado no surtiría efecto hasta que expire el cache.
        $this->authService->forgetProfileCache($user);

        return (new AdminUserResource($user->refresh()->load('store')))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
