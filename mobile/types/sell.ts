import type { CategoryResource, ProfileResource, SellerCenterState, StoreResource } from '../services/marketplaceApi';
import type { ProductImageAsset } from '../services/productImageService';
import type { StoreLogoAsset } from '../services/storeLogoService';
import type { Product } from './marketplace';

export type SellScreenProps = {
  accessToken: string | null;
  profile: ProfileResource | null;
  isProfileLoading: boolean;
  onExploreProducts: () => void;
  onGoToAccount: () => void;
  onProfileChange: (profile: ProfileResource | null) => void;
};

export type StoreForm = {
  logo: StoreLogoAsset | null;
  logoZoom: number;
  name: string;
  description: string;
};

export type VerificationForm = {
  businessName: string;
  businessDescription: string;
  documentType: string;
  documentNumber: string;
};

export type ProductForm = {
  categoryId: string;
  name: string;
  description: string;
  image: ProductImageAsset | null;
  price: string;
  publishNow: boolean;
  stock: string;
};

export type CachedSellerState = {
  products: Product[];
  sellerState: SellerCenterState | null;
  store: StoreResource | null;
};

export type { CategoryResource, SellerCenterState, StoreResource };
