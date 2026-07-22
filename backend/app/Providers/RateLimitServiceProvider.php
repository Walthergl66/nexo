<?php

namespace App\Providers;

use App\Models\Profile;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\HttpFoundation\Response;

/**
 * Limites de peticiones de la API.
 *
 * Hay dos capas. La de IP ('api') cuelga del grupo de middleware en
 * bootstrap/app.php y cubre todo /api, incluso lo que falla la autenticacion.
 * La de usuario ('user') se aplica dentro del grupo autenticado en
 * routes/api.php, despues de supabase.jwt, que es donde ya se sabe quien pide.
 *
 * Ojo con la capa de IP: detras de un proxy la cabecera X-Forwarded-For la pone
 * el cliente, y aunque Render la reescribe, un atacante decidido puede rotarla.
 * Por eso los limites por IP son una red gruesa, no la defensa principal: lo que
 * de verdad protege es el limite por usuario y, en los endpoints publicos, tener
 * el cupo bajo.
 */
class RateLimitServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Red general. Holgada a proposito: la app movil refresca el catalogo
        // cada 20s y el perfil cada 60s, asi que un usuario activo ronda las 5
        // peticiones por minuto. Esto solo corta trafico automatizado.
        RateLimiter::for('api', fn (Request $request): Limit => Limit::perMinute(300)
            ->by($request->ip() ?? 'unknown')
            ->response($this->tooManyRequests()));

        // Limite por persona dentro del grupo autenticado. Cuenta por perfil, no
        // por IP, para que varios usuarios tras la misma red (una universidad,
        // un cibercafe) no compartan cupo.
        RateLimiter::for('user', function (Request $request): Limit {
            $profile = $request->attributes->get('profile');

            $limit = $profile instanceof Profile
                ? Limit::perMinute(120)->by('profile:'.$profile->getKey())
                : Limit::perMinute(60)->by('ip:'.($request->ip() ?? 'unknown'));

            return $limit->response($this->tooManyRequests());
        });

        // Consulta de cedula: publica por necesidad (ocurre durante el registro,
        // antes de que exista sesion) y cada peticion gasta una consulta al
        // servicio externo. Cupo minimo, suficiente para corregir un tipeo.
        RateLimiter::for('identity', fn (Request $request): Limit => Limit::perMinute(5)
            ->by($request->ip() ?? 'unknown')
            ->response($this->tooManyRequests(
                'Demasiadas consultas de cedula. Espera un minuto antes de reintentar.',
            )));

        // Disponibilidad de correo y cedula: publica por la misma razon, pero el
        // formulario la llama al salir de cada campo, asi que necesita mas aire.
        RateLimiter::for('availability', fn (Request $request): Limit => Limit::perMinute(20)
            ->by($request->ip() ?? 'unknown')
            ->response($this->tooManyRequests()));
    }

    /**
     * Respuesta 429 en el formato que ya entiende el cliente movil: lee
     * `message` y lo muestra tal cual.
     */
    private function tooManyRequests(?string $message = null): callable
    {
        return static fn (Request $request, array $headers): Response => response()->json(
            ['message' => $message ?? 'Demasiadas peticiones. Espera un momento e intenta de nuevo.'],
            Response::HTTP_TOO_MANY_REQUESTS,
            $headers,
        );
    }
}
