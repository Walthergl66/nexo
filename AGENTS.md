# AGENTS.md

## Proyecto

Nombre: nexo

## Descripción

nexo es una app marketplace confiable para emprendedores. La plataforma permitirá que vendedores verificados creen tiendas, publiquen productos y vendan de forma segura. Los compradores podrán explorar productos, navegar por tiendas digitales, agregar productos al carrito, pagar con Stripe o PayPal y calificar sus compras.

El objetivo principal de nexo es crear un ecosistema de compra y venta donde la confianza sea el centro del producto. Por eso los vendedores deberán pasar por un proceso de verificación antes de poder vender.

## Stack oficial

* Backend: Laravel + PHP.
* Base de datos: PostgreSQL usando Supabase.
* Auth: Supabase Auth.
* Storage: Supabase Storage.
* Pagos principales: Stripe Checkout.
* Pagos marketplace: Stripe Connect.
* PayPal: segunda fase.
* Arquitectura: API REST modular.
* Testing: PHPUnit inicialmente.

## Decisión de autenticación

Supabase Auth será el proveedor principal de identidad.

Laravel NO debe crear autenticación propia con passwords al inicio.

Supabase Auth se encargará de:

* Registro.
* Login.
* Recuperación de contraseña.
* Verificación de email.
* JWT.
* Sesiones.
* OAuth futuro si se requiere.

Laravel se encargará de:

* Perfiles internos.
* Roles.
* Permisos.
* Verificación de vendedores.
* Tiendas.
* Productos.
* Carrito.
* Órdenes.
* Pagos.
* Reviews.
* Reportes.
* Disputas.
* Administración.
* Auditoría.

## Regla principal de arquitectura

Supabase Auth responde: quién es el usuario.

Laravel responde: qué puede hacer el usuario.

Toda regla sensible debe validarse en Laravel. No confiar únicamente en el frontend.

## Decisiones técnicas actuales

* El backend vive en `backend/` y usa Laravel 13 con PHP 8.3.
* La API protegida usa middleware `supabase.jwt`.
* La validación de JWT soporta `HS256` con `SUPABASE_JWT_SECRET` y tokens asimétricos `RS256`/`ES256` mediante JWKS público de Supabase.
* `SupabaseAuthService` obtiene las llaves desde `SUPABASE_URL/auth/v1/.well-known/jwks.json` y las cachea para validar tokens firmados con llaves rotables.
* En desarrollo local se usa `CACHE_STORE=file` para evitar que el cache de JWKS dependa de la latencia de PostgreSQL remoto en Supabase.
* Laravel no usa `users` como identidad principal para la API. La identidad de negocio está en `profiles.supabase_user_id`.
* `GET /api/me` crea automáticamente el `profile` si el JWT de Supabase es válido y aún no existe.
* Los roles y estados se modelan como strings controlados por constantes del modelo `Profile` para mantener portabilidad entre PostgreSQL y SQLite de pruebas.
* Las solicitudes para convertirse en vendedor se guardan en `seller_verification_requests` para conservar historial.
* La aprobación de una solicitud cambia el perfil a `role=seller` y `verification_status=approved`.
* El rechazo cambia el perfil a `role=buyer` y `verification_status=rejected`; la suspensión deja `role=seller` y usa `verification_status=suspended`.
* El rechazo o suspensión de un vendedor suspende también su tienda para retirarla de listados públicos e impedir compras de sus productos.
* Cada vendedor aprobado puede tener una sola tienda en `stores`.
* Como la verificación del vendedor ya es el control principal, una tienda nueva creada por un seller aprobado inicia con `store_status=active`.
* Los listados públicos de tiendas solo muestran tiendas `active`.
* `GET /api/seller-center` entrega el estado unificado del centro de ventas por usuario, derivado de `profiles`, `stores` y productos, para evitar inconsistencias entre pantallas.
* Las categorías se administran por admin y solo las categorías `active` aparecen en listados públicos.
* Los productos pertenecen a una tienda y pueden tener una categoría opcional.
* Los precios de productos se guardan como enteros en centavos (`price_cents`) y moneda ISO de 3 letras (`currency`).
* Los productos nuevos inician como `draft` salvo que el seller publique explícitamente con `status=active`.
* Los listados públicos de productos solo muestran productos `active` de tiendas `active`.
* `GET /api/my-products` devuelve una colección vacía si el seller aprobado aún no tiene tienda, en lugar de responder 404.
* `mobile/` permite tomar o subir imagen de producto, la guarda en Supabase Storage bucket `product-images` y envía la URL a Laravel en `product_images`.
* El carrito se modela con `cart_items` por `profile_id`; no existe tabla `carts` mientras solo haya un carrito activo por usuario.
* Agregar al carrito valida producto `active`, tienda `active` y stock suficiente, pero no descuenta stock.
* El checkout deberá revalidar carrito, precio, disponibilidad y stock antes de crear órdenes o iniciar pago.
* Las órdenes se crean desde el carrito como snapshot en `orders` y `order_items`.
* Crear una orden revalida productos, tiendas, moneda y stock, limpia el carrito y no descuenta inventario.
* Toda orden nueva inicia con `order_status=pending` y `payment_status=pending`; el pago se confirmará únicamente con webhooks.

