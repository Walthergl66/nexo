<?php

namespace App\Modules\Sellers\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\SellerVerificationRequest;
use App\Modules\Sellers\Http\Requests\ReviewSellerVerificationRequest;
use App\Modules\Sellers\Http\Resources\SellerVerificationRequestResource;
use App\Modules\Sellers\Services\SellerVerificationService;
use Illuminate\Http\JsonResponse;

class ReviewSellerVerificationRequestController extends Controller
{
    public function __construct(private readonly SellerVerificationService $service) {}

    public function __invoke(
        ReviewSellerVerificationRequest $request,
        SellerVerificationRequest $sellerVerificationRequest
    ): JsonResponse {
        /** @var Profile $reviewer */
        $reviewer = $request->attributes->get('profile');

        $verificationRequest = $this->service->review(
            $sellerVerificationRequest,
            $reviewer,
            $request->validated(),
        );

        return (new SellerVerificationRequestResource($verificationRequest))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
