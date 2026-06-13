# nexo backend

API REST de nexo construida con Laravel 13. Supabase Auth identifica usuarios y Laravel mantiene la logica de negocio, perfiles, roles y permisos.

## Requisitos

* PHP 8.3+
* Composer
* PostgreSQL Supabase para desarrollo real
* SQLite disponible para tests

## Configuracion

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Configura Supabase en `.env`:

```dotenv
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

## Base de datos

```bash
php artisan migrate
```

Migracion inicial propia:

* `profiles`: perfil interno enlazado por `supabase_user_id`, rol y estado de verificacion.

## API

Endpoint protegido:

```http
GET /api/me
Authorization: Bearer <supabase_access_token>
```

Si el JWT es valido y no existe un profile local, el backend lo crea automaticamente con:

* `role=buyer`
* `verification_status=pending`

### Seller Verification

```http
POST /api/seller-verification/request
Authorization: Bearer <supabase_access_token>
```

Payload:

```json
{
  "business_name": "Nexo Store",
  "business_description": "Productos hechos por emprendedores.",
  "document_type": "ruc",
  "document_number": "1234567890001"
}
```

Endpoints admin:

```http
GET /api/admin/seller-verification-requests
PATCH /api/admin/seller-verification-requests/{sellerVerificationRequest}
```

Estados permitidos en revision admin:

* `approved`
* `rejected`
* `suspended`

## Tests

```bash
php artisan test
```

Los tests corren con SQLite en memoria.
