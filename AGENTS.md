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
* La validación inicial de JWT se hace localmente con `SUPABASE_JWT_SECRET` y `SUPABASE_JWT_ALGORITHM=HS256`.
* Si Supabase se configura con llaves asimétricas, se debe evolucionar `SupabaseAuthService` a validación JWKS antes de producción.
* Laravel no usa `users` como identidad principal para la API. La identidad de negocio está en `profiles.supabase_user_id`.
* `GET /api/me` crea automáticamente el `profile` si el JWT de Supabase es válido y aún no existe.
* Los roles y estados se modelan como strings controlados por constantes del modelo `Profile` para mantener portabilidad entre PostgreSQL y SQLite de pruebas.

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
├── mobile/
├── docs/
├── AGENTS.md
└── README.md
```

Nota: existe una carpeta histórica `frontend/` con un proyecto Expo. La estructura objetivo del monorepo usa `mobile/`; no mover código existente sin revisar el impacto.

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
