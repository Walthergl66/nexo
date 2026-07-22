<?php

use App\Modules\Auth\Http\Middleware\ValidateSupabaseJwt;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Render termina TLS en su balanceador y reenvia al contenedor. Sin
        // confiar en ese proxy, $request->ip() devuelve la IP del balanceador y
        // todos los usuarios caerian en el mismo cubo del rate limiter: el
        // primero en llegar al tope bloquearia al resto.
        $middleware->trustProxies(at: '*');

        $middleware->append(HandleCors::class);

        // Red de seguridad por IP sobre todo /api, incluidas las peticiones que
        // ni siquiera llegan a autenticarse. El limite fino por usuario se
        // aplica dentro del grupo autenticado (routes/api.php), porque alli ya
        // se sabe de quien es la peticion.
        $middleware->throttleApi();

        $middleware->alias([
            'supabase.jwt' => ValidateSupabaseJwt::class,
        ]);

        // Laravel ordena el middleware por su lista de prioridad, no por el
        // orden en que se declara en la ruta. Sin esto, throttle:user correria
        // antes de validar el token y no encontraria el perfil, asi que contaria
        // por IP y todos los usuarios de una misma red compartirian cupo.
        $middleware->prependToPriorityList(
            before: ThrottleRequests::class,
            prepend: ValidateSupabaseJwt::class,
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
