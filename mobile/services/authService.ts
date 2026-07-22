import type { Session } from '@supabase/supabase-js';
import { toPublicAuthMessage } from '../utils/authErrors';
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
    throw toPublicAuthError(error);
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
    throw new Error('El servicio de cuenta no esta disponible.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw toPublicAuthError(error);
  }

  return data.session;
}

export async function signUpWithEmail(email: string, password: string, profile: AuthProfileInput): Promise<Session | null> {
  if (!isSupabaseConfigured) {
    throw new Error('El servicio de cuenta no esta disponible.');
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
    throw toPublicAuthError(error);
  }

  return data.session;
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('El servicio de cuenta no esta disponible.');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: getPasswordResetRedirectUrl(),
  });

  if (error) {
    throw toPublicAuthError(error);
  }
}

export async function openPasswordRecoverySession(url: string): Promise<boolean> {
  const tokens = getPasswordRecoveryTokens(url);

  if (!tokens) {
    return false;
  }

  const { error } = await supabase.auth.setSession(tokens);

  if (error) {
    throw toPublicAuthError(error);
  }

  return true;
}

export async function updatePassword(password: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('El servicio de cuenta no esta disponible.');
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw toPublicAuthError(error);
  }
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw toPublicAuthError(error);
  }
}

function toPublicAuthError(error: Error): Error {
  return new Error(toPublicAuthMessage(error));
}

function getPasswordResetRedirectUrl(): string {
  const origin = getWebOrigin();

  if (origin) {
    return `${origin}/reset-password`;
  }

  return 'nexo://reset-password';
}

function getWebOrigin(): string | null {
  const location = (globalThis as { location?: { origin?: string } }).location;

  return location?.origin ?? null;
}

function getPasswordRecoveryTokens(url: string): { access_token: string; refresh_token: string } | null {
  const params = parseUrlParams(url);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const type = params.get('type');

  if (!accessToken || !refreshToken) {
    return null;
  }

  if (type && type !== 'recovery') {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

function parseUrlParams(url: string): URLSearchParams {
  const [, hash = ''] = url.split('#');
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';

  return new URLSearchParams(hash || query);
}
