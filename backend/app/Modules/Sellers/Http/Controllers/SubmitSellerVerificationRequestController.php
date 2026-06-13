<?php

namespace App\Modules\Sellers\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Modules\Sellers\Http\Requests\SubmitSellerVerificationRequest;
use App\Modules\Sellers\Http\Resources\SellerVerificationRequestResource;
use App\Modules\Sellers\Services\SellerVerificationService;
use Illuminate\Http\JsonResponse;

class SubmitSellerVerificationRequestController extends Controller
{
    public function __construct(private readonly SellerVerificationService $service) {}

    public function __invoke(SubmitSellerVerificationRequest $request): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        $verificationRequest = $this->service->requestVerification($profile, $request->validated());

        return (new SellerVerificationRequestResource($verificationRequest))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }
}
