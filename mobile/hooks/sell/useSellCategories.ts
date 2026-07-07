import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCategories, type CategoryResource } from '../../services/marketplaceApi';
import { CATEGORIES_LOAD_TIMEOUT_MS } from '../../constants/sell';
import { cacheCategories, getCachedCategories } from './sellCache';

export function useSellCategories() {
  const [categories, setCategories] = useState<CategoryResource[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const isCategoryRequestInFlight = useRef(false);

  const refreshCategories = useCallback(() => {
    setCategoryRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (isCategoryRequestInFlight.current) {
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

        isCategoryRequestInFlight.current = false;
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [categories.length, categoryRefreshKey]);

  return {
    categories,
    categoryError,
    isCategoriesLoading,
    refreshCategories,
  };
}
