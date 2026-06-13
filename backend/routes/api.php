<?php

use App\Modules\Profiles\Http\Controllers\MeController;
use App\Modules\Sellers\Http\Controllers\ListSellerVerificationRequestsController;
use App\Modules\Sellers\Http\Controllers\ReviewSellerVerificationRequestController;
use App\Modules\Sellers\Http\Controllers\SubmitSellerVerificationRequestController;
use App\Modules\Stores\Http\Controllers\CreateStoreController;
use App\Modules\Stores\Http\Controllers\ListStoresController;
use App\Modules\Stores\Http\Controllers\MyStoreController;
use App\Modules\Stores\Http\Controllers\ShowStoreController;
use App\Modules\Stores\Http\Controllers\UpdateStoreController;
use Illuminate\Support\Facades\Route;

Route::get('/stores', ListStoresController::class);
Route::get('/stores/{store}', ShowStoreController::class);

Route::middleware('supabase.jwt')->group(function (): void {
    Route::get('/me', MeController::class);

    Route::post('/seller-verification/request', SubmitSellerVerificationRequestController::class);

    Route::get('/my-store', MyStoreController::class);
    Route::post('/stores', CreateStoreController::class);
    Route::patch('/stores/{store}', UpdateStoreController::class);

    Route::get('/admin/seller-verification-requests', ListSellerVerificationRequestsController::class);
    Route::patch('/admin/seller-verification-requests/{sellerVerificationRequest}', ReviewSellerVerificationRequestController::class);
});
