import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { ApiRequestError, fetchProfile, type ProfileResource } from '../../services/marketplaceApi';
import { cacheProfile, clearCachedProfile, getCachedProfile } from '../../utils/profileCache';
import { PROFILE_AUTO_REFRESH_MS, REFRESH_THROTTLE_MS } from '../../constants/app';

type UseProfileParams = {
  accessToken: string | null;
  /** Invoked when the API rejects the token (401) so the app can sign out. */
  onUnauthorized: () => void | Promise<void>;
};

/**
 * Loads and keeps the authenticated profile in sync: hydrates from cache,
 * refreshes from the API, auto-refreshes on an interval, and surfaces load
 * errors. Cart state reacts to the profile elsewhere, so this hook stays
 * focused on the profile resource only.
 */
export function useProfile({ accessToken, onUnauthorized }: UseProfileParams) {
  const [profile, setProfile] = useState<ProfileResource | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const lastProfileRefreshRequestAt = useRef(0);
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  const handleProfileChange = useCallback(
    (nextProfile: ProfileResource | null) => {
      setProfile(nextProfile);

      if (accessToken && nextProfile) {
        cacheProfile(accessToken, nextProfile);
      }
    },
    [accessToken],
  );

  const retryProfile = useCallback(() => {
    setProfileRefreshKey((current) => current + 1);
  }, []);

  const clearProfileError = useCallback(() => {
    setProfileError(null);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const hasProfileAtStart = profile !== null;

    if (!accessToken) {
      clearCachedProfile();
      setProfile(null);
      setIsProfileLoading(false);
      setProfileError(null);
      return () => {
        isMounted = false;
      };
    }

    if (!hasProfileAtStart) {
      setIsProfileLoading(true);
    }

    setProfileError(null);

    const loadProfile = async () => {
      const cachedProfile = await getCachedProfile(accessToken);

      if (isMounted && cachedProfile) {
        setProfile((current) => current ?? cachedProfile);
        setProfileError(null);
        setIsProfileLoading(false);
      }

      try {
        const nextProfile = await fetchProfile(accessToken);

        if (isMounted) {
          if (!nextProfile) {
            setProfile((current) => {
              if (current ?? cachedProfile) {
                return current ?? cachedProfile;
              }

              setProfileError('No pudimos cargar tus datos de cuenta. Intenta nuevamente.');
              return null;
            });
            return;
          }

          setProfile(nextProfile);
          setProfileError(null);
          cacheProfile(accessToken, nextProfile);
        }
      } catch (error) {
        if (isMounted) {
          if (error instanceof ApiRequestError && error.status === 401) {
            await onUnauthorizedRef.current();
            setProfile(null);
            setProfileError(null);
            return;
          }

          setProfile((current) => {
            const fallbackProfile = current ?? cachedProfile;

            if (fallbackProfile) {
              setProfileError(null);
              return fallbackProfile;
            }

            setProfileError(
              error instanceof Error ? error.message : 'No pudimos cargar tus datos de cuenta. Intenta nuevamente.',
            );
            return null;
          });
        }
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [accessToken, profileRefreshKey]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const refreshProfile = () => {
      const now = Date.now();

      if (now - lastProfileRefreshRequestAt.current < REFRESH_THROTTLE_MS) {
        return;
      }

      lastProfileRefreshRequestAt.current = now;
      setProfileRefreshKey((current) => current + 1);
    };
    const interval = setInterval(refreshProfile, PROFILE_AUTO_REFRESH_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshProfile();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [accessToken]);

  return {
    profile,
    isProfileLoading,
    profileError,
    onProfileChange: handleProfileChange,
    retryProfile,
    clearProfileError,
  };
}
