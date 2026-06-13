<?php

namespace App\Modules\Categories\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Modules\Categories\Http\Requests\UpdateCategoryRequest;
use App\Modules\Categories\Http\Resources\CategoryResource;
use App\Modules\Categories\Services\CategoryService;
use Illuminate\Http\JsonResponse;

class UpdateCategoryController extends Controller
{
    public function __construct(private readonly CategoryService $service) {}

    public function __invoke(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $category = $this->service->update($category, $request->validated());

        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_OK);
    }
}
