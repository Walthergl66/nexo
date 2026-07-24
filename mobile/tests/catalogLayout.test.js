const assert = require('node:assert/strict');
const test = require('node:test');
const { splitCatalogProducts } = require('../utils/catalogLayout.ts');

const makeProducts = (count) => Array.from({ length: count }, (_, index) => ({ id: `p${index}` }));

/**
 * La regla que este archivo existe para proteger: lo que entra tiene que salir,
 * exactamente una vez, repartido entre hero y grilla. Si un refactor futuro
 * vuelve a "reservar" productos que no se muestran, esto falla.
 */
function assertNothingLost(products, options) {
  const { featured, grid } = splitCatalogProducts(products, options);
  const shown = [...featured, ...grid];

  assert.equal(shown.length, products.length, 'no debe perderse ningún producto');
  assert.equal(new Set(shown.map((p) => p.id)).size, products.length, 'no debe duplicarse ningún producto');
}

test('nunca pierde productos en "Todo", con cualquier cantidad', () => {
  for (const count of [0, 1, 2, 3, 4, 5, 6, 7, 20, 100]) {
    assertNothingLost(makeProducts(count), { activeFilter: 'Todo', isLoading: false });
  }
});

test('nunca pierde productos en una categoría', () => {
  for (const count of [0, 1, 2, 3, 4, 6, 20]) {
    assertNothingLost(makeProducts(count), { activeFilter: 'Moda', isLoading: false });
  }
});

test('el hero reserva un producto solo en "Todo" y con 3 o más', () => {
  assert.equal(splitCatalogProducts(makeProducts(5), { activeFilter: 'Todo', isLoading: false }).featured.length, 1);
  assert.equal(splitCatalogProducts(makeProducts(5), { activeFilter: 'Moda', isLoading: false }).featured.length, 0);
  assert.equal(splitCatalogProducts(makeProducts(2), { activeFilter: 'Todo', isLoading: false }).featured.length, 0);
});

test('mientras carga no reserva hero (evita parpadeos con datos incompletos)', () => {
  assert.equal(splitCatalogProducts(makeProducts(6), { activeFilter: 'Todo', isLoading: true }).featured.length, 0);
});

test('el caso exacto del bug: 6 productos en "Todo" muestran los 6', () => {
  assertNothingLost(makeProducts(6), { activeFilter: 'Todo', isLoading: false });
});
