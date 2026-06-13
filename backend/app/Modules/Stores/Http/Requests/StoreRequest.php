<?php

namespace App\Modules\Stores\Http\Requests;

use App\Models\Profile;
use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->attributes->get('profile') instanceof Profile;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'logo_url' => ['nullable', 'url', 'max:2048'],
            'banner_url' => ['nullable', 'url', 'max:2048'],
            'metadata' => ['sometimes', 'array'],
        ];
    }
}
