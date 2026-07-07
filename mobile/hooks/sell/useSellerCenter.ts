import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  fetchSellerCenter,
  type ProfileResource,
  type SellerCenterState,
  type StoreResource,
} from '../../services/marketplaceApi';
import type { Product } from '../../types/marketplace';
import { SELLER_CENTER_AUTO_REFRESH_MS, SELLER_STATE_CACHE_KEY_PREFIX } from '../../constants/sell';
import { cacheSellerState, getCachedSellerState } from './sellCache';
import type { CachedSellerState } from '../../types/sell';

type UseSellerCenterParams = {
  accessToken: string | null;
  profile: ProfileResource | null;
  onProfileChange: (profile: ProfileResource | null) => void;
  onError: (message: string) => void;
  onLoaded: () => void;
};

export function useSellerCenter({
  accessToken,
  profile,
  onError,
  onLoaded,
  onProfileChange,
}: UseSellerCenterParams) {
  const [store, setStore] = useState<StoreResource | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerState, setSellerState] = useState<SellerCenterState | null>(null);
  const [hasPendingVerificationRequest, setHasPendingVerificationRequest] = useState(false);
  const [sellerRefreshKey, setSellerRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const sellerCacheKey = profile ? `${SELLER_STATE_CACHE_KEY_PREFIX}${profile.id}` : null;
  const profileId = profile?.id ?? null;

  const refreshSellerCenter = useCallback(() => {
    setSellerRefreshKey((current) => current + 1);
  }, []);

  const saveSellerState = useCallback((state: CachedSellerState) => {
    if (sellerCacheKey) {
      cacheSellerState(sellerCacheKey, state);
    }
  }, [sellerCacheKey]);

  const loadSellerState = useCallback(async () => {
    if (!accessToken || !profile) {
      setStore(null);
      setProducts([]);
      setSellerState(null);
      return;
    }

    let usedCachedState = false;

    if (sellerCacheKey) {
      const cachedState = await getCachedSellerState(sellerCacheKey);

      if (cachedState) {
        usedCachedState = true;
        setStore(cachedState.store);
        setProducts(cachedState.products);
        setSellerState(cachedState.sellerState);
        onLoaded();
      }
    }

    let nextCenter;

    try {
      nextCenter = await fetchSellerCenter(accessToken);
    } catch (error) {
      if (usedCachedState) {
        return;
      }

      throw error;
    }

    if (!nextCenter) {
      return;
    }

    setStore(nextCenter.store);
    setProducts(nextCenter.products);
    setSellerState(nextCenter.state);
    onLoaded();
    onProfileChange(nextCenter.profile);

    if (sellerCacheKey) {
      saveSellerState({
        sellerState: nextCenter.state,
        store: nextCenter.store,
        products: nextCenter.products,
      });
    }
  }, [accessToken, onLoaded, onProfileChange, profile, saveSellerState, sellerCacheKey]);

  const loadSellerStateRef = useRef(loadSellerState);
  loadSellerStateRef.current = loadSellerState;

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    loadSellerStateRef.current()
      .catch(() => {
        if (isMounted) {
          onError('No pudimos cargar tu centro de ventas.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
    // Re-run only when the account or an explicit refresh changes. We intentionally
    // avoid depending on `loadSellerState`'s identity: it changes on every `profile`
    // object update, and since loading calls `onProfileChange`, that would create an
    // endless refetch loop against /seller-center.
  }, [accessToken, profileId, sellerRefreshKey, onError]);

  useEffect(() => {
    if (!accessToken || !profile) {
      return undefined;
    }

    const interval = setInterval(refreshSellerCenter, SELLER_CENTER_AUTO_REFRESH_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshSellerCenter();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [accessToken, profile, refreshSellerCenter]);

  return {
    hasPendingVerificationRequest,
    isLoading,
    loadSellerState,
    products,
    saveSellerState,
    sellerState,
    setHasPendingVerificationRequest,
    setProducts,
    setSellerState,
    setStore,
    store,
  };
}
