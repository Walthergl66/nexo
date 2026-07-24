import type {
  AppNotification,
  CartItem,
  CartSummary,
  ItemFulfillmentStatus,
  NotificationType,
  Order,
  Product,
  Sale,
} from '../types/marketplace';
import type { PublicUser } from '../types/social';
import {
  mapApiCartItemsToCartItems,
  mapApiCartSummary,
  mapApiOrderToOrder,
  mapApiProductToProduct,
  mapApiSale,
} from './marketplaceMapper';

type ApiCollection<T> = {
  data: T[];
  meta?: unknown;
};

export type CartSnapshot = {
  items: CartItem[];
  summary: CartSummary;
};

const EMPTY_CART_SUMMARY: CartSummary = {
  subtotal: 0,
  shipping: 0,
  total: 0,
  currency: 'USD',
  itemCount: 0,
};

export const emptyCartSnapshot = (): CartSnapshot => ({
  items: [],
  summary: { ...EMPTY_CART_SUMMARY },
});

type ApiDocument<T> = {
  data: T;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  timeoutMs?: number;
  token?: string;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number | null = null,
    /** Segundos que pide esperar el backend, solo en respuestas 429. */
    public readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
  }

  /** La API corto la peticion por exceso de intentos, no por un error del usuario. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

export const apiBaseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8010/api');

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiRequestError('No pudimos conectar con nexo. Revisa tu conexion e intenta nuevamente.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw await buildRateLimitError(response);
    }

    throw new ApiRequestError(await getApiErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

const GENERIC_ERROR_MESSAGE = 'No pudimos completar la solicitud. Intenta nuevamente.';

/**
 * La API limita las peticiones por minuto. El backend manda un `message` en
 * espanol, pero un 429 tambien puede venir de un proxy sin cuerpo JSON, asi que
 * hay un texto de respaldo. `Retry-After` llega en segundos.
 */
async function buildRateLimitError(response: Response): Promise<ApiRequestError> {
  const header = response.headers.get('Retry-After');
  const parsed = header === null ? Number.NaN : Number.parseInt(header, 10);
  const retryAfterSeconds = Number.isFinite(parsed) && parsed > 0 ? parsed : null;

  let message = await getApiErrorMessage(response);

  if (message === GENERIC_ERROR_MESSAGE) {
    message = retryAfterSeconds === null
      ? 'Hiciste demasiadas peticiones seguidas. Espera un momento e intenta de nuevo.'
      : `Hiciste demasiadas peticiones seguidas. Intenta de nuevo en ${retryAfterSeconds} segundos.`;
  }

  return new ApiRequestError(message, response.status, retryAfterSeconds);
}

async function getApiErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json() as { message?: unknown; errors?: Record<string, unknown> };

    if (payload.errors && Object.keys(payload.errors).length > 0) {
      const errorMessages = Object.values(payload.errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

      if (errorMessages.length > 0) {
        return errorMessages.map(toPublicErrorMessage).join(' ');
      }
    }

    if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
      return toPublicErrorMessage(payload.message);
    }
  } catch {
    return GENERIC_ERROR_MESSAGE;
  }

  return GENERIC_ERROR_MESSAGE;
}

// Traducciones de los mensajes de validacion del backend (en ingles) a espanol.
const TRANSLATED_MESSAGES: Array<{ match: RegExp; text: string }> = [
  { match: /enough stock/i, text: 'Uno de los productos ya no tiene stock suficiente. Ajusta la cantidad o quitalo del carrito.' },
  { match: /unavailable products/i, text: 'Tu carrito tiene productos que ya no estan disponibles. Quitalos para continuar.' },
  { match: /inactive stores/i, text: 'Tu carrito tiene productos de una tienda inactiva. Quitalos para continuar.' },
  { match: /multiple currencies/i, text: 'No puedes comprar productos en monedas distintas en la misma orden.' },
  { match: /cart is empty/i, text: 'Tu carrito esta vacio.' },
];

