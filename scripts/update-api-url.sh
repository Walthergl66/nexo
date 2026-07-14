#!/usr/bin/env bash

PORT=${1:-8010}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

MOBILE_ENV="$REPO_ROOT/mobile/.env.local"
MOBILE_EXAMPLE="$REPO_ROOT/mobile/.env.example"
BACKEND_ENV="$REPO_ROOT/backend/.env"
ADMIN_EXAMPLE="$REPO_ROOT/admin/.env.example"

# Crear .env.local si no existe
if [ ! -f "$MOBILE_ENV" ]; then
    if [ -f "$MOBILE_EXAMPLE" ]; then
        cp "$MOBILE_EXAMPLE" "$MOBILE_ENV"
    else
        touch "$MOBILE_ENV"
    fi
fi

# Obtener IP local
IP=$(hostname -I | awk '{print $1}')

if [ -z "$IP" ]; then
    echo "No se pudo detectar una IP local."
    exit 1
fi

API_URL="http://$IP:$PORT/api"

# Actualizar EXPO_PUBLIC_API_BASE_URL
grep -q "^EXPO_PUBLIC_API_BASE_URL=" "$MOBILE_ENV" \
    && sed -i "s|^EXPO_PUBLIC_API_BASE_URL=.*|EXPO_PUBLIC_API_BASE_URL=$API_URL|" "$MOBILE_ENV" \
    || echo "EXPO_PUBLIC_API_BASE_URL=$API_URL" >> "$MOBILE_ENV"

echo "Mobile API URL actualizada:"
echo "EXPO_PUBLIC_API_BASE_URL=$API_URL"

# Actualizar Admin API URL
if [ -f "$ADMIN_EXAMPLE" ]; then

grep -q "^NEXT_PUBLIC_API_BASE_URL=" "$ADMIN_EXAMPLE" \
    && sed -i "s|^NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=$API_URL|" "$ADMIN_EXAMPLE" \
    || echo "NEXT_PUBLIC_API_BASE_URL=$API_URL" >> "$ADMIN_EXAMPLE"

echo "Admin API URL actualizada:"
echo "NEXT_PUBLIC_API_BASE_URL=$API_URL"

fi

# Actualizar CORS
if [ -f "$BACKEND_ENV" ]; then

CORS="http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,http://localhost:5173,http://localhost:8081,http://127.0.0.1:8081,http://localhost:8100,http://127.0.0.1:8100,http://$IP:3000,http://$IP:8081,http://$IP:19006"

grep -q "^CORS_ALLOWED_ORIGINS=" "$BACKEND_ENV" \
    && sed -i "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=$CORS|" "$BACKEND_ENV" \
    || echo "CORS_ALLOWED_ORIGINS=$CORS" >> "$BACKEND_ENV"

echo "Backend CORS actualizado."
echo "Si Docker está levantado ejecuta:"
echo "docker compose exec backend php artisan config:clear"

fi