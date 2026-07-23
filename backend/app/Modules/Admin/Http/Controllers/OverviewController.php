<?php

namespace App\Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Profile;
use App\Models\SellerVerificationRequest;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Contadores del tablero del panel admin.
 *
 * Existe para que el dashboard no dependa de descargar todas las tiendas,
 * productos y solicitudes solo para contarlas: cada metrica es un COUNT en la
 * base, barato y estable aunque crezcan las tablas. Las listas se piden aparte y
 * paginadas.
 */
class OverviewController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $profile = $request->attributes->get('profile');

        abort_unless($profile instanceof Profile && $profile->isAdmin(), 403);

        return response()->json([
            'data' => [
                'pending_requests' => SellerVerificationRequest::query()
                    ->where('status', SellerVerificationRequest::STATUS_PENDING)
                    ->count(),
                'rejected_requests' => SellerVerificationRequest::query()
                    ->where('status', SellerVerificationRequest::STATUS_REJECTED)
                    ->count(),
                'active_stores' => Store::query()
                    ->where('status', Store::STATUS_ACTIVE)
                    ->count(),
                'suspended_stores' => Store::query()
                    ->where('status', Store::STATUS_SUSPENDED)
                    ->count(),
                'active_products' => Product::query()
                    ->where('status', Product::STATUS_ACTIVE)
                    ->count(),
                'total_products' => Product::query()->count(),
                'categories' => Category::query()->count(),
            ],
        ]);
    }
}
