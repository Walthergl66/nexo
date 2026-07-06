<?php

namespace App\Modules\Stores\Services;

use App\Models\Profile;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StoreService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Profile $profile, array $data): Store
    {
        if (! $profile->isVerifiedSeller()) {
            throw ValidationException::withMessages([
                'profile' => 'Solo vendedores aprobados pueden crear tiendas.',
            ]);
        }

        if ($profile->store()->exists()) {
            throw ValidationException::withMessages([
                'profile' => 'Este vendedor ya tiene una tienda activa o registrada.',
            ]);
        }

        return DB::transaction(function () use ($profile, $data): Store {
            return Store::query()->create([
                'profile_id' => $profile->id,
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'description' => $data['description'] ?? null,
                'logo_url' => $data['logo_url'] ?? null,
                'banner_url' => $data['banner_url'] ?? null,
                'status' => Store::STATUS_ACTIVE,
                'metadata' => $data['metadata'] ?? [],
            ])->load('profile');
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Store $store, array $data): Store
    {
        return DB::transaction(function () use ($store, $data): Store {
            $store->fill([
                'name' => $data['name'] ?? $store->name,
                'description' => array_key_exists('description', $data) ? $data['description'] : $store->description,
                'logo_url' => array_key_exists('logo_url', $data) ? $data['logo_url'] : $store->logo_url,
                'banner_url' => array_key_exists('banner_url', $data) ? $data['banner_url'] : $store->banner_url,
                'metadata' => $data['metadata'] ?? $store->metadata,
            ]);

            if (array_key_exists('name', $data) && $data['name'] !== $store->getOriginal('name')) {
                $store->slug = $this->uniqueSlug($data['name'], $store);
            }

            $store->save();

            return $store->refresh()->load('profile');
        });
    }

    private function uniqueSlug(string $name, ?Store $ignore = null): string
    {
        $baseSlug = Str::slug($name);

        if ($baseSlug === '') {
            $baseSlug = 'store';
        }

        $slug = $baseSlug;
        $suffix = 2;

        while (
            Store::query()
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
