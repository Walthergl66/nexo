<?php

use App\Modules\Profiles\Http\Controllers\MeController;
use App\Modules\Sellers\Http\Controllers\ListSellerVerificationRequestsController;
use App\Modules\Sellers\Http\Controllers\ReviewSellerVerificationRequestController;
use App\Modules\Sellers\Http\Controllers\SubmitSellerVerificationRequestController;
use Illuminate\Support\Facades\Route;

Route::middleware('supabase.jwt')->group(function (): void {
    Route::get('/me', MeController::class);

    Route::post('/seller-verification/request', SubmitSellerVerificationRequestController::class);

    Route::get('/admin/seller-verification-requests', ListSellerVerificationRequestsController::class);
    Route::patch('/admin/seller-verification-requests/{sellerVerificationRequest}', ReviewSellerVerificationRequestController::class);
});
