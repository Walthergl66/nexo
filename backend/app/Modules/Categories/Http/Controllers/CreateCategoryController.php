<?php

namespace App\Modules\Categories\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Categories\Http\Requests\CategoryRequest;
use App\Modules\Categories\Http\Resources\CategoryResource;
use App\Modules\Categories\Services\CategoryService;
use Illuminate\Http\JsonResponse;

class CreateCategoryController extends Controller
{
    public function __construct(private readonly CategoryService $service) {}

    public function __invoke(CategoryRequest $request): JsonResponse
    {
        $category = $this->service->create($request->validated());

        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }
}