## Roles

Los roles iniciales son:

* buyer
* seller
* admin

Todo usuario nuevo inicia como buyer.

Un buyer puede solicitar convertirse en seller.

Un admin puede aprobar, rechazar o suspender vendedores.

## Estados principales

### verification_status

* pending
* approved
* rejected
* suspended

### store_status

* pending
* active
* suspended

### product_status

* draft
* active
* paused
* rejected

### order_status

* pending
* processing
* shipped
* delivered
* cancelled

### payment_status

* pending
* paid
* failed
* refunded

## Decisiones técnicas actuales

* El backend vive en `backend/` y usa Laravel + PHP.
* Supabase Auth es el proveedor de identidad; Laravel valida permisos y reglas de negocio.
* La API protegida usa middleware `supabase.jwt`.
* Laravel no usa `users` como identidad principal para la API. La identidad de negocio está en `profiles.supabase_user_id`.
* La app Expo activa vive en `mobile/`.
* La web administrativa vive en `admin/` y usa Next.js; se mantiene separada de `mobile/` y solo contiene flujos del rol admin.
* La carpeta histórica `frontend/` fue migrada a `mobile/` y retirada del monorepo.
* `mobile/` consume el backend con `EXPO_PUBLIC_API_BASE_URL`.
* `mobile/` usa Supabase Auth con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`; el JWT de la sesion activa se envia a Laravel para rutas protegidas.
* `mobile/` consume el catálogo público desde `GET /api/products` y usa JWT para carrito, órdenes, perfil y tienda propia.
* `mobile/` refresca de forma periódica y al volver a primer plano el perfil, catálogo, categorías y centro de ventas para reflejar cambios hechos desde `admin/` sin recarga manual.
* `mobile/` registra usuarios desde la pantalla Cuenta: valida cedula por backend, crea usuario en Supabase Auth y completa el perfil interno en Laravel.
* Las fotos de perfil se guardan como archivos en Supabase Storage; Laravel conserva la URL oficial en `profiles.avatar_url` y sigue siendo la fuente de verdad del perfil.
* Laravel expone `GET /api/identity/lookup`, `GET /api/profiles/availability` y `PATCH /api/me/profile` para onboarding de perfiles.
* La documentación OpenAPI/Swagger del backend vive en `/api/docs` y `/api/docs/openapi.json`.
* El contrato OpenAPI se mantiene en `docs/openapi.json` y se sirve sin paquete externo de Swagger.
* `admin/` autentica con Supabase Auth, valida el rol `admin` contra `GET /api/me` y consume endpoints administrativos de Laravel con el JWT de Supabase.
* `admin/` gestiona solicitudes de vendedor, categorías y estado de tiendas con endpoints administrativos; los módulos de moderación de publicaciones, bloqueo de usuarios y advertencias quedan preparados hasta que existan endpoints administrativos dedicados en Laravel.
* `PATCH /api/admin/stores/{store}` permite al rol admin suspender o reactivar tiendas cambiando `store_status` entre `active` y `suspended`.
* `DELETE /api/admin/stores/{store}` permite al rol admin eliminar una tienda; sus productos se eliminan por cascada y las órdenes conservan snapshots de nombres/precios con referencias nulas.

## Módulos principales

* Auth Bridge
* Profiles
* Seller Verification
* Stores
* Categories
* Products
* Product Images
* Cart
* Orders
* Payments
* Stripe
* PayPal
* Reviews
* Reports
* Disputes
* Notifications
* Admin
* Audit Logs

## Reglas obligatorias para el agente

* Mantener este archivo actualizado cuando se tome una decisión técnica importante.
* Antes de modificar una parte importante, revisar este archivo.
* No crear login propio con contraseña en Laravel.
* Usar Supabase Auth como proveedor de identidad.
* Validar JWT de Supabase en cada request protegida.
* Crear tabla `profiles` enlazada con `supabase_user_id`.
* No colocar lógica pesada en controladores.
* Usar Services para lógica de negocio.
* Usar Form Requests para validaciones cuando haya payloads de entrada.
* Usar API Resources para respuestas.
* Usar Policies o Gates para permisos.
* Usar Jobs para procesos pesados, notificaciones o acciones posteriores al pago.
* Usar transacciones de base de datos en checkout, creación de órdenes y actualización de stock.
* Confirmar pagos únicamente mediante webhooks.
* No descontar stock hasta que el pago esté confirmado.
* No permitir vender a usuarios no verificados.
* No permitir publicar productos si la tienda no está activa.
* No permitir comprar productos de tiendas suspendidas.
* No guardar datos sensibles de tarjetas.
* Registrar auditoría en acciones críticas.
* Mantener código limpio, modular y escalable.

## Estructura del monorepo

```txt
nexo/
├── backend/
├── admin/
├── mobile/
├── docs/
├── AGENTS.md
└── README.md
```

Nota: la carpeta histórica `frontend/` fue migrada a `mobile/` y retirada del monorepo.

## Estructura del backend

```txt
backend/
└── app/
    ├── Modules/
    │   ├── Auth/
    │   ├── Profiles/
    │   ├── Sellers/
    │   ├── Stores/
    │   ├── Categories/
    │   ├── Products/
    │   ├── Cart/
    │   ├── Orders/
    │   ├── Payments/
    │   │   ├── Stripe/
    │   │   └── PayPal/
    │   ├── Reviews/
    │   ├── Reports/
    │   ├── Disputes/
    │   ├── Notifications/
    │   └── Admin/
    ├── Models/
    ├── Policies/
    ├── Services/
    └── Jobs/
