// Con realtime activo, el auto-refresh es solo una red de seguridad por si un
// evento en vivo se pierde; por eso puede ser holgado sin sentirse lento.
export const CATALOG_AUTO_REFRESH_MS = 20000;
export const PROFILE_AUTO_REFRESH_MS = 60000;
export const REFRESH_THROTTLE_MS = 10000;

// Pedidos y ventas son más sensibles al tiempo que el catálogo: mientras el
// comprador mira su pedido o el vendedor gestiona sus ventas, se refresca cada
// pocos segundos para que un cambio de estado aparezca casi en vivo. El intervalo
// solo corre con la pantalla abierta, así que no pesa en segundo plano.
export const ORDERS_AUTO_REFRESH_MS = 10000;
