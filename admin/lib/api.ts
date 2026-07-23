import type {
  AdminOverview,
  ApiCollection,
  ApiDocument,
  Category,
  CategoryPayload,
  Paginated,
  PaginationMeta,
  Product,
  Profile,
  ReviewStatus,
  SellerVerificationRequest,
  Store,
} from './types';

/** Opciones de paginacion aceptadas por los listados admin. */
export type PageParams = {
  page?: number;
  perPage?: number;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  token?: string;
};

const apiBaseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000/api');

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
    throw new Error(await getApiErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function getApiErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: unknown; errors?: Record<string, string[]> };

    if (payload.errors && Object.keys(payload.errors).length > 0) {
      return Object.values(payload.errors).flat().join(' ');
    }

    if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
      return payload.message;
    }
  } catch {
    return 'No se pudo completar la solicitud.';
  }

  return 'No se pudo completar la solicitud.';
}

/**
 * Convierte una respuesta paginada de Laravel en un `Paginated<T>`. El `meta`
 * de Laravel trae mas campos, pero el panel solo necesita estos cuatro; si por
 * algo faltara (una lista sin paginar), se asume una unica pagina.
 */
function toPaginated<T>(response: ApiCollection<T>): Paginated<T> {
  const meta = (response.meta ?? {}) as Partial<PaginationMeta>;
  const total = meta.total ?? response.data.length;
  const perPage = meta.per_page ?? response.data.length;

  return {
    data: response.data,
    meta: {
      current_page: meta.current_page ?? 1,
      last_page: meta.last_page ?? 1,
      per_page: perPage,
      total,
    },
  };
}

function toQueryString(params: PageParams): string {
  const query = new URLSearchParams();

  if (params.page && params.page > 1) {
    query.set('page', String(params.page));
  }

  if (params.perPage) {
    query.set('per_page', String(params.perPage));
  }

  const serialized = query.toString();

  return serialized ? `?${serialized}` : '';
}

export async function fetchMe(token: string): Promise<Profile> {
  const response = await request<ApiDocument<Profile>>('/me', { token });

  return response.data;
}

export async function fetchAdminOverview(token: string): Promise<AdminOverview> {
  const response = await request<ApiDocument<AdminOverview>>('/admin/overview', { token });

  return response.data;
}

export async function fetchSellerVerificationRequests(
  token: string,
  params: PageParams = {},
): Promise<Paginated<SellerVerificationRequest>> {
  const response = await request<ApiCollection<SellerVerificationRequest>>(
    `/admin/seller-verification-requests${toQueryString(params)}`,
    { token },
  );

  return toPaginated(response);
}

export async function reviewSellerVerificationRequest(
  token: string,
  id: string,
  status: ReviewStatus,
  rejectionReason?: string,
): Promise<SellerVerificationRequest> {
  const response = await request<ApiDocument<SellerVerificationRequest>>(
    `/admin/seller-verification-requests/${id}`,
    {
      method: 'PATCH',
      token,
      body: {
        status,
        rejection_reason: rejectionReason?.trim() || null,
      },
    },
  );

  return response.data;
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await request<ApiCollection<Category>>('/categories');

  return response.data;
}

export async function createCategory(token: string, payload: CategoryPayload): Promise<Category> {
  const response = await request<ApiDocument<Category>>('/admin/categories', {
    method: 'POST',
    token,
    body: payload,
  });

  return response.data;
}

export async function updateCategory(token: string, id: string, payload: Partial<CategoryPayload>): Promise<Category> {
  const response = await request<ApiDocument<Category>>(`/admin/categories/${id}`, {
    method: 'PATCH',
    token,
    body: payload,
  });

  return response.data;
}

export async function fetchProducts(params: PageParams = {}): Promise<Paginated<Product>> {
  const response = await request<ApiCollection<Product>>(`/products${toQueryString(params)}`);

  return toPaginated(response);
}

export async function fetchStores(): Promise<Store[]> {
  const response = await request<ApiCollection<Store>>('/stores');

  return response.data;
}

export async function fetchAdminStores(token: string, params: PageParams = {}): Promise<Paginated<Store>> {
  const response = await request<ApiCollection<Store>>(`/admin/stores${toQueryString(params)}`, { token });

  return toPaginated(response);
}

export async function updateStoreStatus(token: string, slug: string, status: 'active' | 'suspended'): Promise<Store> {
  const response = await request<ApiDocument<Store>>(`/admin/stores/${slug}`, {
    method: 'PATCH',
    token,
    body: { status },
  });

  return response.data;
}

export async function deleteStore(token: string, slug: string): Promise<void> {
  await request<void>(`/admin/stores/${slug}`, {
    method: 'DELETE',
    token,
  });
}
