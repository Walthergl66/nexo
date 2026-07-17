import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const FAVORITES_KEY = 'nexo.favorites.v1';

type FavoritesContextValue = {
  /** Whether the given product is currently marked as favorite. */
  isFavorite: (productId: string) => boolean;
  /** Adds or removes the product from favorites and persists the change. */
  toggleFavorite: (productId: string) => void;
  /** Total favorites, handy for a future favorites screen or badge. */
  favoriteCount: number;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/**
 * Device-local favorites persisted with AsyncStorage. There is no backend
 * endpoint for favorites yet, so this keeps a per-device set of product ids.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isActive = true;

    AsyncStorage.getItem(FAVORITES_KEY)
      .then((raw) => {
        if (!isActive || !raw) {
          return;
        }

        const parsed = JSON.parse(raw) as unknown;

        if (Array.isArray(parsed)) {
          setFavorites(new Set(parsed.filter((id): id is string => typeof id === 'string')));
        }
      })
      .catch(() => {
        // best-effort: si no se puede leer, se arranca sin favoritos.
      });

    return () => {
      isActive = false;
    };
  }, []);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])).catch(() => {
        // best-effort: la UI ya refleja el cambio aunque no se persista.
      });

      return next;
    });
  }, []);

  const isFavorite = useCallback((productId: string) => favorites.has(productId), [favorites]);

  const value = useMemo<FavoritesContextValue>(
    () => ({ isFavorite, toggleFavorite, favoriteCount: favorites.size }),
    [favorites, isFavorite, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error('useFavorites debe usarse dentro de un FavoritesProvider.');
  }

  return context;
}
