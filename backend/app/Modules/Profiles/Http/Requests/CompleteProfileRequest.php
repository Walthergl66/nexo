<?php

namespace App\Modules\Profiles\Http\Requests;

use App\Models\Profile;
use App\Modules\Profiles\Services\IdentityLookupService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteProfileRequest extends FormRequest
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
        /** @var Profile|null $profile */
        $profile = $this->attributes->get('profile');

        return [
            'national_id' => [
                'required',
                'string',
                'size:10',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! app(IdentityLookupService::class)->isValidEcuadorianId((string) $value)) {
                        $fail('La cedula no es valida.');
                    }
                },
                Rule::unique('profiles', 'national_id')->ignore($profile?->id),
            ],
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'age' => ['nullable', 'integer', 'min:0', 'max:120'],
            'gender' => ['nullable', 'string', 'max:30'],
            'address' => ['required', 'string', 'min:5', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^09\d{8}$/'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'national_id' => preg_replace('/\D+/', '', (string) $this->input('national_id')),
            'phone' => preg_replace('/\D+/', '', (string) $this->input('phone')),
        ]);
    }
}
