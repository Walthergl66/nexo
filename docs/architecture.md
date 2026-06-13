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
* Tabla `categories` administrada por admin.
* Tablas `products` y `product_images`.
* Endpoints publicos para listar y ver productos activos.
* Endpoints protegidos para que sellers gestionen sus productos.
* Tabla `cart_items` por perfil comprador.
* Endpoints protegidos para gestionar carrito.
* Tablas `orders` y `order_items`.
* Endpoint protegido para crear orden desde carrito.

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

## Categories y Products

Las categorias son administradas por admins y los listados publicos solo muestran categorias `active`.

Los productos pertenecen a una tienda y pueden pertenecer a una categoria. Se crean como `draft` por defecto. Solo pueden publicarse si la tienda asociada está `active`.

Los precios se guardan como enteros en centavos (`price_cents`) para evitar errores de precision en pagos. La moneda se guarda como codigo ISO de 3 letras en `currency`.

## Cart

El carrito se guarda como items por `profile_id`. Cada usuario tiene un solo carrito activo implicito.

Agregar o actualizar items valida que el producto esté `active`, que la tienda esté `active` y que la cantidad no exceda el stock actual. El carrito no descuenta inventario; checkout y pagos deberán revalidar los items antes de crear orden o confirmar stock.

## Orders

Las ordenes se crean desde el carrito y guardan snapshot de producto, tienda, precio, moneda y cantidad en `order_items`.

Crear una orden revalida productos activos, tiendas activas, moneda unica y stock suficiente. La orden inicia con `status=pending` y `payment_status=pending`, limpia el carrito y no descuenta stock. El descuento de inventario se hara cuando el pago sea confirmado por webhook.