function toPublicErrorMessage(message: string): string {
  const translation = TRANSLATED_MESSAGES.find((entry) => entry.match.test(message));

  if (translation) {
    return translation.text;
  }

  const lowerMessage = message.toLowerCase();
  const technicalWords = [
    'api',
    'backend',
    'configur',
    'expo_public',
    'jwt',
    'laravel',
    'supabase',
    'token',
  ];

  if (technicalWords.some((word) => lowerMessage.includes(word))) {
    return 'No pudimos completar la solicitud. Intenta nuevamente.';
  }

  return message;
}

export type ProductQuery = {
  search?: string;
  /** Acepta id, slug o nombre de categoria. */
  category?: string;
  store?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'recent' | 'price_asc' | 'price_desc' | 'rating' | 'name';
  perPage?: number;
  page?: number;
};

/** Una página del catálogo con la info de paginación ya normalizada. */
export type ProductsPage = {
  products: Product[];
  page: number;
  lastPage: number;
  total: number;
};

function buildProductsPath(query: ProductQuery = {}): string {
  const params = new URLSearchParams();

  const search = query.search?.trim();
  if (search) {
    params.set('search', search);
  }

  const category = query.category?.trim();
  // 'Todo' es el chip por defecto del movil: significa "sin filtro".
  if (category && category !== 'Todo') {
    params.set('category', category);
  }

  const store = query.store?.trim();
  if (store) {
    params.set('store', store);
  }

  if (typeof query.minPrice === 'number') {
    params.set('min_price', String(query.minPrice));
  }

  if (typeof query.maxPrice === 'number') {
    params.set('max_price', String(query.maxPrice));
  }

  if (query.inStock) {
    params.set('in_stock', '1');
  }

  if (query.sort) {
    params.set('sort', query.sort);
  }

  if (typeof query.perPage === 'number') {
    params.set('per_page', String(query.perPage));
  }

  if (typeof query.page === 'number' && query.page > 1) {
    params.set('page', String(query.page));
  }

  const queryString = params.toString();

  return queryString ? `/products?${queryString}` : '/products';
}

export async function fetchProducts(query: ProductQuery = {}): Promise<Product[]> {
  const response = await request<ApiCollection<unknown>>(buildProductsPath(query));

  return response.data.map(mapApiProductToProduct);
}

/**
 * Igual que fetchProducts pero devuelve además la info de paginación (página
 * actual y última), para poder cargar el catálogo de a páginas con scroll
 * infinito en vez de traer todo de golpe.
 */
export async function fetchProductsPage(query: ProductQuery = {}, page = 1): Promise<ProductsPage> {
  const response = await request<ApiCollection<unknown>>(buildProductsPath({ ...query, page }));
  const meta = (response.meta ?? {}) as { current_page?: number; last_page?: number; total?: number };

  return {
    products: response.data.map(mapApiProductToProduct),
    page: meta.current_page ?? page,
    lastPage: meta.last_page ?? 1,
    total: meta.total ?? response.data.length,
  };
}

export async function fetchCategoryNames(): Promise<string[]> {
  const response = await request<ApiCollection<{ name?: unknown }>>('/categories');

  return response.data
    .map((category) => (typeof category.name === 'string' ? category.name : null))
    .filter((name): name is string => name !== null);
}

export async function fetchCategories(timeoutMs?: number): Promise<CategoryResource[]> {
  const response = await request<ApiCollection<CategoryResource>>('/categories', { timeoutMs });

  return response.data;
}

export type ProfileResource = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
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

export type StoreResource = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  status: string;
};

export type CategoryResource = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
};

export type SellerVerificationResource = {
  id: string;
  business_name: string;
  business_description: string | null;
  document_type: string | null;
  document_number: string | null;
  status: string;
};

export type SellerCenterState =
  | 'verification_required'
  | 'verification_pending'
  | 'verification_rejected'
  | 'seller_suspended'
  | 'store_required'
  | 'store_suspended'
  | 'catalog_required'
  | 'catalog_ready';

export type SellerCenterResource = {
  state: SellerCenterState;
  profile: ProfileResource;
  products: Product[];
  store: StoreResource | null;
};

