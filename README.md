# nexo

nexo es una app marketplace confiable para emprendedores. El backend usa Laravel como capa de negocio y Supabase para identidad, PostgreSQL y storage.

## Estructura

```txt
nexo/
├── backend/   # API REST Laravel
├── mobile/    # app movil objetivo
├── docs/      # documentacion tecnica
├── AGENTS.md  # contexto vivo del proyecto
└── README.md
```

Nota: existe una carpeta `frontend/` heredada con Expo. La carpeta objetivo para la app movil nueva es `mobile/`.

## Backend

Stack:

* Laravel 13 + PHP 8.3.
* PostgreSQL en Supabase.
* Supabase Auth como identidad.
* Supabase Storage para archivos.
* Stripe Checkout y Stripe Connect en fases posteriores.
* PayPal en segunda fase.
* PHPUnit para tests iniciales.

## Autenticacion

Laravel no registra ni valida passwords propios. El frontend obtiene un JWT desde Supabase Auth y lo envia al backend:

```http
Authorization: Bearer <supabase_access_token>
```

El backend valida el JWT con `SUPABASE_JWT_SECRET`, sincroniza `profiles` y expone:

```http
GET /api/me
```

## Variables principales

Configura `backend/.env` usando `backend/.env.example`:

```dotenv
APP_NAME=nexo
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=<supabase-host>
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=<password>
DB_SSLMODE=require

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_JWT_SECRET=<jwt-secret>
SUPABASE_JWT_ALGORITHM=HS256
SUPABASE_AUTH_AUDIENCE=authenticated
```

## Correr localmente

```bash
cd backend
composer update
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

La API queda disponible en `http://127.0.0.1:8000`.

## Tests

```bash
cd backend
php artisan test
```

Los tests usan SQLite en memoria para no depender de Supabase.
