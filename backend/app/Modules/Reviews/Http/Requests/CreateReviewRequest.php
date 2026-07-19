<?php

namespace App\Modules\Reviews\Http\Requests;

use App\Models\Profile;
use Illuminate\Foundation\Http\FormRequest;

class CreateReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->attributes->get('profile') instanceof Profile;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'rating'        => ['required', 'integer', 'min:1', 'max:5'],
            'body'          => ['nullable', 'string', 'max:1000'],
            'order_item_id' => ['nullable', 'ulid', 'exists:order_items,id'],
        ];
    }
}
