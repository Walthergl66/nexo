<?php

namespace App\Modules\Categories\Http\Requests;

use App\Models\Category;
use App\Models\Profile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $profile = $this->attributes->get('profile');

        return $profile instanceof Profile && $profile->isAdmin();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'parent_id' => ['nullable', 'ulid', 'exists:categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', 'string', Rule::in([Category::STATUS_ACTIVE, Category::STATUS_INACTIVE])],
            'metadata' => ['sometimes', 'array'],
        ];
    }
}
