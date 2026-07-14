import { useCallback, useEffect, useRef, useState } from 'react';
import { advanceSaleStatus, fetchSellerSales } from '../../services/marketplaceApi';
import type { ItemFulfillmentStatus, Sale } from '../../types/marketplace';

type UseSellerSalesParams = {
  accessToken: string | null;
  /** Only fetch once the seller actually has an active store. */
  enabled: boolean;
  onError?: (message: string) => void;
};

/**
 * Loads the seller's paid sales and lets them advance each item's fulfilment
 * status, keeping the local list in sync with the backend response.
 */
export function useSellerSales({ accessToken, enabled, onError }: UseSellerSalesParams) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!accessToken || !enabled) {
      setSales([]);
      return;
    }

    setIsLoading(true);

    try {
      const items = await fetchSellerSales(accessToken);
      if (isMounted.current) {
        setSales(items);
      }
    } catch (error) {
      if (isMounted.current) {
        setSales([]);
        onError?.(error instanceof Error ? error.message : 'No pudimos cargar tus ventas.');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [accessToken, enabled, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  const advance = useCallback(
    async (saleId: string, nextStatus: ItemFulfillmentStatus) => {
      if (!accessToken) {
        return;
      }

      setAdvancingId(saleId);

      try {
        const updated = await advanceSaleStatus(saleId, nextStatus, accessToken);
        if (isMounted.current) {
          setSales((current) => current.map((sale) => (sale.id === saleId ? updated : sale)));
        }
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'No pudimos actualizar la venta.');
      } finally {
        if (isMounted.current) {
          setAdvancingId(null);
        }
      }
    },
    [accessToken, onError],
  );

  return { sales, isLoading, advancingId, refreshSales: load, advance };
}
