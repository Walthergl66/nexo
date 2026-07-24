import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { advanceSaleStatus, fetchSellerSales } from '../../services/marketplaceApi';
import type { ItemFulfillmentStatus, Sale } from '../../types/marketplace';
import { ORDERS_AUTO_REFRESH_MS } from '../../constants/app';

const SELLER_SALES_CACHE_KEY = 'nexo.seller.sales.v1';

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
  const hasLoadedSales = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // silent: el polling refresca sin encender el spinner de carga, para que la
  // lista no parpadee cada pocos segundos cuando ya hay ventas en pantalla.
  const load = useCallback(async (silent = false) => {
    if (!accessToken || !enabled) {
      hasLoadedSales.current = false;
      setSales([]);
      // Al cerrar sesión / perder acceso limpiamos la caché por privacidad.
      AsyncStorage.removeItem(SELLER_SALES_CACHE_KEY).catch(() => {});
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }

    // Pintado instantáneo desde caché (en paralelo, sin bloquear el fetch): las
    // visitas siguientes muestran las ventas al toque mientras la red revalida.
    if (!hasLoadedSales.current) {
      AsyncStorage.getItem(SELLER_SALES_CACHE_KEY)
        .then((raw) => {
          if (!raw || !isMounted.current || hasLoadedSales.current) {
            return;
          }
          try {
            const cached = JSON.parse(raw) as Sale[];
            if (Array.isArray(cached) && cached.length > 0) {
              setSales(cached);
            }
          } catch {
            // Caché corrupta: se ignora.
          }
        })
        .catch(() => {});
    }

    try {
      const items = await fetchSellerSales(accessToken);
      if (isMounted.current) {
        setSales(items);
        hasLoadedSales.current = true;
        AsyncStorage.setItem(SELLER_SALES_CACHE_KEY, JSON.stringify(items)).catch(() => {});
      }
    } catch (error) {
      // Un fallo puntual no borra las ventas ya cargadas ni molesta con un error.
      if (isMounted.current && !hasLoadedSales.current) {
        setSales([]);
        onError?.(error instanceof Error ? error.message : 'No pudimos cargar tus ventas.');
      }
    } finally {
      if (isMounted.current && !silent) {
        setIsLoading(false);
      }
    }
  }, [accessToken, enabled, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresco casi en vivo mientras el vendedor tiene la pantalla abierta: una
  // nueva venta o un cambio de estado aparecen sin salir y volver. El intervalo
  // se limpia al desmontar (al cambiar de pestaña), así que no corre de fondo.
  useEffect(() => {
    if (!accessToken || !enabled) {
      return undefined;
    }

    const interval = setInterval(() => {
      void load(true);
    }, ORDERS_AUTO_REFRESH_MS);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void load(true);
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [accessToken, enabled, load]);

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
