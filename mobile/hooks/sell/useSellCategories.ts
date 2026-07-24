import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { fetchCategories, type CategoryResource } from '../../services/marketplaceApi';
import { CATEGORIES_AUTO_REFRESH_MS, CATEGORIES_LOAD_TIMEOUT_MS } from '../../constants/sell';
import { cacheCategories, getCachedCategories } from './sellCache';

export function useSellCategories() {
  const [categories, setCategories] = useState<CategoryResource[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const isCategoryRequestInFlight = useRef(false);
  const isCategoryRefreshPending = useRef(false);

  const refreshCategories = useCallback(() => {
    setCategoryRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (isCategoryRequestInFlight.current) {
      isCategoryRefreshPending.current = true;
      return undefined;
    }

    let isMounted = true;
    isCategoryRequestInFlight.current = true;

    const loadCategories = async () => {
      const cachedCategories = await getCachedCategories();

      if (isMounted && categories.length === 0 && cachedCategories.length > 0) {
        setCategories(cachedCategories);
      }

      if (isMounted) {
        setIsCategoriesLoading(categories.length === 0 && cachedCategories.length === 0);
        setCategoryError(null);
      }

      try {
        const nextCategories = await fetchCategories(CATEGORIES_LOAD_TIMEOUT_MS);

        if (isMounted) {
          setCategories(nextCategories);
          setCategoryError(null);
          await cacheCategories(nextCategories);
        }
      } catch (error) {
        if (isMounted) {
          setCategoryError(error instanceof Error ? error.message : 'No pudimos cargar las categorias.');
        }
      } finally {
        if (isMounted) {
          setIsCategoriesLoading(false);
        }

        // Liberar siempre el bloqueo, incluso si el efecto se desmontó mientras
        // la petición estaba en curso.
        isCategoryRequestInFlight.current = false;

        if (isCategoryRefreshPending.current) {
          isCategoryRefreshPending.current = false;
          refreshCategories();
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [categoryRefreshKey, refreshCategories]);

  useEffect(() => {
    const intervalId = setInterval(refreshCategories, CATEGORIES_AUTO_REFRESH_MS);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshCategories();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [refreshCategories]);

  return {
    categories,
    categoryError,
    isCategoriesLoading,
    refreshCategories,
  };
}