export async function fetchCart(token?: string): Promise<CartSnapshot> {
  if (!token) {
    return emptyCartSnapshot();
  }

  const response = await request<ApiCollection<unknown>>('/cart', { token });

  return {
    items: mapApiCartItemsToCartItems(response.data),
    summary: mapApiCartSummary(response.meta),
  };
}

export async function addProductToCart(productId: string, quantity = 1, token?: string): Promise<CartSnapshot> {
  if (!token) {
    return emptyCartSnapshot();
  }

  await request<ApiDocument<unknown>>('/cart/items', {
    method: 'POST',
    token,
    body: { product_id: productId, quantity },
  });

  return fetchCart(token);
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number, token?: string): Promise<CartSnapshot> {
  if (!token) {
    return emptyCartSnapshot();
  }

  await request<ApiDocument<unknown>>(`/cart/items/${cartItemId}`, {
    method: 'PATCH',
    token,
    body: { quantity },
  });

  return fetchCart(token);
}

export async function removeCartItem(cartItemId: string, token?: string): Promise<CartSnapshot> {
  if (!token) {
    return emptyCartSnapshot();
  }

  await request<void>(`/cart/items/${cartItemId}`, {
    method: 'DELETE',
    token,
  });

  return fetchCart(token);
}

/**
 * Crea los pedidos desde el carrito: uno por tienda. Devuelve un pedido si todo
 * era de la misma tienda, o varios si había de tiendas distintas (cada uno se
 * paga por separado).
 */
export async function createOrderFromCart(token?: string): Promise<Order[]> {
  const response = await request<ApiCollection<unknown>>('/orders/from-cart', {
    method: 'POST',
    token,
  });

  return response.data.map(mapApiOrderToOrder);
}

export async function cancelOrder(orderId: string, token?: string): Promise<Order> {
  const response = await request<ApiDocument<unknown>>(`/orders/${orderId}/cancel`, {
    method: 'POST',
    token,
  });

  return mapApiOrderToOrder(response.data);
}

export async function payOrder(orderId: string, token?: string): Promise<Order> {
  const response = await request<ApiDocument<unknown>>(`/orders/${orderId}/pay`, {
    method: 'POST',
    token,
  });

  return mapApiOrderToOrder(response.data);
}

/**
 * Inicia el pago con Stripe: pide al backend una Checkout Session y devuelve la
 * URL a la que hay que mandar al comprador. El pago se confirma por webhook, no
 * al volver de esta URL, asi que la app debe refrescar la orden al regresar.
 */
export async function createCheckoutSession(orderId: string, token?: string): Promise<string> {
  const response = await request<ApiDocument<{ checkout_url: string }>>(`/orders/${orderId}/checkout`, {
    method: 'POST',
    token,
  });

  return response.data.checkout_url;
}

export type NotificationsSnapshot = {
  notifications: AppNotification[];
  unreadCount: number;
};

const NOTIFICATION_TYPES: NotificationType[] = ['sale', 'payment_confirmed', 'order_status', 'cart_stock'];

function mapApiNotification(raw: unknown): AppNotification {
  const value = (raw ?? {}) as Record<string, unknown>;
  const type = value.type as NotificationType;

  return {
    id: String(value.id ?? ''),
    type: NOTIFICATION_TYPES.includes(type) ? type : 'order_status',
    title: String(value.title ?? ''),
    body: String(value.body ?? ''),
    data: value.data && typeof value.data === 'object' ? (value.data as Record<string, unknown>) : {},
    readAt: typeof value.read_at === 'string' ? value.read_at : null,
    createdAt: typeof value.created_at === 'string' ? value.created_at : null,
  };
}

export async function fetchNotifications(token?: string): Promise<NotificationsSnapshot> {
  if (!token) {
    return { notifications: [], unreadCount: 0 };
  }

  const response = await request<ApiCollection<unknown> & { unread_count?: unknown }>('/notifications', { token });

  return {
    notifications: (response.data ?? []).map(mapApiNotification),
    unreadCount: Number(response.unread_count ?? 0),
  };
}

export async function markNotificationRead(notificationId: string, token?: string): Promise<void> {
  if (!token) {
    return;
  }

  await request<ApiDocument<unknown>>(`/notifications/${notificationId}/read`, { method: 'POST', token });
}

