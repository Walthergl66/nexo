export type ApiCollection<T> = {
  data: T[];
  links?: unknown;
  meta?: unknown;
};

export type ApiDocument<T> = {
  data: T;
};

export type Profile = {
  id: string;
  supabase_user_id: string;
  email: string | null;
  display_name: string | null;
  role: 'buyer' | 'seller' | 'admin';
  verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
};

export type SellerVerificationRequest = {
  id: string;
  profile_id: string;
  business_name: string;
  business_description: string | null;
  document_type: string | null;
  document_number: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  profile?: Profile;
  reviewer?: Pick<Profile, 'id' | 'email' | 'display_name'> | null;
};

export type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: 'active' | 'inactive';
};

export type Store = {
  id: string;
  profile_id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'pending' | 'active' | 'suspended';
};

export type Product = {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  stock: number;
  status: 'draft' | 'active' | 'paused' | 'rejected';
  store?: Store;
  category?: Category | null;
};

export type ReviewStatus = 'approved' | 'rejected' | 'suspended';

export type CategoryPayload = {
  parent_id?: string | null;
  name: string;
  description?: string | null;
  status?: 'active' | 'inactive';
};
