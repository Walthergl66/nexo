#!/usr/bin/env sh
set -eu

if [ ! -f composer.lock ]; then
  echo "composer.lock not found. Are you mounting the backend directory?"
  exit 1
fi

if [ ! -d vendor ] || [ ! -f vendor/autoload.php ]; then
  composer install --no-interaction --prefer-dist
fi

php artisan config:clear >/dev/null 2>&1 || true
php artisan route:clear >/dev/null 2>&1 || true
php artisan view:clear >/dev/null 2>&1 || true

exec "$@"
