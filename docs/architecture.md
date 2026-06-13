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
* Tabla `seller_verification_requests` para historial de solicitudes de vendedor.
* Endpoints protegidos para solicitar, listar y revisar verificaciones de vendedor.
* Tabla `stores` con una tienda por perfil vendedor.
* Endpoints publicos para listar y ver tiendas activas.
* Endpoints protegidos para crear, ver y actualizar tienda propia.

## JWT

La validacion inicial es local con `SUPABASE_JWT_SECRET` y `HS256`.

Antes de produccion, si el proyecto de Supabase usa llaves asimetricas, el backend debe validar con JWKS y cachear las llaves publicas.

## Seller Verification

Un buyer puede solicitar verificacion de vendedor. La solicitud queda en estado `pending` y un admin puede cambiarla a:

* `approved`: el perfil pasa a `role=seller` y `verification_status=approved`.
* `rejected`: el perfil queda como `role=buyer` y `verification_status=rejected`.
* `suspended`: el perfil queda como `role=seller` y `verification_status=suspended`.

Cada revision registra `reviewed_by` y `reviewed_at`.

## Stores

Un seller aprobado puede crear una sola tienda. La tienda inicia como `active` porque la verificacion de vendedor es el control principal antes de permitir ventas.

Los endpoints publicos solo exponen tiendas `active`. Las tiendas `suspended` no aparecen en el marketplace publico.
