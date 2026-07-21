<?php

namespace App\Modules\Products\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Modules\Products\Http\Requests\ListProductsRequest;
use App\Modules\Products\Http\Resources\ProductResource;
use Illuminate\Contracts\Database\Query\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListProductsController extends Controller
{
    public function __invoke(ListProductsRequest $request): AnonymousResourceCollection
    {
        $query = Product::query()
            ->with(['store', 'category', 'images'])
            ->where('status', Product::STATUS_ACTIVE)
            ->whereHas('store', fn ($q) => $q->where('status', Store::STATUS_ACTIVE));

        $this->applySearch($query, trim((string) $request->input('search', '')));
        $this->applyCategory($query, trim((string) $request->input('category', '')));
        $this->applyStore($query, trim((string) $request->input('store', '')));

        if ($request->filled('min_price')) {
            $query->where('price_cents', '>=', $request->integer('min_price'));
        }

        if ($request->filled('max_price')) {
            $query->where('price_cents', '<=', $request->integer('max_price'));
        }

        if ($request->boolean('in_stock')) {
            $query->where('stock', '>', 0);
        }

        if ($request->filled('min_rating')) {
            $query->where('average_rating', '>=', (float) $request->input('min_rating'));
        }

        $this->applySort($query, (string) $request->input('sort', ''));

        $products = $query
            ->paginate($request->integer('per_page') ?: 20)
            ->withQueryString();

        return ProductResource::collection($products);
    }

    /**
     * Busca en nombre y descripcion. Usamos LOWER() + LIKE en vez de ILIKE para
     * que se comporte igual en postgres (produccion) y en sqlite (tests).
     */
    private function applySearch(Builder $query, string $search): void
    {
        if ($search === '') {
            return;
        }

        $term = '%'.mb_strtolower($search).'%';

        $query->where(function (Builder $q) use ($term): void {
            $q->whereRaw('LOWER(products.name) LIKE ?', [$term])
                ->orWhereRaw('LOWER(products.description) LIKE ?', [$term]);
        });
    }

    /**
     * Acepta el id (ULID), el slug o el nombre de la categoria. El nombre se
     * admite porque los chips del movil se construyen desde /categories, que
     * devuelve nombres.
     */
    private function applyCategory(Builder $query, string $category): void
    {
        if ($category === '') {
            return;
        }

        $model = Category::query()
            ->where('id', $category)
            ->orWhere('slug', $category)
            ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($category)])
            ->first();

        // Si la categoria no existe devolvemos vacio en vez de ignorar el
        // filtro: mostrar el catalogo entero seria mas confuso.
        $query->where('category_id', $model?->id ?? '');
    }

    /** Acepta el id (ULID) o el slug de la tienda. */
    private function applyStore(Builder $query, string $store): void
    {
        if ($store === '') {
            return;
        }

        $model = Store::query()
            ->where('id', $store)
            ->orWhere('slug', $store)
            ->first();

        $query->where('store_id', $model?->id ?? '');
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            ListProductsRequest::SORT_PRICE_ASC  => $query->orderBy('price_cents'),
            ListProductsRequest::SORT_PRICE_DESC => $query->orderByDesc('price_cents'),
            ListProductsRequest::SORT_RATING     => $query->orderByDesc('average_rating')
                ->orderByDesc('review_count'),
            ListProductsRequest::SORT_NAME       => $query->orderBy('name'),
            default                              => $query->latest(),
        };
    }
}
