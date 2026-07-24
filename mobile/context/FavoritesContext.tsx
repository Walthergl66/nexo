import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getCurrentSession, onAuthStateChange } from '../services/authService';

const FAVORITES_KEY_PREFIX = 'nexo.favorites.v1';

/**
 * Clave de almacenamiento por usuario. Antes era una sola global, así que en un
 * mismo dispositivo todos los usuarios (y el estado deslogueado) compartían los
 * favoritos. Al escoparla por el id del usuario de Supabase, cada cuenta tiene
 * los suyos; el invitado (sin sesión) usa su propio bucket aparte.
 */
function favoritesKey(userId: string | null): string {
  return `${FAVORITES_KEY_PREFIX}.${userId ?? 'guest'}`;
}

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
 * Favoritos locales al dispositivo, aislados por usuario. Todavía no hay
 * endpoint de favoritos, así que no sincronizan entre dispositivos (ver P8),
 * pero sí son independientes por cuenta.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  // El toggle persiste con el usuario actual sin recrearse en cada cambio.
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = userId;

  // Sigue la sesión de Supabase para saber de quién son los favoritos.
  useEffect(() => {
    let isActive = true;

    getCurrentSession()
      .then((session) => {
        if (isActive) {
          setUserId(session?.user.id ?? null);
        }
      })
      .catch(() => {
        if (isActive) {
          setUserId(null);
        }
      });

    const subscription = onAuthStateChange((session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  // Al cambiar de usuario, carga SUS favoritos. Se limpia primero para no dejar
  // ver los del usuario anterior mientras llega el nuevo set.
  useEffect(() => {
    let isActive = true;
    setFavorites(new Set());

    AsyncStorage.getItem(favoritesKey(userId))
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
  }, [userId]);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      AsyncStorage.setItem(favoritesKey(userIdRef.current), JSON.stringify([...next])).catch(() => {
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
