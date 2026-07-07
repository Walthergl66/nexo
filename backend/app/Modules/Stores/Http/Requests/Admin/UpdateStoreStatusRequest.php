<?php

namespace App\Modules\Stores\Http\Requests\Admin;

use App\Models\Profile;
use App\Models\Store;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStoreStatusRequest extends FormRequest
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
            'status' => ['required', 'string', Rule::in([
                Store::STATUS_ACTIVE,
                Store::STATUS_SUSPENDED,
            ])],
        ];
    }
}
