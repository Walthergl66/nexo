import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const supabase = createClient(supabaseUrl || 'https://localhost.supabase.co', supabaseAnonKey || 'missing-key', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
