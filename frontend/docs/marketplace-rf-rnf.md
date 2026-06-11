# Nexo · Idea inicial del marketplace

## 1. Visión del producto
Nexo será una app móvil de compra y venta tipo marketplace, enfocada en conectar compradores y vendedores dentro de una misma plataforma con experiencia simple, segura y escalable.

La propuesta del MVP se apoya en 5 pilares:

1. Descubrimiento de productos
2. Conversión a compra
3. Gestión de publicaciones
4. Logística y seguimiento
5. Confianza, reputación y postventa

## 2. Actores principales

### Comprador
- Busca productos por nombre, categoría o vendedor.
- Filtra por precio, envío, condición y reputación.
- Agrega productos al carrito y realiza pagos.
- Da seguimiento a sus pedidos.
- Califica productos y vendedores.

### Vendedor
- Publica productos con stock, precio y condiciones.
- Administra pedidos recibidos.
- Confirma despacho y tiempos de entrega.
- Gestiona reputación, reclamos y devoluciones.

### Administrador
- Supervisa usuarios, catálogos y reportes.
- Gestiona categorías, comisiones y promociones.
- Interviene en fraudes, reclamos y conflictos.

## 3. Lógica de negocio base

### Catálogo
- Un producto pertenece a una categoría.
- Un vendedor puede tener múltiples publicaciones.
- Cada publicación debe tener nombre, descripción, precio, stock, fotos y condición.
- Un producto sin stock no debe permitir compra.

### Compra
- Un comprador puede agregar uno o más productos al carrito.
- Antes de pagar, el sistema debe revalidar stock y precio.
- El checkout debe contemplar dirección, método de entrega y método de pago.
- La orden cambia de estado según el ciclo: pendiente, pagado, empacado, enviado, entregado, cancelado.

### Pagos
- El pago debe confirmarse antes de liberar la orden al vendedor.
- Debe existir trazabilidad de intento, aprobación o rechazo.
- El sistema debe contemplar reembolso parcial o total.

### Envíos
- Cada orden debe registrar tipo de entrega, costo, ciudad y ETA.
- El vendedor debe marcar despacho con evidencia o guía.
- El comprador debe poder ver el estado actualizado del pedido.

### Reputación
- La reputación del vendedor depende de cumplimiento, calificaciones, reclamos y tiempos de respuesta.
- Los productos mejor rankeados deben considerar relevancia + reputación + conversión.

### Postventa
- El comprador puede abrir reclamo por producto no recibido, dañado o diferente.
- Deben existir ventanas de tiempo para devolución o reclamo.
- El administrador puede mediar cuando no exista acuerdo entre las partes.

## 4. Requerimientos funcionales (RF)

### RF-01 Gestión de usuarios
- Registro e inicio de sesión para compradores y vendedores.
- Recuperación de contraseña.
- Gestión de perfil, direcciones y métodos de contacto.

### RF-02 Catálogo de productos
- Visualizar listado de productos por categorías.
- Buscar productos por texto libre.
- Filtrar por categoría, precio, envío, condición y reputación.
- Ordenar por relevancia, precio, novedad y calificación.

### RF-03 Detalle de producto
- Mostrar fotos, descripción, precio, stock, vendedor, reputación y opciones de envío.
- Permitir agregar al carrito o comprar directamente.

### RF-04 Carrito y checkout
- Agregar, actualizar y eliminar productos del carrito.
- Calcular subtotal, envío, comisiones e importe total.
- Confirmar dirección, método de entrega y método de pago.

### RF-05 Gestión de órdenes
- Crear orden luego del pago exitoso.
- Visualizar historial y detalle de órdenes.
- Actualizar estado de pedido y notificar cambios.

### RF-06 Gestión del vendedor
- Crear, editar, pausar y eliminar publicaciones.
- Gestionar stock y precios.
- Ver pedidos recibidos y confirmar despacho.

### RF-07 Notificaciones
- Notificar pago aprobado o rechazado.
- Notificar cambios de estado de pedido.
- Notificar promociones, mensajes o incidencias.

### RF-08 Calificaciones y reputación
- Permitir reseñas del comprador al finalizar la compra.
- Mostrar reputación del vendedor y score del producto.

### RF-09 Reclamos y devoluciones
- Registrar reclamos con motivo y evidencia.
- Gestionar resolución, devolución o reembolso.

### RF-10 Panel administrativo
- Administrar usuarios, categorías, publicaciones reportadas y métricas.
- Gestionar comisiones, campañas y contenido moderado.

## 5. Requerimientos no funcionales (RNF)

### RNF-01 Usabilidad
- La interfaz debe ser intuitiva y mobile-first.
- Las acciones críticas deben completarse en pocos pasos.

### RNF-02 Rendimiento
- El catálogo debe cargar de forma fluida.
- La búsqueda y filtros deben responder rápidamente.

### RNF-03 Seguridad
- Las credenciales deben protegerse adecuadamente.
- Las operaciones de pago deben ser seguras y auditables.
- Deben existir roles y permisos según tipo de usuario.

### RNF-04 Disponibilidad
- La app debe tolerar crecimiento progresivo en usuarios y publicaciones.
- Debe minimizar caídas en procesos críticos como checkout y órdenes.

### RNF-05 Escalabilidad
- La arquitectura debe soportar nuevas categorías, ciudades y métodos de pago.
- Debe facilitar integración futura con courier, pasarela y analítica.

### RNF-06 Mantenibilidad
- El código debe ser modular, claro y documentado.
- La lógica de negocio debe estar separada de la capa visual.

### RNF-07 Compatibilidad
- La app debe funcionar correctamente en Android y iOS.
- La experiencia debe adaptarse a distintos tamaños de pantalla.

### RNF-08 Observabilidad
- Deben registrarse eventos clave: login, búsqueda, carrito, pago, despacho y reclamos.
- Deben existir métricas para conversión, abandono y cumplimiento.

## 6. Entidades sugeridas
- Usuario
- Vendedor
- Producto
- Categoría
- Carrito
- Orden
- Pago
- Envío
- Reseña
- Reclamo
- Notificación

## 7. MVP recomendado

### Fase 1
- Registro/login
- Home con catálogo
- Búsqueda y filtros
- Detalle de producto
- Carrito
- Checkout básico
- Gestión simple de publicaciones
- Seguimiento básico de pedido

### Fase 2
- Reputación y reseñas
- Reclamos y devoluciones
- Promociones
- Panel administrativo
- Analítica comercial

## 8. Qué ya queda reflejado en la maqueta
- Navegación por tabs clave del negocio
- Catálogo con filtros y búsqueda
- Resumen de checkout
- Panel vendedor
- Seguimiento de pedidos
- Señales de seguridad, reputación y escalabilidad
