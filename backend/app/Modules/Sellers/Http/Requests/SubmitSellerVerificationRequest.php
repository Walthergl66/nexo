<?php

namespace App\Modules\Sellers\Http\Requests;

use App\Models\Profile;
use Illuminate\Foundation\Http\FormRequest;

class SubmitSellerVerificationRequest extends FormRequest
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
            'business_name' => ['required', 'string', 'max:160'],
            'business_description' => ['nullable', 'string', 'max:2000'],
            'document_type' => ['nullable', 'string', 'max:80'],
            'document_number' => ['nullable', 'string', 'max:120'],
            'metadata' => ['sometimes', 'array'],
        ];
    }
}
