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
    condition: 'Nuevo',
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

function mapApiOrderToOrder(order) {
  const firstItem = Array.isArray(order?.items) ? order.items[0] : null;
  const title = firstItem?.product_name
    ? `${firstItem.product_name}${order.items.length > 1 ? ` +${order.items.length - 1}` : ''}`
    : `Orden ${order?.order_number ?? order?.id ?? ''}`;

  return {
    id: String(order?.id ?? order?.order_number ?? ''),
    title,
    status: mapOrderStatus(order?.status),
    eta: order?.payment_status === 'paid' ? 'Pago confirmado' : 'Pago pendiente',
  };
}

function mapOrderStatus(status) {
  switch (status) {
    case 'processing':
      return 'Empacado';
    case 'shipped':
      return 'En camino';
    case 'delivered':
      return 'Entregado';
    default:
      return 'Pagado';
  }
}

module.exports = {
  centsToAmount,
  mapApiCartItemsToCartItems,
  mapApiOrderToOrder,
  mapApiProductToProduct,
  pickPrimaryImageUrl,
  pickTone,
};
