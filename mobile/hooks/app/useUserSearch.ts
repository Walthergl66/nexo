import { useEffect, useState } from 'react';
import { searchUsers } from '../../services/marketplaceApi';
import type { PublicUser } from '../../types/social';

const SEARCH_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

type UseUserSearchParams = {
  /** Texto del buscador de Inicio (compartido con la búsqueda de productos). */
  query: string;
  accessToken: string | null;
};

/**
 * Busca usuarios por nombre para el buscador de Inicio. Solo corre con sesión
 * (es una función social, no pública) y con 2+ caracteres. Debounce propio para
 * no pegar una petición por tecla.
 */
export function useUserSearch({ query, accessToken }: UseUserSearchParams) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!accessToken || debounced.length < MIN_QUERY_LENGTH) {
      setUsers([]);
      setIsSearching(false);
      return;
    }

    let isActive = true;
    setIsSearching(true);

    searchUsers(debounced, accessToken)
      .then((result) => {
        if (isActive) {
          setUsers(result);
        }
      })
      .catch(() => {
        if (isActive) {
          setUsers([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsSearching(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, debounced]);

  return { users, isSearching };
}
