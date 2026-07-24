<?php

use App\Modules\Admin\Http\Controllers\OverviewController as AdminOverviewController;
use App\Modules\Cart\Http\Controllers\AddCartItemController;
use App\Modules\Cart\Http\Controllers\ClearCartController;
use App\Modules\Cart\Http\Controllers\ListCartController;
use App\Modules\Cart\Http\Controllers\RemoveCartItemController;
use App\Modules\Cart\Http\Controllers\UpdateCartItemController;
use App\Modules\Categories\Http\Controllers\CreateCategoryController;
use App\Modules\Categories\Http\Controllers\ListCategoriesController;
use App\Modules\Categories\Http\Controllers\UpdateCategoryController;
use App\Modules\Notifications\Http\Controllers\ListNotificationsController;
use App\Modules\Notifications\Http\Controllers\MarkAllNotificationsReadController;
use App\Modules\Notifications\Http\Controllers\MarkNotificationReadController;
use App\Modules\Notifications\Http\Controllers\RegisterPushTokenController;
use App\Modules\Orders\Http\Controllers\CancelOrderController;
use App\Modules\Orders\Http\Controllers\CreateOrderFromCartController;
use App\Modules\Orders\Http\Controllers\ListOrdersController;
use App\Modules\Orders\Http\Controllers\ListSellerSalesController;
use App\Modules\Orders\Http\Controllers\PayOrderController;
use App\Modules\Orders\Http\Controllers\ShowOrderController;
use App\Modules\Orders\Http\Controllers\UpdateSaleStatusController;
use App\Modules\Payments\Http\Controllers\CreateCheckoutSessionController;
use App\Modules\Payments\Http\Controllers\StripeWebhookController;
use App\Modules\Products\Http\Controllers\CreateProductController;
use App\Modules\Products\Http\Controllers\DeleteProductController;
use App\Modules\Products\Http\Controllers\ListMyProductsController;
use App\Modules\Products\Http\Controllers\ListProductsController;
use App\Modules\Products\Http\Controllers\ShowProductController;
use App\Modules\Products\Http\Controllers\UpdateProductController;
use App\Modules\Profiles\Http\Controllers\CheckProfileAvailabilityController;
use App\Modules\Profiles\Http\Controllers\CompleteProfileController;
use App\Modules\Profiles\Http\Controllers\LookupIdentityController;
use App\Modules\Profiles\Http\Controllers\MeController;
use App\Modules\Profiles\Http\Controllers\SearchUsersController;
use App\Modules\Profiles\Http\Controllers\ShowPublicProfileController;
use App\Modules\Reviews\Http\Controllers\CreateReviewController;
use App\Modules\Reviews\Http\Controllers\ListProductReviewsController;
use App\Modules\Sellers\Http\Controllers\ListSellerVerificationRequestsController;
use App\Modules\Sellers\Http\Controllers\ReviewSellerVerificationRequestController;
use App\Modules\Sellers\Http\Controllers\SellerCenterController;
use App\Modules\Sellers\Http\Controllers\SubmitSellerVerificationRequestController;
use App\Modules\Stores\Http\Controllers\Admin\DeleteStoreController;
use App\Modules\Stores\Http\Controllers\Admin\ListStoresController as AdminListStoresController;
use App\Modules\Stores\Http\Controllers\Admin\UpdateStoreStatusController;
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
Route::get('/products/{product}/reviews', ListProductReviewsController::class);
// Endpoints publicos que tocan datos personales: los usa el registro antes de
// que exista sesion, asi que no pueden pedir token, pero llevan cupo propio.
// Ver App\Providers\RateLimitServiceProvider.
Route::get('/identity/lookup', LookupIdentityController::class)
    ->middleware('throttle:identity');
Route::get('/profiles/availability', CheckProfileAvailabilityController::class)
    ->middleware('throttle:availability');

// Webhook de Stripe: publico por necesidad (lo llama Stripe, no un usuario) y se
// autentica por la firma del cuerpo, no por token. Fuera del grupo supabase.jwt.
Route::post('/webhooks/stripe', StripeWebhookController::class);

// El orden importa: supabase.jwt corre primero y deja el perfil en los
// atributos de la peticion, que es lo que throttle:user usa para contar por
// persona en vez de por IP.
Route::middleware(['supabase.jwt', 'throttle:user'])->group(function (): void {
    Route::get('/me', MeController::class);
    Route::patch('/me/profile', CompleteProfileController::class);

    // Descubrimiento social: buscar usuarios y visitar su perfil público. El
    // orden importa: /users/search antes de /users/{profile} para que "search"
    // no se tome como un id.
    Route::get('/users/search', SearchUsersController::class);
    Route::get('/users/{profile}', ShowPublicProfileController::class);

    Route::post('/seller-verification/request', SubmitSellerVerificationRequestController::class);
    Route::get('/seller-center', SellerCenterController::class);

    Route::get('/my-store', MyStoreController::class);
    Route::post('/stores', CreateStoreController::class);
    Route::patch('/stores/{store}', UpdateStoreController::class);

    Route::get('/my-products', ListMyProductsController::class);
    Route::post('/products', CreateProductController::class);
    Route::patch('/products/{product}', UpdateProductController::class);
    Route::delete('/products/{product}', DeleteProductController::class);

    Route::get('/cart', ListCartController::class);
    Route::post('/cart/items', AddCartItemController::class);
    Route::patch('/cart/items/{cartItem}', UpdateCartItemController::class);
    Route::delete('/cart/items/{cartItem}', RemoveCartItemController::class);
    Route::delete('/cart', ClearCartController::class);

    Route::get('/seller/sales', ListSellerSalesController::class);
    Route::patch('/seller/sales/{orderItem}', UpdateSaleStatusController::class);

    Route::get('/orders', ListOrdersController::class);
    Route::post('/orders/from-cart', CreateOrderFromCartController::class);
    Route::post('/orders/{order}/checkout', CreateCheckoutSessionController::class);
    Route::post('/orders/{order}/pay', PayOrderController::class);
    Route::post('/orders/{order}/cancel', CancelOrderController::class);
    Route::get('/orders/{order}', ShowOrderController::class);

    Route::get('/notifications', ListNotificationsController::class);
    Route::post('/notifications/read-all', MarkAllNotificationsReadController::class);
    Route::post('/notifications/{notification}/read', MarkNotificationReadController::class);
    Route::post('/me/push-token', RegisterPushTokenController::class);

    Route::post('/products/{product}/reviews', CreateReviewController::class);

    Route::get('/admin/overview', AdminOverviewController::class);
    Route::get('/admin/seller-verification-requests', ListSellerVerificationRequestsController::class);
    Route::patch('/admin/seller-verification-requests/{sellerVerificationRequest}', ReviewSellerVerificationRequestController::class);
    Route::post('/admin/categories', CreateCategoryController::class);
    Route::patch('/admin/categories/{category}', UpdateCategoryController::class);
    Route::get('/admin/stores', AdminListStoresController::class);
    Route::patch('/admin/stores/{store}', UpdateStoreStatusController::class);
    Route::delete('/admin/stores/{store}', DeleteStoreController::class);
});
