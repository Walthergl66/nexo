<?php

namespace App\Modules\Products\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'ulid', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:5000'],
            'price_cents' => ['required', 'integer', 'min:1', 'max:999999999'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'stock' => ['sometimes', 'integer', 'min:0', 'max:999999'],
            'status' => ['sometimes', 'string', Rule::in([
                Product::STATUS_DRAFT,
                Product::STATUS_ACTIVE,
                Product::STATUS_PAUSED,
            ])],
            'metadata' => ['sometimes', 'array'],
            'images' => ['sometimes', 'array', 'max:10'],
            'images.*.url' => ['required_with:images', 'url', 'max:2048'],
            'images.*.alt_text' => ['nullable', 'string', 'max:180'],
        ];
    }
}
