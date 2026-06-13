<?php

namespace App\Modules\Categories\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Modules\Categories\Http\Resources\CategoryResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListCategoriesController extends Controller
{
    public function __invoke(): AnonymousResourceCollection
    {
        $categories = Category::query()
            ->with('parent')
            ->where('status', Category::STATUS_ACTIVE)
            ->orderBy('name')
            ->paginate(50);

        return CategoryResource::collection($categories);
    }
}
