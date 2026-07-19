<?php

namespace App\Modules\Reviews\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Profile;
use App\Modules\Reviews\Http\Requests\CreateReviewRequest;
use App\Modules\Reviews\Http\Resources\ReviewResource;
use App\Modules\Reviews\Services\ReviewService;
use Illuminate\Http\JsonResponse;

class CreateReviewController extends Controller
{
    public function __construct(private readonly ReviewService $service) {}

    public function __invoke(CreateReviewRequest $request, Product $product): JsonResponse
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('profile');

        $review = $this->service->create($product, $profile, $request->validated());

        return (new ReviewResource($review))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }
}
