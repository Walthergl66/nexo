#!/bin/sh
set -e

cd /var/www/html

# Install composer dependencies if vendor is missing
if [ ! -f vendor/autoload.php ]; then
    echo "[entrypoint] Running composer install..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# Run migrations
echo "[entrypoint] Running migrations..."
php artisan migrate --force --no-interaction

# Clear and cache config for performance
php artisan config:cache --no-interaction
php artisan route:cache --no-interaction

echo "[entrypoint] Starting php-fpm..."
exec "$@"
