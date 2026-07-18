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
    slug: String(product?.slug ?? ''),
    title: String(product?.name ?? 'Producto sin nombre'),
    description: String(product?.description ?? 'Producto publicado por un vendedor verificado en NEXO.'),
    category,
    categoryId: product?.category_id != null ? String(product.category_id) : (product?.category?.id != null ? String(product.category.id) : null),
    price: centsToAmount(product?.price_cents),
    priceCents: Number(product?.price_cents ?? 0),
    stock,
    status: String(product?.status ?? 'draft'),
    available: product?.status === 'active' && stock > 0,
    seller,
    ownerProfileId:
      product?.owner_profile_id != null
        ? String(product.owner_profile_id)
        : product?.store?.profile_id != null
          ? String(product.store.profile_id)
          : null,
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

const FULFILLMENT_STATUSES = ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];

function normalizeFulfillmentStatus(status) {
  return FULFILLMENT_STATUSES.includes(status) ? status : 'pending';
}

function mapApiOrderItem(item) {
  return {
    id: String(item?.id ?? ''),
    productName: String(item?.product_name ?? 'Producto'),
    storeName: String(item?.store_name ?? ''),
    unitPrice: centsToAmount(item?.unit_price_cents),
    quantity: Number(item?.quantity ?? 0),
    fulfillmentStatus: normalizeFulfillmentStatus(item?.fulfillment_status),
    subtotal: centsToAmount(item?.subtotal_cents),
  };
}

function mapApiSale(sale) {
  const next = sale?.next_status;

  return {
    id: String(sale?.id ?? ''),
    orderId: String(sale?.order_id ?? ''),
    orderNumber: String(sale?.order_number ?? ''),
    productName: String(sale?.product_name ?? 'Producto'),
    quantity: Number(sale?.quantity ?? 0),
    subtotal: centsToAmount(sale?.subtotal_cents),
    currency: String(sale?.currency ?? 'USD'),
    fulfillmentStatus: normalizeFulfillmentStatus(sale?.fulfillment_status),
    nextStatus: FULFILLMENT_STATUSES.includes(next) ? next : null,
    buyerName: typeof sale?.buyer_name === 'string' && sale.buyer_name.length > 0 ? sale.buyer_name : null,
    createdAt: typeof sale?.created_at === 'string' ? sale.created_at : null,
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
  mapApiSale,
  pickPrimaryImageUrl,
  pickTone,
};
