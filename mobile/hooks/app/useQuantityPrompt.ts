import { useCallback, useRef, useState } from 'react';
import type { Product } from '../../types/marketplace';

export type QuantityRequest = {
  /** Tope real: stock menos lo que ya hay en el carrito. */
  maxQuantity: number;
  product: Product;
};

/**
 * Selector de cantidad basado en promesa: askQuantity abre la hoja y se
 * resuelve cuando el usuario confirma (numero) o cancela (null). Asi quien
 * llama puede seguir usando un flujo `await` normal.
 */
export function useQuantityPrompt() {
  const [request, setRequest] = useState<QuantityRequest | null>(null);
  const resolverRef = useRef<((quantity: number | null) => void) | null>(null);

  const settle = useCallback((quantity: number | null) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setRequest(null);
    resolve?.(quantity);
  }, []);

  const askQuantity = useCallback(
    (product: Product, maxQuantity: number) =>
      new Promise<number | null>((resolve) => {
        // Si ya habia una hoja abierta, la damos por cancelada para no dejar
        // su promesa colgada para siempre.
        resolverRef.current?.(null);
        resolverRef.current = resolve;
        setRequest({ maxQuantity, product });
      }),
    [],
  );

  const confirmQuantity = useCallback((quantity: number) => settle(quantity), [settle]);
  const cancelQuantity = useCallback(() => settle(null), [settle]);

  return { askQuantity, cancelQuantity, confirmQuantity, request };
}
