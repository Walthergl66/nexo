<?php

namespace Tests\Feature\Docs;

use Tests\TestCase;

class OpenApiDocsTest extends TestCase
{
    public function test_openapi_json_is_available(): void
    {
        $this->get('/api/docs/openapi.json')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/json')
            ->assertJsonPath('openapi', '3.1.0')
            ->assertJsonPath('info.title', 'nexo API')
            ->assertJsonStructure([
                'paths' => [
                    '/products',
                    '/cart',
                    '/orders/from-cart',
                ],
                'components' => [
                    'securitySchemes' => [
                        'supabaseBearer',
                    ],
                ],
            ]);
    }

    public function test_swagger_ui_is_available(): void
    {
        $this->get('/api/docs')
            ->assertOk()
            ->assertSee('swagger-ui')
            ->assertSee('/api/docs/openapi.json');
    }
}
