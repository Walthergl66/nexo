<?php

namespace App\Modules\Products\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ProductImageUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail('The :attribute must be a valid product image URL.');

            return;
        }

        $supabaseHost = parse_url((string) config('supabase.url'), PHP_URL_HOST);
        $imageHost = parse_url($value, PHP_URL_HOST);
        $imagePath = parse_url($value, PHP_URL_PATH);

        if (
            ! is_string($supabaseHost)
            || ! is_string($imageHost)
            || ! hash_equals($supabaseHost, $imageHost)
            || ! is_string($imagePath)
            || ! str_starts_with($imagePath, '/storage/v1/object/public/product-images/')
        ) {
            $fail('Product images must be uploaded to the product-images bucket.');
        }
    }
}
