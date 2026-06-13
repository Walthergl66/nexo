<?php

namespace App\Modules\Sellers\Http\Requests;

use App\Models\Profile;
use App\Models\SellerVerificationRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewSellerVerificationRequest extends FormRequest
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
            'status' => [
                'required',
                'string',
                Rule::in([
                    SellerVerificationRequest::STATUS_APPROVED,
                    SellerVerificationRequest::STATUS_REJECTED,
                    SellerVerificationRequest::STATUS_SUSPENDED,
                ]),
            ],
            'rejection_reason' => ['required_if:status,'.SellerVerificationRequest::STATUS_REJECTED, 'nullable', 'string', 'max:1000'],
        ];
    }
}
