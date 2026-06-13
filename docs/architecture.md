# Arquitectura inicial

## Principio

Supabase Auth identifica al usuario. Laravel decide permisos y reglas de negocio.

## Fase 0 y Fase 1

La primera base del sistema incluye:

* API REST Laravel en `backend/`.
* Configuracion PostgreSQL para Supabase.
* CORS para clientes web y moviles.
* Middleware `supabase.jwt`.
* Servicio `SupabaseAuthService`.
* Tabla `profiles` enlazada por `supabase_user_id`.
* Endpoint `GET /api/me`.
* Policy base de perfiles.

## JWT

La validacion inicial es local con `SUPABASE_JWT_SECRET` y `HS256`.

Antes de produccion, si el proyecto de Supabase usa llaves asimetricas, el backend debe validar con JWKS y cachear las llaves publicas.
