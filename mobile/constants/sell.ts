import type { ProductForm, StoreForm, VerificationForm } from '../types/sell';

export const initialVerificationForm: VerificationForm = {
  businessName: '',
  businessDescription: '',
  documentType: 'ruc',
  documentNumber: '',
};

export const initialStoreForm: StoreForm = {
  logo: null,
  logoZoom: 1,
  name: '',
  description: '',
};

export const initialProductForm: ProductForm = {
  categoryId: '',
  name: '',
  description: '',
  image: null,
  price: '',
  publishNow: false,
  stock: '',
};

export const SELLER_STATE_CACHE_KEY_PREFIX = 'nexo.seller-state.v1.';
export const CATEGORIES_CACHE_KEY = 'nexo.categories.cache.v1';
export const SELLER_CENTER_AUTO_REFRESH_MS = 15000;
export const CATEGORIES_LOAD_TIMEOUT_MS = 12000;
