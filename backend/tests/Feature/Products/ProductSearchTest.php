<?php

namespace Tests\Feature\Products;

use App\Models\Category;
use App\Models\Product;
use App\Models\Profile;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_matches_name_case_insensitively(): void
    {
        $this->catalog();

        $response = $this->getJson('/api/products?search=CAFE')->assertOk();

        $this->assertSame(['Cafe especial'], $this->names($response->json('data')));
    }

    public function test_search_also_matches_description(): void
    {
        $this->catalog();

        $response = $this->getJson('/api/products?search=artesanal')->assertOk();

        $this->assertSame(['Pan integral'], $this->names($response->json('data')));
    }

    public function test_search_finds_products_beyond_the_first_page(): void
    {
        [, $store] = $this->sellerWithStore();
        $category = $this->category();

        // 25 productos de relleno empujan al buscado fuera de la primera pagina.
        for ($i = 0; $i < 25; $i++) {
            $this->product($store, $category, ['name' => 'Relleno '.$i, 'slug' => 'relleno-'.$i]);
        }

        $this->product($store, $category, [
            'name' => 'Aguja de coser',
            'slug' => 'aguja-de-coser',
        ]);

        $response = $this->getJson('/api/products?search=aguja')->assertOk();

        $this->assertSame(['Aguja de coser'], $this->names($response->json('data')));
    }

    public function test_filters_by_category_slug(): void
    {
        $this->catalog();

        $response = $this->getJson('/api/products?category=bebidas')->assertOk();

        $this->assertSame(['Jugo de naranja'], $this->names($response->json('data')));
    }

    public function test_filters_by_category_name_as_sent_by_the_mobile_chips(): void
    {
        $this->catalog();

        $response = $this->getJson('/api/products?category=Bebidas')->assertOk();

        $this->assertSame(['Jugo de naranja'], $this->names($response->json('data')));
    }

    public function test_unknown_category_returns_no_results(): void
    {
        $this->catalog();

        $this->getJson('/api/products?category=no-existe')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_filters_by_price_range(): void
    {
        $this->catalog();

        $response = $this->getJson('/api/products?min_price=1000&max_price=2000')->assertOk();

        $this->assertSame(['Cafe especial'], $this->names($response->json('data')));
    }

    public function test_filters_out_products_without_stock(): void
    {
        [, $store] = $this->sellerWithStore();
        $category = $this->category();

        $this->product($store, $category, ['name' => 'Con stock', 'slug' => 'con-stock', 'stock' => 5]);
        $this->product($store, $category, ['name' => 'Agotado', 'slug' => 'agotado', 'stock' => 0]);

        $response = $this->getJson('/api/products?in_stock=1')->assertOk();

        $this->assertSame(['Con stock'], $this->names($response->json('data')));
    }

    public function test_sorts_by_price_ascending_and_descending(): void
    {
        $this->catalog();

        $asc = $this->getJson('/api/products?sort=price_asc')->assertOk();
        $this->assertSame(['Pan integral', 'Cafe especial', 'Jugo de naranja'], $this->names($asc->json('data')));

        $desc = $this->getJson('/api/products?sort=price_desc')->assertOk();
        $this->assertSame(['Jugo de naranja', 'Cafe especial', 'Pan integral'], $this->names($desc->json('data')));
    }

    public function test_search_combines_with_filters(): void
    {
        $this->catalog();

        $this->getJson('/api/products?search=cafe&min_price=5000')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_hidden_products_stay_hidden_when_searching(): void
    {
        [, $store] = $this->sellerWithStore();
        $category = $this->category();

        $this->product($store, $category, [
            'name' => 'Borrador secreto',
            'slug' => 'borrador-secreto',
            'status' => Product::STATUS_DRAFT,
        ]);

        $this->getJson('/api/products?search=secreto')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_pagination_links_keep_the_query_string(): void
    {
        [, $store] = $this->sellerWithStore();
        $category = $this->category();

        for ($i = 0; $i < 5; $i++) {
            $this->product($store, $category, ['name' => 'Cafe '.$i, 'slug' => 'cafe-'.$i]);
        }

        $response = $this->getJson('/api/products?search=cafe&per_page=2')->assertOk();

        $this->assertSame(2, count($response->json('data')));
        $this->assertStringContainsString('search=cafe', $response->json('links.next'));
    }

    public function test_rejects_invalid_sort_and_inverted_price_range(): void
    {
        $this->getJson('/api/products?sort=cualquiera')
            ->assertStatus(422)
            ->assertJsonValidationErrors('sort');

        $this->getJson('/api/products?min_price=5000&max_price=100')
            ->assertStatus(422)
            ->assertJsonValidationErrors('max_price');
    }

    /** Catalogo base: tres productos activos en tres categorias. */
    private function catalog(): void
    {
        [, $store] = $this->sellerWithStore();

        $alimentos = $this->category();
        $bebidas = Category::query()->create([
            'name' => 'Bebidas',
            'slug' => 'bebidas',
            'status' => Category::STATUS_ACTIVE,
        ]);

        $this->product($store, $alimentos, [
            'name' => 'Cafe especial',
            'slug' => 'cafe-especial',
            'description' => 'Tostado de altura.',
            'price_cents' => 1299,
        ]);

        $this->product($store, $alimentos, [
            'name' => 'Pan integral',
            'slug' => 'pan-integral',
            'description' => 'Horneado artesanal cada manana.',
            'price_cents' => 450,
        ]);

        $this->product($store, $bebidas, [
            'name' => 'Jugo de naranja',
            'slug' => 'jugo-de-naranja',
            'description' => 'Exprimido natural.',
            'price_cents' => 5500,
        ]);
    }

    /** @param array<string, mixed> $overrides */
    private function product(Store $store, Category $category, array $overrides = []): Product
    {
        return Product::query()->create(array_merge([
            'store_id' => $store->id,
            'category_id' => $category->id,
            'name' => 'Producto',
            'slug' => 'producto',
            'description' => 'Descripcion.',
            'price_cents' => 1000,
            'stock' => 10,
            'status' => Product::STATUS_ACTIVE,
        ], $overrides));
    }

    /** @return array<int, string> */
    private function sellerWithStore(): array
    {
        $seller = Profile::query()->create([
            'supabase_user_id' => '018f1d4c-40a5-7fd2-9a5a-000000000001',
            'email' => 'seller@example.com',
            'role' => Profile::ROLE_SELLER,
            'verification_status' => Profile::VERIFICATION_APPROVED,
        ]);

        $store = Store::query()->create([
            'profile_id' => $seller->id,
            'name' => 'Nexo Store',
            'slug' => 'nexo-store',
            'status' => Store::STATUS_ACTIVE,
        ]);

        return [$seller, $store];
    }

    private function category(): Category
    {
        return Category::query()->create([
            'name' => 'Alimentos',
            'slug' => 'alimentos',
            'status' => Category::STATUS_ACTIVE,
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $data
     * @return array<int, string>
     */
    private function names(array $data): array
    {
        return array_map(static fn (array $row): string => $row['name'], $data);
    }
}
