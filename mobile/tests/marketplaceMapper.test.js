const assert = require('node:assert/strict');
const test = require('node:test');
const {
  centsToAmount,
  mapApiCartItemsToCartItems,
  mapApiCartSummary,
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

test('maps order resources with real totals, statuses and items', () => {
  const order = mapApiOrderToOrder({
    id: 'order-1',
    order_number: 'NEXO-0001',
    status: 'shipped',
    payment_status: 'paid',
    currency: 'USD',
    subtotal_cents: 2500,
    shipping_cents: 499,
    total_cents: 2999,
    created_at: '2026-07-13T10:00:00.000Z',
    items: [
      { id: 'item-1', product_name: 'Agenda', store_name: 'Tienda Centro', unit_price_cents: 1250, quantity: 2, subtotal_cents: 2500 },
    ],
  });

  assert.equal(order.orderNumber, 'NEXO-0001');
  assert.equal(order.status, 'shipped');
  assert.equal(order.paymentStatus, 'paid');
  assert.equal(order.subtotal, 25);
  assert.equal(order.shipping, 4.99);
  assert.equal(order.total, 29.99);
  assert.equal(order.itemCount, 2);
  assert.equal(order.items[0].productName, 'Agenda');
  assert.equal(order.items[0].unitPrice, 12.5);
});

test('falls back to safe defaults for unknown order and payment statuses', () => {
  const order = mapApiOrderToOrder({ id: 'order-2', status: 'weird', payment_status: 'mystery' });

  assert.equal(order.status, 'pending');
  assert.equal(order.paymentStatus, 'pending');
  assert.equal(order.itemCount, 0);
  assert.deepEqual(order.items, []);
});

test('maps the cart summary meta block', () => {
  const summary = mapApiCartSummary({
    subtotal_cents: 2500,
    shipping_cents: 499,
    total_cents: 2999,
    currency: 'USD',
    item_count: 3,
  });

  assert.equal(summary.subtotal, 25);
  assert.equal(summary.shipping, 4.99);
  assert.equal(summary.total, 29.99);
  assert.equal(summary.itemCount, 3);
});

test('converts integer cents to display amounts', () => {
  assert.equal(centsToAmount(1999), 19.99);
  assert.equal(centsToAmount(undefined), 0);
});
