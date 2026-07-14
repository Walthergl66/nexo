const tones = ['light', 'cool', 'dark', 'warm'];

function centsToAmount(value) {
  return Math.max(Number(value ?? 0), 0) / 100;
}

function pickTone(id) {
  const source = String(id ?? '');
  const sum = [...source].reduce((total, character) => total + character.charCodeAt(0), 0);

  return tones[sum % tones.length];
}

function pickPrimaryImageUrl(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  const sorted = [...images].sort(
    (first, second) => Number(first?.position ?? 0) - Number(second?.position ?? 0),
  );
  const primary = sorted.find(
    (image) => typeof image?.url === 'string' && image.url.trim().length > 0,
  );

  return primary ? primary.url : null;
}

function mapApiProductToProduct(product) {
  const category = product?.category?.name ?? 'General';
  const seller = product?.store?.name ?? 'Tienda verificada';
  const stock = Number(product?.stock ?? 0);

  return {
    id: String(product?.id ?? ''),
    title: String(product?.name ?? 'Producto sin nombre'),
    description: String(product?.description ?? 'Producto publicado por un vendedor verificado en NEXO.'),
    category,
    price: centsToAmount(product?.price_cents),
    stock,
    available: product?.status === 'active' && stock > 0,
    seller,
    imageUrl: pickPrimaryImageUrl(product?.images),
    visualTone: pickTone(product?.id),
  };
}

function mapApiCartItemsToCartItems(items) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item?.product)
    .map((item) => ({
      id: String(item.id ?? ''),
      product: mapApiProductToProduct(item.product),
      quantity: Number(item.quantity ?? 0),
    }))
    .filter((item) => item.quantity > 0);
}

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

function normalizeOrderStatus(status) {
  return ORDER_STATUSES.includes(status) ? status : 'pending';
}

function normalizePaymentStatus(status) {
  return PAYMENT_STATUSES.includes(status) ? status : 'pending';
}

function mapApiOrderItem(item) {
  return {
    id: String(item?.id ?? ''),
    productName: String(item?.product_name ?? 'Producto'),
    storeName: String(item?.store_name ?? ''),
    unitPrice: centsToAmount(item?.unit_price_cents),
    quantity: Number(item?.quantity ?? 0),
    subtotal: centsToAmount(item?.subtotal_cents),
  };
}

function mapApiOrderToOrder(order) {
  const items = Array.isArray(order?.items) ? order.items.map(mapApiOrderItem) : [];

  return {
    id: String(order?.id ?? order?.order_number ?? ''),
    orderNumber: String(order?.order_number ?? ''),
    status: normalizeOrderStatus(order?.status),
    paymentStatus: normalizePaymentStatus(order?.payment_status),
    currency: String(order?.currency ?? 'USD'),
    subtotal: centsToAmount(order?.subtotal_cents),
    shipping: centsToAmount(order?.shipping_cents),
    total: centsToAmount(order?.total_cents),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: typeof order?.created_at === 'string' ? order.created_at : null,
    items,
  };
}

function mapApiCartSummary(meta) {
  return {
    subtotal: centsToAmount(meta?.subtotal_cents),
    shipping: centsToAmount(meta?.shipping_cents),
    total: centsToAmount(meta?.total_cents),
    currency: String(meta?.currency ?? 'USD'),
    itemCount: Number(meta?.item_count ?? 0),
  };
}

module.exports = {
  centsToAmount,
  mapApiCartItemsToCartItems,
  mapApiCartSummary,
  mapApiOrderToOrder,
  mapApiProductToProduct,
  pickPrimaryImageUrl,
  pickTone,
};
