import type { CartItem, Order, Product } from '../types/marketplace';
import {
  mapApiCartItemsToCartItems,
  mapApiOrderToOrder,
  mapApiProductToProduct,
} from './marketplaceMapper';

type ApiCollection<T> = {
  data: T[];
};

type ApiDocument<T> = {
  data: T;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  token?: string;
};

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export const apiBaseUrl = normalizeBaseUrl(env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000/api');

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`NEXO API ${response.status}: ${await response.text()}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await request<ApiCollection<unknown>>('/products');

  return response.data.map(mapApiProductToProduct);
}

export async function fetchCategoryNames(): Promise<string[]> {
  const response = await request<ApiCollection<{ name?: unknown }>>('/categories');

  return response.data
    .map((category) => (typeof category.name === 'string' ? category.name : null))
    .filter((name): name is string => name !== null);
}

export type ProfileResource = {
  id: string;
  email: string | null;
  display_name: string | null;
  national_id: string | null;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  phone: string | null;
  role: string;
  verification_status: string;
};

export type IdentityLookup = {
  national_id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  gender: string | null;
};

export async function fetchCart(token?: string): Promise<CartItem[]> {
  if (!token) {
    return [];
  }

  const response = await request<ApiCollection<unknown>>('/cart', { token });

  return mapApiCartItemsToCartItems(response.data);
}

export async function addProductToCart(productId: string, quantity = 1, token?: string): Promise<CartItem[]> {
  if (!token) {
    return [];
  }

  await request<ApiDocument<unknown>>('/cart/items', {
    method: 'POST',
    token,
    body: { product_id: productId, quantity },
  });

  return fetchCart(token);
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number, token?: string): Promise<CartItem[]> {
  if (!token) {
    return [];
  }

  await request<ApiDocument<unknown>>(`/cart/items/${cartItemId}`, {
    method: 'PATCH',
    token,
    body: { quantity },
  });

  return fetchCart(token);
}

export async function removeCartItem(cartItemId: string, token?: string): Promise<CartItem[]> {
  if (!token) {
    return [];
  }

  await request<void>(`/cart/items/${cartItemId}`, {
    method: 'DELETE',
    token,
  });

  return fetchCart(token);
}

export async function createOrderFromCart(token?: string): Promise<Order> {
  const response = await request<ApiDocument<unknown>>('/orders/from-cart', {
    method: 'POST',
    token,
  });

  return mapApiOrderToOrder(response.data);
}

export async function fetchOrders(token?: string): Promise<Order[]> {
  if (!token) {
    return [];
  }

  const response = await request<ApiCollection<unknown>>('/orders', { token });

  return response.data.map(mapApiOrderToOrder);
}

export async function fetchProfile(token?: string): Promise<ProfileResource | null> {
  if (!token) {
    return null;
  }

  const response = await request<ApiDocument<ProfileResource>>('/me', { token });

  return response.data;
}

export async function fetchMyStore(token?: string): Promise<{
  name: string;
  status: string;
} | null> {
  if (!token) {
    return null;
  }

  const response = await request<ApiDocument<{
    name: string;
    status: string;
  }>>('/my-store', { token });

  return response.data;
}

export async function lookupIdentity(nationalId: string): Promise<IdentityLookup> {
  const response = await request<ApiDocument<IdentityLookup>>(
    `/identity/lookup?identificacion=${encodeURIComponent(nationalId)}`,
  );

  return response.data;
}

export async function checkProfileAvailability(email: string, nationalId: string): Promise<{
  email_available: boolean;
  national_id_available: boolean;
}> {
  const response = await request<ApiDocument<{
    email_available: boolean;
    national_id_available: boolean;
  }>>(
    `/profiles/availability?email=${encodeURIComponent(email)}&national_id=${encodeURIComponent(nationalId)}`,
  );

  return response.data;
}

export async function completeProfile(
  token: string,
  payload: {
    national_id: string;
    first_name: string;
    last_name: string;
    age?: number | null;
    gender?: string | null;
    address: string;
    phone: string;
  },
): Promise<ProfileResource> {
  const response = await request<ApiDocument<ProfileResource>>('/me/profile', {
    method: 'PATCH',
    token,
    body: payload,
  });

  return response.data;
}
