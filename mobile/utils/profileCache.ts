import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProfileResource } from '../services/marketplaceApi';

const PROFILE_CACHE_KEY = 'nexo.profile.cache.v1';

type CachedProfile = {
  profile: ProfileResource;
  subject: string;
};

export async function getCachedProfile(token: string): Promise<ProfileResource | null> {
  const subject = getTokenSubject(token);

  if (!subject) {
    return null;
  }

  try {
    const rawValue = await AsyncStorage.getItem(PROFILE_CACHE_KEY);

    if (!rawValue) {
      return null;
    }

    const cached = JSON.parse(rawValue) as Partial<CachedProfile>;

    if (cached.subject !== subject || !cached.profile) {
      return null;
    }

    return cached.profile;
  } catch {
    return null;
  }
}

export async function cacheProfile(token: string, profile: ProfileResource): Promise<void> {
  const subject = getTokenSubject(token);

  if (!subject) {
    return;
  }

  try {
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ profile, subject }));
  } catch {
    return;
  }
}

export async function clearCachedProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    return;
  }
}

function getTokenSubject(token: string): string | null {
  const [, encodedPayload] = token.split('.');

  if (!encodedPayload) {
    return null;
  }

  const atob = (globalThis as { atob?: (value: string) => string }).atob;

  if (!atob) {
    return null;
  }

  try {
    const normalizedPayload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '=',
    );
    const payload = JSON.parse(atob(paddedPayload)) as { sub?: unknown };

    return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null;
  } catch {
    return null;
  }
}