export async function markAllNotificationsRead(token?: string): Promise<void> {
  if (!token) {
    return;
  }

  await request<ApiDocument<unknown>>('/notifications/read-all', { method: 'POST', token });
}

export async function registerPushToken(pushToken: string | null, token?: string): Promise<void> {
  if (!token) {
    return;
  }

  await request<ApiDocument<unknown>>('/me/push-token', {
    method: 'POST',
    token,
    body: { push_token: pushToken },
  });
}

export async function fetchOrders(token?: string): Promise<Order[]> {
  if (!token) {
    return [];
  }

  const response = await request<ApiCollection<unknown>>('/orders', { token });

  return response.data.map(mapApiOrderToOrder);
}

export async function fetchSellerSales(token?: string): Promise<Sale[]> {
  if (!token) {
    return [];
  }

  const response = await request<ApiCollection<unknown>>('/seller/sales', { token });

  return (response.data ?? []).map(mapApiSale);
}

export async function advanceSaleStatus(
  saleId: string,
  status: ItemFulfillmentStatus,
  token?: string,
): Promise<Sale> {
  const response = await request<ApiDocument<unknown>>(`/seller/sales/${saleId}`, {
    method: 'PATCH',
    token,
    body: { status },
  });

  return mapApiSale(response.data);
}

export async function fetchProfile(token?: string): Promise<ProfileResource | null> {
  if (!token) {
    return null;
  }

  const response = await request<ApiDocument<ProfileResource>>('/me', { token, timeoutMs: 8000 });

  return response.data;
}

export async function fetchMyStore(token?: string): Promise<{
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  status: string;
} | null> {
  if (!token) {
    return null;
  }

  const response = await request<ApiDocument<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    banner_url: string | null;
    status: string;
  }>>('/my-store', { token });

  return response.data;
}

export async function fetchSellerCenter(token?: string): Promise<SellerCenterResource | null> {
  if (!token) {
    return null;
  }

  const response = await request<ApiDocument<{
    state: SellerCenterState;
    profile: ProfileResource;
    products: unknown[];
    store: StoreResource | null;
  }>>('/seller-center', { token, timeoutMs: 12000 });

  return {
    state: response.data.state,
    profile: response.data.profile,
    products: response.data.products.map(mapApiProductToProduct),
    store: response.data.store,
  };
}

export async function submitSellerVerification(
  token: string,
  payload: {
    business_name: string;
    business_description?: string | null;
    document_type?: string | null;
    document_number?: string | null;
  },
): Promise<SellerVerificationResource> {
  const response = await request<ApiDocument<SellerVerificationResource>>('/seller-verification/request', {
    method: 'POST',
    token,
    body: payload,
  });

  return response.data;
}

export async function createStore(
  token: string,
  payload: {
    name: string;
    description?: string | null;
    logo_url?: string | null;
    banner_url?: string | null;
  },
): Promise<StoreResource> {
  const response = await request<ApiDocument<StoreResource>>('/stores', {
    method: 'POST',
    token,
    body: payload,
  });

  return response.data;
}

export async function fetchMyProducts(token?: string): Promise<Product[]> {
  if (!token) {
    return [];
  }

  const response = await request<ApiCollection<unknown>>('/my-products', { token });

  return response.data.map(mapApiProductToProduct);
}

export async function createProduct(
  token: string,
  payload: {
    category_id?: string | null;
    name: string;
    description?: string | null;
    images?: Array<{ alt_text?: string | null; url: string }>;
    price_cents: number;
    stock: number;
    status?: 'draft' | 'active' | 'paused';
  },
): Promise<Product> {
  const response = await request<ApiDocument<unknown>>('/products', {
    method: 'POST',
    token,
    body: payload,
  });

  return mapApiProductToProduct(response.data);
}

export async function updateProduct(
  token: string,
  productSlug: string,
  payload: {
    category_id?: string | null;
    name?: string;
    description?: string | null;
    images?: Array<{ alt_text?: string | null; url: string }>;
    price_cents?: number;
    stock?: number;
    status?: 'draft' | 'active' | 'paused';
  },
): Promise<Product> {
  const response = await request<ApiDocument<unknown>>(`/products/${productSlug}`, {
    method: 'PATCH',
    token,
    body: payload,
  });

  return mapApiProductToProduct(response.data);
}

