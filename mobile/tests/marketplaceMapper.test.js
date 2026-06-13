const assert = require('node:assert/strict');
const test = require('node:test');
const {
  centsToAmount,
  mapApiCartItemsToCartItems,
  mapApiOrderToOrder,
  mapApiProductToProduct,
} = require('../services/marketplaceMapper');

test('maps Laravel product resources into mobile catalog products', () => {
  const product = mapApiProductToProduct({
    id: '01JTEST',
    name: 'Cafe organico',
    description: 'Bolsa de cafe local',
    price_cents: 1250,
    stock: 8,
    status: 'active',
    store: { name: 'Tienda Centro' },
    category: { name: 'Hogar' },
  });

  assert.equal(product.title, 'Cafe organico');
  assert.equal(product.price, 12.5);
  assert.equal(product.available, true);
  assert.equal(product.seller, 'Tienda Centro');
  assert.equal(product.category, 'Hogar');
});

test('maps cart item resources using the nested product snapshot', () => {
  const items = mapApiCartItemsToCartItems([
    {
      id: 'cart-item-1',
      quantity: 2,
      product: {
        id: 'product-1',
        name: 'Agenda',
        price_cents: 550,
        stock: 4,
        status: 'active',
      },
    },
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'cart-item-1');
  assert.equal(items[0].quantity, 2);
  assert.equal(items[0].product.price, 5.5);
});

test('maps order resources to the existing order card model', () => {
  const order = mapApiOrderToOrder({
    id: 'order-1',
    order_number: 'NEXO-0001',
    status: 'shipped',
    payment_status: 'paid',
    items: [{ product_name: 'Agenda' }, { product_name: 'Lapiz' }],
  });

  assert.equal(order.title, 'Agenda +1');
  assert.equal(order.status, 'En camino');
  assert.equal(order.eta, 'Pago confirmado');
});

test('converts integer cents to display amounts', () => {
  assert.equal(centsToAmount(1999), 19.99);
  assert.equal(centsToAmount(undefined), 0);
});
