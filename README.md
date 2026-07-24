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

* Laravel 13 + PHP 8.4.
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
APP_URL=http://localhost:8010

DB_CONNECTION=pgsql
DB_HOST=<supabase-host>
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=<password>
DB_SSLMODE=require
DB_PROTECTED=true

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_JWT_SECRET=<jwt-secret>
SUPABASE_JWT_ALGORITHM=HS256
SUPABASE_AUTH_AUDIENCE=authenticated
```

## Correr localmente con Docker recomendado

Docker levanta Laravel con Nginx + PHP-FPM y PHP 8.4, mas estable que `php artisan serve` para probar desde celular o web.

```bash
cp backend/.env.example backend/.env
cd backend
php artisan key:generate
cd ..
docker compose up --build
```

La API queda disponible en:

```txt
http://127.0.0.1:8010/api
```

Para usarla desde un celular fisico, reemplaza `127.0.0.1` por la IP local de tu PC en `mobile/.env.local`:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://TU_IP_LOCAL:8010/api
```

En Windows puedes actualizar esa IP automaticamente cuando cambies de red:

```powershell
.\scripts\update-mobile-api-url.ps1
```

Luego reinicia Expo con cache limpia:

```bash
cd mobile
npx expo start -c
```

Comandos utiles:

```bash
docker compose exec backend php artisan migrate
docker compose exec backend php artisan config:clear
docker compose logs -f backend backend-web
docker compose down
```

Si aparece un error aunque Docker este arriba, revisa que no siga corriendo `php artisan serve` en el mismo puerto:

```powershell
Get-NetTCPConnection -LocalPort 8010
```

## Correr localmente sin Docker

```bash
cd backend
composer update
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

La API queda disponible en `http://127.0.0.1:8000`. Esta opcion es util para pruebas rapidas, pero puede quedarse corta si pruebas con celular y varias peticiones concurrentes.

## Respaldos y proteccion de la base

Hoy no hay una base de desarrollo aparte: `backend/.env` apunta a la misma base de Supabase que usa la app. Un `migrate:fresh` mal apuntado borra los datos reales, asi que `DB_PROTECTED=true` aborta `migrate:fresh`, `migrate:refresh`, `migrate:reset` y `db:wipe` antes de que toquen nada:

```txt
WARN This command is prohibited from running in this environment.
```

Los tests quedan exentos: corren sobre SQLite en memoria y necesitan recrear esa base en cada corrida.

Antes de cualquier cambio de esquema conviene volcar los datos:

```bash
php scripts/backup-db.php
```

Genera `backups/nexo-data-AAAAMMDD-HHMMSS.sql` con los INSERTs de todas las tablas, ordenadas por llaves foraneas. La carpeta `backups/` esta en `.gitignore` porque contiene datos reales de usuarios. Para restaurar sobre una base vacia:

```bash
cd backend
php artisan migrate
psql "CONNECTION_STRING" -f ../backups/nexo-data-AAAAMMDD-HHMMSS.sql
```

## Pagos con Stripe (modo test)

El pago usa **Stripe Checkout** en modo test. El flujo real es: la app pide una sesión de pago, el comprador paga en Stripe, y Stripe confirma por **webhook firmado** — el backend nunca da una orden por pagada porque el cliente lo diga.

Variables en `backend/.env` (claves de prueba del dashboard de Stripe):

```dotenv
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:8010/checkout/success
STRIPE_CANCEL_URL=http://localhost:8010/checkout/cancel
```

Para recibir los webhooks en local, con la [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe login
stripe listen --forward-to http://127.0.0.1:8010/api/webhooks/stripe
```

El `whsec_...` que imprime `stripe listen` es el `STRIPE_WEBHOOK_SECRET`. Tarjeta de prueba: `4242 4242 4242 4242`, cualquier fecha futura y CVC.

> Endpoints: `POST /api/orders/{order}/checkout` (autenticado, devuelve `checkout_url`) y `POST /api/webhooks/stripe` (público, verificado por firma). El viejo `POST /api/orders/{order}/pay` queda solo fuera de producción para pruebas.

## Tests

```bash
cd backend
php artisan test
```

Los tests usan SQLite en memoria para no depender de Supabase.
