import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCategoryNames, fetchProducts, type ProfileResource } from '../../services/marketplaceApi';
import { isSupabaseConfigured, supabase } from '../../services/supabaseClient';
import type { Product, TabKey } from '../../types/marketplace';
import { CATALOG_AUTO_REFRESH_MS, REFRESH_THROTTLE_MS } from '../../constants/app';

// Claves de caché en disco: permiten pintar el último catálogo conocido al
// instante mientras la red revalida (patrón stale-while-revalidate).
const CATALOG_CACHE_KEY = 'nexo.catalog.products.v1';
const FILTERS_CACHE_KEY = 'nexo.catalog.filters.v1';

// Espera entre la ultima tecla y la peticion, para no disparar una busqueda por
// cada caracter escrito.
const SEARCH_DEBOUNCE_MS = 350;

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
 *
 * La busqueda y el filtro por categoria se resuelven EN EL SERVIDOR: filtrar en
 * el cliente solo veia la primera pagina, asi que un producto de la pagina 3
 * resultaba invisible. applyCatalogFilters se mantiene como capa local para dar
 * respuesta inmediata mientras corre el debounce; la API manda.
 *
 * Rendimiento: hidrata desde caché en disco para pintado inmediato, revalida en
 * red sin bloquear, y NUNCA descarta los datos ya cargados ante un fallo puntual
 * (un error de red deja el último catálogo bueno en pantalla en vez de vaciarlo).
 */
export function useCatalog({ accessToken, isSessionReady, activeTab }: UseCatalogParams) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<string[]>(['Todo']);
  const [activeFilter, setActiveFilter] = useState('Todo');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [catalogRequestKey, setCatalogRequestKey] = useState(0);
  const hasLoadedCatalog = useRef(false);
  const lastCatalogRefreshRequestAt = useRef(0);
  const realtimeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshCatalog = useCallback(() => {
    const now = Date.now();

    if (now - lastCatalogRefreshRequestAt.current < REFRESH_THROTTLE_MS) {
      return;
    }

    lastCatalogRefreshRequestAt.current = now;
    setCatalogRequestKey((current) => current + 1);
  }, []);

  // Hidratación desde caché: pinta el último catálogo conocido de inmediato para
  // que abrir la app no muestre skeleton en frío mientras llega la red.
  useEffect(() => {
    let active = true;

    AsyncStorage.multiGet([CATALOG_CACHE_KEY, FILTERS_CACHE_KEY])
      .then((entries) => {
        if (!active || hasLoadedCatalog.current) {
          return;
        }

        const cache = Object.fromEntries(entries) as Record<string, string | null>;

        try {
          const cachedProducts = cache[CATALOG_CACHE_KEY]
            ? (JSON.parse(cache[CATALOG_CACHE_KEY] as string) as Product[])
            : null;

          if (Array.isArray(cachedProducts) && cachedProducts.length > 0) {
            setProducts(cachedProducts);
            // Marcamos como cargado: la próxima respuesta de red será un refresh
            // silencioso, no un "initial load" que reactive el skeleton.
            hasLoadedCatalog.current = true;
            setIsLoading(false);
          }
        } catch {
          // Caché corrupta: se ignora y la red repuebla.
        }

        try {
          const cachedFilters = cache[FILTERS_CACHE_KEY]
            ? (JSON.parse(cache[FILTERS_CACHE_KEY] as string) as string[])
            : null;

          if (Array.isArray(cachedFilters) && cachedFilters.length > 1) {
            setFilters(cachedFilters);
          }
        } catch {
          // Igual: se ignora.
        }
      })
      .catch(() => {
        // Sin caché disponible: seguimos con la carga normal desde red.
      });

    return () => {
      active = false;
    };
  }, []);

  // Debounce del texto: evita una peticion por tecla.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let isMounted = true;
    const isInitialLoad = !hasLoadedCatalog.current;
    // Solo el catalogo sin filtrar se cachea en disco: guardar resultados de una
    // busqueda haria que la proxima apertura de la app pintase un catalogo
    // parcial como si fuera el completo.
    const isUnfiltered = debouncedSearch.trim() === '' && activeFilter === 'Todo';

    // El catálogo es público: NO lo bloqueamos esperando el perfil. Se carga en
    // paralelo con /me para que los usuarios logueados no esperen dos peticiones.
    if (!isSessionReady || activeTab !== 'Inicio') {
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

    fetchProducts({ search: debouncedSearch, category: activeFilter })
      .then((nextProducts) => {
        if (!isMounted) {
          return;
        }

        setProducts(nextProducts);
        setLastSyncAt(new Date());
        hasLoadedCatalog.current = true;

        if (isUnfiltered) {
          AsyncStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(nextProducts)).catch(() => {});
        }
      })
      .catch(() => {
        // Clave de robustez: un fallo puntual NO borra el catálogo ya visible.
        // Solo mostramos vacío si nunca logramos cargar nada.
        if (isMounted && !hasLoadedCatalog.current) {
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
  }, [accessToken, activeFilter, activeTab, catalogRequestKey, debouncedSearch, isSessionReady]);

  useEffect(() => {
    let isMounted = true;

    if (!isSessionReady || activeTab !== 'Inicio') {
      return () => {
        isMounted = false;
      };
    }

    fetchCategoryNames()
      .then((names) => {
        if (!isMounted) {
          return;
        }

        const nextFilters = ['Todo', ...names];
        setFilters(nextFilters);
        AsyncStorage.setItem(FILTERS_CACHE_KEY, JSON.stringify(nextFilters)).catch(() => {});
      })
      .catch(() => {
        // No tocamos los filtros ya cargados si la red falla puntualmente.
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, activeTab, catalogRequestKey, isSessionReady]);

  useEffect(() => {
    setFilteredProducts(applyCatalogFilters(products, activeFilter, search));
  }, [activeFilter, products, search]);

  // Realtime: en vez de esperar al siguiente poll, escuchamos los cambios de la
  // tabla de productos (y sus imágenes) y refrescamos al instante. Si Supabase no
  // está configurado o la tabla no está en la publicación realtime, no llega nada
  // y el polling de abajo sigue actuando como red de seguridad. Sin riesgo.
  useEffect(() => {
    if (!isSupabaseConfigured || activeTab !== 'Inicio' || !isSessionReady) {
      return undefined;
    }

    const scheduleSync = () => {
      if (realtimeDebounce.current) {
        clearTimeout(realtimeDebounce.current);
      }
      // Pequeño debounce: agrupa ráfagas de cambios en un solo refresh y evita
      // el throttle de refreshCatalog (esto es un evento en vivo, no un poll).
      realtimeDebounce.current = setTimeout(() => {
        setCatalogRequestKey((current) => current + 1);
      }, 400);
    };

    const channel = supabase
      .channel('catalog-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, scheduleSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images' }, scheduleSync)
      .subscribe();

    return () => {
      if (realtimeDebounce.current) {
        clearTimeout(realtimeDebounce.current);
        realtimeDebounce.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [activeTab, isSessionReady]);

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
