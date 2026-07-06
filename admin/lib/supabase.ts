import { createClient } from '@supabase/supabase-js';

export const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'missing-anon-key';

if (!hasSupabaseConfig) {
  console.warn('Supabase env vars are missing for nexo admin.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
