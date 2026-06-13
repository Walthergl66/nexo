<?php

namespace App\Modules\Products\Services;

use App\Models\Product;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Store $store, array $data): Product
    {
        if (! $store->isActive()) {
            throw ValidationException::withMessages([
                'store' => 'Products can only be created for active stores.',
            ]);
        }

        $status = $data['status'] ?? Product::STATUS_DRAFT;

        if ($status === Product::STATUS_ACTIVE && $store->status !== Store::STATUS_ACTIVE) {
            throw ValidationException::withMessages([
                'status' => 'Products cannot be published while the store is not active.',
            ]);
        }

        return DB::transaction(function () use ($store, $data, $status): Product {
            $product = Product::query()->create([
                'store_id' => $store->id,
                'category_id' => $data['category_id'] ?? null,
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'description' => $data['description'] ?? null,
                'price_cents' => $data['price_cents'],
                'currency' => strtoupper($data['currency'] ?? 'USD'),
                'stock' => $data['stock'] ?? 0,
                'status' => $status,
                'metadata' => $data['metadata'] ?? [],
            ]);

            $this->replaceImages($product, $data['images'] ?? []);

            return $product->refresh()->load(['store.profile', 'category', 'images']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data): Product {
            /** @var Store $store */
            $store = $product->store()->lockForUpdate()->firstOrFail();

            $status = $data['status'] ?? $product->status;

            if ($status === Product::STATUS_ACTIVE && ! $store->isActive()) {
                throw ValidationException::withMessages([
                    'status' => 'Products cannot be published while the store is not active.',
                ]);
            }

            $product->fill([
                'category_id' => array_key_exists('category_id', $data) ? $data['category_id'] : $product->category_id,
                'name' => $data['name'] ?? $product->name,
                'description' => array_key_exists('description', $data) ? $data['description'] : $product->description,
                'price_cents' => $data['price_cents'] ?? $product->price_cents,
                'currency' => array_key_exists('currency', $data) ? strtoupper($data['currency']) : $product->currency,
                'stock' => $data['stock'] ?? $product->stock,
                'status' => $status,
                'metadata' => $data['metadata'] ?? $product->metadata,
            ]);

            if (array_key_exists('name', $data) && $data['name'] !== $product->getOriginal('name')) {
                $product->slug = $this->uniqueSlug($data['name'], $product);
            }

            $product->save();

            if (array_key_exists('images', $data)) {
                $this->replaceImages($product, $data['images'] ?? []);
            }

            return $product->refresh()->load(['store.profile', 'category', 'images']);
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $images
     */
    private function replaceImages(Product $product, array $images): void
    {
        $product->images()->delete();

        foreach (array_values($images) as $position => $image) {
            $product->images()->create([
                'url' => $image['url'],
                'alt_text' => $image['alt_text'] ?? null,
                'position' => $position,
            ]);
        }
    }

    private function uniqueSlug(string $name, ?Product $ignore = null): string
    {
        $baseSlug = Str::slug($name);

        if ($baseSlug === '') {
            $baseSlug = 'product';
        }

        $slug = $baseSlug;
        $suffix = 2;

        while (
            Product::query()
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