export async function deleteProduct(token: string, productSlug: string): Promise<void> {
  await request<void>(`/products/${productSlug}`, {
    method: 'DELETE',
    token,
  });
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
    avatar_url?: string | null;
  },
): Promise<ProfileResource> {
  const response = await request<ApiDocument<ProfileResource>>('/me/profile', {
    method: 'PATCH',
    token,
    body: payload,
  });

  return response.data;
}

// ─── Descubrimiento social ───────────────────────────────────────────────────

function mapPublicUser(raw: unknown): PublicUser {
  const data = (raw ?? {}) as Record<string, unknown>;
  const store = data.store as Record<string, unknown> | null | undefined;

  return {
    id: String(data.id ?? ''),
    displayName: typeof data.display_name === 'string' ? data.display_name : null,
    avatarUrl: typeof data.avatar_url === 'string' ? data.avatar_url : null,
    role: typeof data.role === 'string' ? data.role : 'buyer',
    isVerified: data.is_verified === true,
    store: store
      ? {
          id: String(store.id ?? ''),
          slug: String(store.slug ?? ''),
          name: String(store.name ?? ''),
          description: typeof store.description === 'string' ? store.description : null,
          logoUrl: typeof store.logo_url === 'string' ? store.logo_url : null,
          bannerUrl: typeof store.banner_url === 'string' ? store.banner_url : null,
          status: String(store.status ?? 'active'),
        }
      : null,
  };
}

export async function searchUsers(query: string, token?: string): Promise<PublicUser[]> {
  const response = await request<ApiCollection<unknown>>(`/users/search?q=${encodeURIComponent(query)}`, { token });

  return response.data.map(mapPublicUser);
}

export async function fetchPublicProfile(userId: string, token?: string): Promise<PublicUser> {
  const response = await request<ApiDocument<unknown>>(`/users/${userId}`, { token });

  return mapPublicUser(response.data);
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export type VerificationRequestResource = {
  id: string;
  profile_id: string;
  business_name: string;
  business_description: string | null;
  document_type: string | null;
  document_number: string | null;
  status: string;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string | null;
  profile: {
    id: string;
    email: string | null;
    display_name: string | null;
    role: string;
    verification_status: string;
  } | null;
  reviewer: {
    id: string;
    email: string | null;
    display_name: string | null;
  } | null;
};

export type VerificationRequestsPage = {
  data: VerificationRequestResource[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
};

export async function fetchAdminVerificationRequests(
  token: string,
  page = 1,
): Promise<VerificationRequestsPage> {
  const response = await request<VerificationRequestsPage>(
    `/admin/seller-verification-requests?page=${page}`,
    { token },
  );
  return response;
}

export async function reviewVerificationRequest(
  token: string,
  requestId: string,
  status: 'approved' | 'rejected' | 'suspended',
  rejectionReason?: string,
): Promise<VerificationRequestResource> {
  const body: Record<string, unknown> = { status };

  if (status === 'rejected' && rejectionReason) {
    body.rejection_reason = rejectionReason;
  }

  const response = await request<{ data: VerificationRequestResource }>(
    `/admin/seller-verification-requests/${requestId}`,
    { method: 'PATCH', token, body },
  );

  return response.data;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export type ReviewAuthor = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

export type ReviewResource = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string | null;
  author: ReviewAuthor | null;
};

export type ReviewsPage = {
  data: ReviewResource[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
};

export async function fetchProductReviews(
  productSlug: string,
  page = 1,
): Promise<ReviewsPage> {
  return request<ReviewsPage>(`/products/${productSlug}/reviews?page=${page}`);
}

export async function createReview(
  token: string,
  productSlug: string,
  payload: { rating: number; body?: string | null; order_item_id?: string | null },
): Promise<ReviewResource> {
  const response = await request<ApiDocument<ReviewResource>>(
    `/products/${productSlug}/reviews`,
    { method: 'POST', token, body: payload },
  );
  return response.data;
}
