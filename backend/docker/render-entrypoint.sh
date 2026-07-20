#!/usr/bin/env sh
set -eu

# Render inyecta PORT; el default solo sirve para probar la imagen en local.
: "${PORT:=8080}"

# Las variables de entorno solo existen en runtime, por eso el cache se arma
# aqui y no en el build. route:cache queda fuera a proposito: routes/web.php
# usa closures y Laravel no puede serializarlas.
php artisan config:cache
php artisan view:cache

php artisan migrate --force

exec frankenphp php-server --root /app/public --listen ":${PORT}"
