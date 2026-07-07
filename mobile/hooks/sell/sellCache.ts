import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CategoryResource, SellerCenterState } from '../../services/marketplaceApi';
import { CATEGORIES_CACHE_KEY } from '../../constants/sell';
import type { CachedSellerState } from '../../types/sell';

export async function getCachedSellerState(key: string): Promise<CachedSellerState | null> {
  try {
    const rawValue = await AsyncStorage.getItem(key);

    if (!rawValue) {
      return null;
    }

    const cached = JSON.parse(rawValue) as Partial<CachedSellerState>;

    return {
      products: Array.isArray(cached.products) ? cached.products : [],
      sellerState: isSellerCenterState(cached.sellerState) ? cached.sellerState : null,
      store: cached.store ?? null,
    };
  } catch {
    return null;
  }
}

export async function cacheSellerState(key: string, state: CachedSellerState): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(state));
  } catch {
    return;
  }
}

export async function getCachedCategories(): Promise<CategoryResource[]> {
  try {
    const rawValue = await AsyncStorage.getItem(CATEGORIES_CACHE_KEY);

    if (!rawValue) {
      return [];
    }

    const categories = JSON.parse(rawValue) as Partial<CategoryResource>[];

    return Array.isArray(categories) ? categories.filter(isCategoryResource) : [];
  } catch {
    return [];
  }
}

export async function cacheCategories(categories: CategoryResource[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(categories));
  } catch {
    return;
  }
}

function isSellerCenterState(value: unknown): value is SellerCenterState {
  return (
    value === 'verification_required'
    || value === 'verification_pending'
    || value === 'verification_rejected'
    || value === 'seller_suspended'
    || value === 'store_required'
    || value === 'store_suspended'
    || value === 'catalog_required'
    || value === 'catalog_ready'
  );
}

function isCategoryResource(value: Partial<CategoryResource>): value is CategoryResource {
  return typeof value.id === 'string' && value.id.length > 0 && typeof value.name === 'string';
}
