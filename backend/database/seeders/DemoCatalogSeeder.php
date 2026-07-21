<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Profile;
use App\Models\Store;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Catalogo de demostracion.
 *
 * Es idempotente: usa firstOrCreate por slug, asi que correrlo dos veces no
 * duplica nada. Pensado para repoblar un entorno vacio y para tener con que
 * probar la busqueda y los filtros.
 *
 *   php artisan db:seed --class=DemoCatalogSeeder
 */
class DemoCatalogSeeder extends Seeder
{
    private const CATEGORIES = [
        'Alimentos'   => 'Comida preparada y despensa.',
        'Bebidas'     => 'Bebidas frias y calientes.',
        'Artesanias'  => 'Hecho a mano por emprendedores locales.',
        'Tecnologia'  => 'Accesorios y electronica.',
    ];

    private const PRODUCTS = [
        ['Cafe de altura',        'Alimentos',  'Grano tostado artesanal de la sierra.',        1299, 25],
        ['Pan integral',          'Alimentos',  'Horneado cada manana con masa madre.',          450, 40],
        ['Miel organica',         'Alimentos',  'Cosechada sin pesticidas.',                     890, 15],
        ['Jugo de naranja',       'Bebidas',    'Exprimido natural, sin azucar anadida.',        350, 30],
        ['Chocolate caliente',    'Bebidas',    'Cacao puro con especias.',                      520, 20],
        ['Bolso tejido',          'Artesanias', 'Tejido a mano con fibras naturales.',          2450, 8],
        ['Sombrero de paja',      'Artesanias', 'Trenzado tradicional, pieza unica.',           3200, 5],
        ['Aretes de plata',       'Artesanias', 'Plata 950 con diseno artesanal.',              1850, 12],
        ['Cargador inalambrico',  'Tecnologia', 'Carga rapida compatible con Qi.',              1990, 18],
        ['Audifonos bluetooth',   'Tecnologia', 'Cancelacion de ruido y 20h de bateria.',       4500, 0],
    ];

    public function run(): void
    {
        $profile = Profile::query()->firstOrCreate(
            ['email' => 'demo-seller@nexo.test'],
            [
                'supabase_user_id'    => (string) Str::uuid(),
                'role'                => Profile::ROLE_SELLER,
                'verification_status' => Profile::VERIFICATION_APPROVED,
            ],
        );

        $store = Store::query()->firstOrCreate(
            ['slug' => 'tienda-demo'],
            [
                'profile_id' => $profile->id,
                'name'       => 'Tienda Demo',
                'status'     => Store::STATUS_ACTIVE,
            ],
        );

        $categories = [];

        foreach (self::CATEGORIES as $name => $description) {
            $categories[$name] = Category::query()->firstOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name'        => $name,
                    'description' => $description,
                    'status'      => Category::STATUS_ACTIVE,
                ],
            );
        }

        foreach (self::PRODUCTS as [$name, $categoryName, $description, $priceCents, $stock]) {
            Product::query()->firstOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'store_id'    => $store->id,
                    'category_id' => $categories[$categoryName]->id,
                    'name'        => $name,
                    'description' => $description,
                    'price_cents' => $priceCents,
                    'stock'       => $stock,
                    'status'      => Product::STATUS_ACTIVE,
                ],
            );
        }

        $this->command?->info(sprintf(
            'Catalogo demo listo: %d categorias, %d productos.',
            count(self::CATEGORIES),
            count(self::PRODUCTS),
        ));
    }
}
