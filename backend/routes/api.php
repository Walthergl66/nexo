<?php

use App\Modules\Cart\Http\Controllers\AddCartItemController;
use App\Modules\Cart\Http\Controllers\ClearCartController;
use App\Modules\Cart\Http\Controllers\ListCartController;
use App\Modules\Cart\Http\Controllers\RemoveCartItemController;
use App\Modules\Cart\Http\Controllers\UpdateCartItemController;
use App\Modules\Categories\Http\Controllers\CreateCategoryController;
use App\Modules\Categories\Http\Controllers\ListCategoriesController;
use App\Modules\Categories\Http\Controllers\UpdateCategoryController;
use App\Modules\Orders\Http\Controllers\CreateOrderFromCartController;
use App\Modules\Orders\Http\Controllers\ListOrdersController;
use App\Modules\Orders\Http\Controllers\ShowOrderController;
use App\Modules\Products\Http\Controllers\CreateProductController;
use App\Modules\Products\Http\Controllers\ListMyProductsController;
use App\Modules\Products\Http\Controllers\ListProductsController;
use App\Modules\Products\Http\Controllers\ShowProductController;
use App\Modules\Products\Http\Controllers\UpdateProductController;
use App\Modules\Profiles\Http\Controllers\CheckProfileAvailabilityController;
use App\Modules\Profiles\Http\Controllers\CompleteProfileController;
use App\Modules\Profiles\Http\Controllers\LookupIdentityController;
use App\Modules\Profiles\Http\Controllers\MeController;
use App\Modules\Sellers\Http\Controllers\ListSellerVerificationRequestsController;
use App\Modules\Sellers\Http\Controllers\ReviewSellerVerificationRequestController;
use App\Modules\Sellers\Http\Controllers\SellerCenterController;
use App\Modules\Sellers\Http\Controllers\SubmitSellerVerificationRequestController;
use App\Modules\Stores\Http\Controllers\CreateStoreController;
use App\Modules\Stores\Http\Controllers\ListStoresController;
use App\Modules\Stores\Http\Controllers\MyStoreController;
use App\Modules\Stores\Http\Controllers\ShowStoreController;
use App\Modules\Stores\Http\Controllers\UpdateStoreController;
use Illuminate\Support\Facades\Route;

Route::get('/stores', ListStoresController::class);
Route::get('/stores/{store}', ShowStoreController::class);
Route::get('/categories', ListCategoriesController::class);
Route::get('/products', ListProductsController::class);
Route::get('/products/{product}', ShowProductController::class);
Route::get('/identity/lookup', LookupIdentityController::class);
Route::get('/profiles/availability', CheckProfileAvailabilityController::class);

Route::middleware('supabase.jwt')->group(function (): void {
    Route::get('/me', MeController::class);
    Route::patch('/me/profile', CompleteProfileController::class);

    Route::post('/seller-verification/request', SubmitSellerVerificationRequestController::class);
    Route::get('/seller-center', SellerCenterController::class);

    Route::get('/my-store', MyStoreController::class);
    Route::post('/stores', CreateStoreController::class);
    Route::patch('/stores/{store}', UpdateStoreController::class);

    Route::get('/my-products', ListMyProductsController::class);
    Route::post('/products', CreateProductController::class);
    Route::patch('/products/{product}', UpdateProductController::class);

    Route::get('/cart', ListCartController::class);
    Route::post('/cart/items', AddCartItemController::class);
    Route::patch('/cart/items/{cartItem}', UpdateCartItemController::class);
    Route::delete('/cart/items/{cartItem}', RemoveCartItemController::class);
    Route::delete('/cart', ClearCartController::class);

    Route::get('/orders', ListOrdersController::class);
    Route::post('/orders/from-cart', CreateOrderFromCartController::class);
    Route::get('/orders/{order}', ShowOrderController::class);

    Route::get('/admin/seller-verification-requests', ListSellerVerificationRequestsController::class);
    Route::patch('/admin/seller-verification-requests/{sellerVerificationRequest}', ReviewSellerVerificationRequestController::class);
    Route::post('/admin/categories', CreateCategoryController::class);
    Route::patch('/admin/categories/{category}', UpdateCategoryController::class);
});
