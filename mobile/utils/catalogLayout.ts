/**
 * Reparte los productos del catálogo entre el hero destacado y la grilla.
 *
 * Vive aparte de HomeScreen a propósito: sin React alrededor se puede probar con
 * `node --test` la única regla que importa de verdad acá — que NINGÚN producto
 * se pierda ni se duplique al repartirlo. Ese fue exactamente el bug: el hero
 * reservaba productos que después no dibujaba, y desaparecían en silencio.
 *
 * El hero muestra un solo producto y solo en "Todo", así que solo se reserva ese
 * uno cuando corresponde; todo lo demás va a la grilla. Por construcción,
 * featured + grid == products, sin huecos.
 */
export type CatalogLayout<T> = {
  featured: T[];
  grid: T[];
};

export type CatalogLayoutOptions = {
  activeFilter: string;
  isLoading: boolean;
};

/** Cantidad mínima de productos para reservar uno al hero. */
const MIN_FOR_HERO = 3;

export function splitCatalogProducts<T>(products: T[], options: CatalogLayoutOptions): CatalogLayout<T> {
  const showsHero = !options.isLoading && options.activeFilter === 'Todo' && products.length >= MIN_FOR_HERO;
  const featured = showsHero ? products.slice(0, 1) : [];
  const grid = products.slice(featured.length);

  return { featured, grid };
}
