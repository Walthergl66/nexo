import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { fetchCategoryNames, fetchProducts, type ProfileResource } from '../../services/marketplaceApi';
import type { Product, TabKey } from '../../types/marketplace';
import { CATALOG_AUTO_REFRESH_MS, REFRESH_THROTTLE_MS } from '../../constants/app';

type UseCatalogParams = {
  accessToken: string | null;
  profile: ProfileResource | null;
  profileError: string | null;
  isSessionReady: boolean;
  activeTab: TabKey;
};

function applyCatalogFilters(sourceProducts: Product[], filter: string, query: string): Product[] {
  const normalizedQuery = query.trim().toLowerCase();

  return sourceProducts.filter((product) => {
    const matchesFilter = filter === 'Todo' || product.category === filter;
    const matchesSearch =
      normalizedQuery.length === 0 ||
      product.title.toLowerCase().includes(normalizedQuery) ||
      product.seller.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery);

    return matchesFilter && matchesSearch;
  });
}

/**
 * Fetches and filters the public product catalog for the home tab, including
 * category chips, throttled manual refresh, and background auto-refresh.
 */
export function useCatalog({ accessToken, profile, profileError, isSessionReady, activeTab }: UseCatalogParams) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<string[]>(['Todo']);
  const [activeFilter, setActiveFilter] = useState('Todo');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [catalogRequestKey, setCatalogRequestKey] = useState(0);
  const hasLoadedCatalog = useRef(false);
  const lastCatalogRefreshRequestAt = useRef(0);

  const refreshCatalog = useCallback(() => {
    const now = Date.now();

    if (now - lastCatalogRefreshRequestAt.current < REFRESH_THROTTLE_MS) {
      return;
    }

    lastCatalogRefreshRequestAt.current = now;
    setCatalogRequestKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const isInitialLoad = !hasLoadedCatalog.current;
    const shouldDeferCatalog = accessToken !== null && profile === null && profileError === null;

    if (!isSessionReady || activeTab !== 'Inicio' || shouldDeferCatalog) {
      if (!hasLoadedCatalog.current) {
        setIsLoading(false);
      }

      return () => {
        isMounted = false;
      };
    }

    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    fetchProducts()
      .then((nextProducts) => {
        if (!isMounted) {
          return;
        }

        setProducts(nextProducts);
        setLastSyncAt(new Date());
        hasLoadedCatalog.current = true;
      })
      .catch(() => {
        if (isMounted) {
          setProducts([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, activeTab, catalogRequestKey, isSessionReady, profile, profileError]);

  useEffect(() => {
    let isMounted = true;
    const shouldDeferCatalog = accessToken !== null && profile === null && profileError === null;

    if (!isSessionReady || activeTab !== 'Inicio' || shouldDeferCatalog) {
      return () => {
        isMounted = false;
      };
    }

    fetchCategoryNames()
      .then((names) => {
        if (isMounted) {
          setFilters(['Todo', ...names]);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFilters(['Todo']);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, activeTab, catalogRequestKey, isSessionReady, profile, profileError]);

  useEffect(() => {
    setFilteredProducts(applyCatalogFilters(products, activeFilter, search));
  }, [activeFilter, products, search]);

  useEffect(() => {
    if (activeTab !== 'Inicio' || !isSessionReady) {
      return undefined;
    }

    const interval = setInterval(refreshCatalog, CATALOG_AUTO_REFRESH_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshCatalog();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [activeTab, isSessionReady, refreshCatalog]);

  return {
    products,
    filteredProducts,
    filters,
    activeFilter,
    setActiveFilter,
    search,
    setSearch,
    isLoading,
    isRefreshing,
    lastSyncAt,
    refreshCatalog,
  };
}
