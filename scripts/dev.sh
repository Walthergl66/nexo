#!/usr/bin/env bash

PORT=${1:-8010}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

MOBILE_ENV="$REPO_ROOT/mobile/.env.local"
MOBILE_EXAMPLE="$REPO_ROOT/mobile/.env.example"
BACKEND_ENV="$REPO_ROOT/backend/.env"
ADMIN_ENV="$REPO_ROOT/admin/.env.local"
ADMIN_EXAMPLE="$REPO_ROOT/admin/.env.example"
ADMIN_DIR="$REPO_ROOT/admin"
MOBILE_DIR="$REPO_ROOT/mobile"

# ---------------------------------------------------------------------------
# 1) Actualizar IPs (mobile, admin y CORS del backend)
# ---------------------------------------------------------------------------

# Crear .env.local si no existe
if [ ! -f "$MOBILE_ENV" ]; then
    if [ -f "$MOBILE_EXAMPLE" ]; then
        cp "$MOBILE_EXAMPLE" "$MOBILE_ENV"
    else
        touch "$MOBILE_ENV"
    fi
fi

# Obtener IP local (compatible con Git Bash / Windows / Linux / macOS)
# Prioriza IP WiFi/LAN (192.168.x o 10.x) sobre IPs Docker/internal/link-local
if command -v powershell.exe &>/dev/null; then
    IP=$(powershell.exe -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \$_.InterfaceAlias -notlike '*Loopback*' -and \$_.IPAddress -ne '127.0.0.1' -and \$_.IPAddress -notlike '172.*' -and \$_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress" 2>/dev/null | tr -d '\r')
fi
if [ -z "$IP" ] && command -v ip &>/dev/null; then
    IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}')
fi
if [ -z "$IP" ] && command -v ifconfig &>/dev/null; then
    IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | grep -v '169.254' | grep -v '172\.' | awk '{print $2}' | head -1)
fi

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

# Crear admin/.env.local si no existe
if [ ! -f "$ADMIN_ENV" ]; then
    if [ -f "$ADMIN_EXAMPLE" ]; then
        cp "$ADMIN_EXAMPLE" "$ADMIN_ENV"
    else
        touch "$ADMIN_ENV"
    fi
fi

# Actualizar Admin API URL
grep -q "^NEXT_PUBLIC_API_BASE_URL=" "$ADMIN_ENV" \
    && sed -i "s|^NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=$API_URL|" "$ADMIN_ENV" \
    || echo "NEXT_PUBLIC_API_BASE_URL=$API_URL" >> "$ADMIN_ENV"

echo "Admin API URL actualizada:"
echo "NEXT_PUBLIC_API_BASE_URL=$API_URL"

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

# ---------------------------------------------------------------------------
# 2) Levantar admin y mobile a la vez
# ---------------------------------------------------------------------------

PIDS=()

cleanup() {
    echo ""
    echo "Deteniendo procesos..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null
    done
    wait 2>/dev/null
    exit 0
}

trap cleanup INT TERM

echo ""
echo "Levantando admin (Next.js)..."
(cd "$ADMIN_DIR" && npm run dev) &
PIDS+=($!)

echo "Levantando mobile (Expo)..."
(cd "$MOBILE_DIR" && npx expo start --clear) &
PIDS+=($!)

echo ""
echo "Admin y mobile levantados. Ctrl+C para detener ambos."

wait
