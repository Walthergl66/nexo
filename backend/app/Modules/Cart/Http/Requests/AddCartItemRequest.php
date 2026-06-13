<?php

namespace App\Modules\Cart\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->attributes->has('profile');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'ulid', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
        ];
    }
}
