<?php

namespace App\Modules\Products\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListProductsRequest extends FormRequest
{
    public const SORT_RECENT = 'recent';

    public const SORT_PRICE_ASC = 'price_asc';

    public const SORT_PRICE_DESC = 'price_desc';

    public const SORT_RATING = 'rating';

    public const SORT_NAME = 'name';

    public const SORTS = [
        self::SORT_RECENT,
        self::SORT_PRICE_ASC,
        self::SORT_PRICE_DESC,
        self::SORT_RATING,
        self::SORT_NAME,
    ];

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'search'      => ['nullable', 'string', 'max:100'],
            'category'    => ['nullable', 'string', 'max:100'],
            'store'       => ['nullable', 'string', 'max:100'],
            'min_price'   => ['nullable', 'integer', 'min:0'],
            'max_price'   => ['nullable', 'integer', 'min:0', 'gte:min_price'],
            'in_stock'    => ['nullable', 'boolean'],
            'min_rating'  => ['nullable', 'numeric', 'min:0', 'max:5'],
            'sort'        => ['nullable', 'string', Rule::in(self::SORTS)],
            'per_page'    => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'max_price.gte' => 'El precio maximo no puede ser menor que el minimo.',
        ];
    }
}
