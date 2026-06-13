<?php

namespace App\Modules\Categories\Services;

use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategoryService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Category
    {
        return DB::transaction(function () use ($data): Category {
            return Category::query()->create([
                'parent_id' => $data['parent_id'] ?? null,
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'description' => $data['description'] ?? null,
                'status' => $data['status'] ?? Category::STATUS_ACTIVE,
                'metadata' => $data['metadata'] ?? [],
            ])->load('parent');
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Category $category, array $data): Category
    {
        return DB::transaction(function () use ($category, $data): Category {
            $category->fill([
                'parent_id' => array_key_exists('parent_id', $data) ? $data['parent_id'] : $category->parent_id,
                'name' => $data['name'] ?? $category->name,
                'description' => array_key_exists('description', $data) ? $data['description'] : $category->description,
                'status' => $data['status'] ?? $category->status,
                'metadata' => $data['metadata'] ?? $category->metadata,
            ]);

            if (array_key_exists('name', $data) && $data['name'] !== $category->getOriginal('name')) {
                $category->slug = $this->uniqueSlug($data['name'], $category);
            }

            $category->save();

            return $category->refresh()->load('parent');
        });
    }

    private function uniqueSlug(string $name, ?Category $ignore = null): string
    {
        $baseSlug = Str::slug($name);

        if ($baseSlug === '') {
            $baseSlug = 'category';
        }

        $slug = $baseSlug;
        $suffix = 2;

        while (
            Category::query()
                ->where('slug', $slug)
                ->when($ignore !== null, fn ($query) => $query->whereKeyNot($ignore->id))
                ->exists()
        ) {
            $slug = $baseSlug.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
