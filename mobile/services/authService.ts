import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type AuthProfileInput = {
  nationalId: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  address: string;
  phone: string;
};

export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => undefined };
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));

  return data.subscription;
}

export async function signInWithEmail(email: string, password: string): Promise<Session | null> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no esta configurado.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signUpWithEmail(email: string, password: string, profile: AuthProfileInput): Promise<Session | null> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no esta configurado.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        national_id: profile.nationalId,
        first_name: profile.firstName,
        last_name: profile.lastName,
        age: profile.age,
        gender: profile.gender,
        address: profile.address,
        phone: profile.phone,
        display_name: `${profile.firstName} ${profile.lastName}`.trim(),
      },
    },
  });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
