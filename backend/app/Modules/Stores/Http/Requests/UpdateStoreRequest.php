<?php

namespace App\Modules\Stores\Http\Requests;

use App\Models\Profile;
use App\Models\Store;
use Illuminate\Foundation\Http\FormRequest;

class UpdateStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        $profile = $this->attributes->get('profile');
        $store = $this->route('store');

        return $profile instanceof Profile
            && $store instanceof Store
            && ($profile->isAdmin() || $store->profile_id === $profile->id);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'logo_url' => ['nullable', 'url', 'max:2048'],
            'banner_url' => ['nullable', 'url', 'max:2048'],
            'metadata' => ['sometimes', 'array'],
        ];
    }
}