```

## Fases

### Fase 0: Preparación

* Crear monorepo.
* Crear backend Laravel.
* Crear README.md.
* Crear AGENTS.md.
* Crear docs/.
* Configurar `.env.example`.
* Configurar PostgreSQL Supabase.
* Configurar CORS.
* Configurar testing.
* Configurar estructura modular base.

### Fase 1: Supabase Auth Bridge

* Crear middleware de JWT.
* Crear `SupabaseAuthService`.
* Crear tabla `profiles`.
* Crear endpoint `GET /api/me`.
* Crear sincronización automática de profile.
* Crear roles `buyer`, `seller` y `admin`.
* Crear policies base.

### Fase 2: Seller Verification

* Crear tabla `seller_verification_requests`.
* Crear endpoint para solicitar verificación de vendedor.
* Crear endpoints administrativos para listar y revisar solicitudes.
* Aprobar, rechazar o suspender vendedores desde Laravel.
* Mantener historial de revisiones y auditoría mínima con `reviewed_by` y `reviewed_at`.

### Fase 3: Stores

* Crear tabla `stores`.
* Permitir crear tienda únicamente a sellers aprobados.
* Restringir a una tienda por perfil vendedor.
* Crear endpoints públicos para listar y ver tiendas activas.
* Crear endpoints protegidos para ver y actualizar la tienda propia.

### Fase 4: Categories y Products

* Crear tabla `categories`.
* Crear tabla `products`.
* Crear tabla `product_images`.
* Administrar categorías desde endpoints admin.
* Permitir a sellers con tienda activa crear y actualizar productos.
* Crear productos como `draft` por defecto.
* Permitir publicar productos solo si la tienda está activa.
* Exponer públicamente solo productos activos de tiendas activas.

### Fase 5: Cart

* Crear tabla `cart_items`.
* Permitir agregar productos activos de tiendas activas.
* Validar cantidad contra stock disponible sin descontar inventario.
* Permitir listar, actualizar, eliminar items y vaciar carrito.
* Restringir cada item al `profile` propietario.

### Fase 6: Orders

* Crear tabla `orders`.
* Crear tabla `order_items`.
* Crear órdenes desde el carrito.
* Guardar snapshot de producto, tienda, precio, moneda y cantidad.
* Revalidar carrito antes de crear la orden.
* Limpiar carrito al crear orden.
* Mantener orden y pago en estado `pending`.
* No descontar stock hasta confirmación de pago por webhook.
