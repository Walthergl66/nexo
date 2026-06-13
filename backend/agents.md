# AGENTS.md

## Proyecto

Nombre: nexo

## Descripción

nexo es una app marketplace confiable para emprendedores. La plataforma permitirá que vendedores verificados creen tiendas, publiquen productos y vendan de forma segura. Los compradores podrán explorar productos, navegar por tiendas digitales, agregar productos al carrito, pagar con Stripe o PayPal y calificar sus compras.

El objetivo principal de nexo es crear un ecosistema de compra y venta donde la confianza sea el centro del producto. Por eso los vendedores deberán pasar por un proceso de verificación antes de poder vender.

## Propuesta de valor

nexo no será solo un marketplace común. Será una plataforma enfocada en emprendedores que están empezando y necesitan un espacio confiable para vender sus productos.

La confianza será un elemento principal mediante:

* Registro único de usuarios.
* Verificación de vendedores.
* Reputación de usuarios.
* Reviews verificadas.
* Reportes.
* Disputas.
* Moderación administrativa.
* Auditoría de acciones críticas.

## Stack principal

* Backend: Laravel + PHP.
* Base de datos: PostgreSQL usando Supabase.
* Auth: Supabase Auth.
* Storage: Supabase Storage.
* Pagos principales: Stripe Checkout.
* Pagos marketplace: Stripe Connect.
* PayPal: segunda fase.
* Arquitectura: API REST modular.
* Testing: Pest o PHPUnit.

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
* No crear login propio con contraseña en Laravel.
* Usar Supabase Auth como proveedor de identidad.
* Validar JWT de Supabase en cada request protegida.
* Crear tabla profiles enlazada con supabase_user_id.
* No colocar lógica pesada en controladores.
* Usar Services para lógica de negocio.
* Usar Form Requests para validaciones.
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
* Antes de modificar una parte importante, revisar este archivo.

## Estructura recomendada del monorepo

```txt
nexo/
├── backend/
├── mobile/
├── docs/
├── AGENTS.md
├── README.md
└── .gitignore
```

## Estructura recomendada del backend

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

## Fases de desarrollo

### Fase 0: Preparación

* Crear monorepo.
* Crear backend Laravel.
* Crear README.md.
* Crear AGENTS.md.
* Crear docs/.
* Configurar .env.example.
* Configurar PostgreSQL Supabase.
* Configurar CORS.
* Configurar testing.
* Configurar estructura modular base.

### Fase 1: Supabase Auth Bridge

* Crear middleware de JWT.
* Crear SupabaseAuthService.
* Crear tabla profiles.
* Crear endpoint GET /api/me.
* Crear sincronización automática de profile.
* Crear roles buyer, seller y admin.
* Crear policies base.

### Fase 2: Seller Verification

* Crear seller_applications.
* Crear solicitud para convertirse en vendedor.
* Crear endpoints admin para aprobar o rechazar.
* Cambiar role a seller cuando se apruebe.
* Registrar auditoría.

### Fase 3: Stores

* Crear stores.
* Permitir tienda solo a vendedores aprobados.
* Crear slug único.
* Crear endpoints CRUD.
* Permitir suspensión por admin.

### Fase 4: Products

* Crear categories.
* Crear products.
* Crear product_images.
* Integrar Supabase Storage.
* Crear CRUD de productos.
* Crear búsqueda y filtros.

### Fase 5: Cart

* Crear carts.
* Crear cart_items.
* Validar producto activo y stock.
* Permitir actualizar cantidades.
* Permitir eliminar productos del carrito.

### Fase 6: Orders

* Crear orders.
* Crear order_items.
* Convertir carrito en orden.
* Congelar precios.
* Usar transacciones.
* Crear payment_status pending.

### Fase 7: Stripe

* Crear StripeService.
* Crear Stripe Checkout Session.
* Crear webhook de Stripe.
* Confirmar pago desde webhook.
* Actualizar orden.
* Descontar stock.
* Registrar payment_transactions.
* Preparar Stripe Connect.

### Fase 8: PayPal

* Crear PayPalService.
* Crear endpoints base.
* Crear webhook.
* Registrar transacciones.
* Mantener como segunda fase.

### Fase 9: Confianza

* Crear reviews verificadas.
* Crear reports.
* Crear disputes.
* Crear trust_score.
* Permitir suspensión de usuarios, tiendas y productos.

### Fase 10: Admin

* Crear endpoints admin.
* Aprobar vendedores.
* Rechazar vendedores.
* Suspender usuarios.
* Suspender tiendas.
* Rechazar productos.
* Resolver disputas.
* Ver métricas básicas.
* Crear audit_logs.

## Reglas de pagos

Los pagos deben confirmarse por webhook, no por respuesta del frontend.

Flujo correcto:

```txt
Usuario inicia checkout
        ↓
Laravel crea orden pending
        ↓
Laravel crea sesión Stripe
        ↓
Usuario paga
        ↓
Stripe envía webhook
        ↓
Laravel valida webhook
        ↓
Laravel marca orden como paid
        ↓
Laravel descuenta stock
        ↓
Laravel registra transacción
        ↓
Laravel dispara jobs/notificaciones
```

## Reglas de seguridad

* No confiar en datos enviados por el frontend.
* Validar permisos en backend.
* Validar estado del vendedor antes de publicar.
* Validar estado de tienda antes de vender.
* Validar stock antes de checkout.
* Validar pago desde webhook.
* No guardar información de tarjetas.
* Auditar acciones críticas.
* Usar rate limiting en endpoints sensibles.
* Usar policies para recursos privados.
* No exponer claves secretas al frontend.

## Variables de entorno esperadas

```env
APP_NAME=nexo
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=
DB_PORT=5432
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
SUPABASE_STORAGE_BUCKET=

STRIPE_KEY=
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_MODE=sandbox
```

## Prioridad actual

La prioridad actual es construir primero el backend base:

1. Monorepo.
2. Laravel en backend.
3. Conexión PostgreSQL Supabase.
4. Supabase Auth Bridge.
5. Profiles.
6. Roles.
7. Seller Verification.
8. Stores.
9. Products.

No avanzar a pagos hasta que usuarios, tiendas, productos, carrito y órdenes estén estables.
