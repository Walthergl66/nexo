import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentSession, onAuthStateChange } from '../../services/authService';

/**
 * Owns the Supabase access token and session-readiness flag. Notifies the app
 * whenever the token actually changes so it can reset navigation state, and
 * exposes a setter used by the profile flow to force a sign-out.
 */
export function useAuthSession(onTokenChange?: (token: string | null) => void) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const currentAccessToken = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  onTokenChangeRef.current = onTokenChange;

  useEffect(() => {
    let isMounted = true;

    const applySessionToken = (nextToken: string | null) => {
      if (!isMounted || currentAccessToken.current === nextToken) {
        return;
      }

      currentAccessToken.current = nextToken;
      setAccessTokenState(nextToken);
      onTokenChangeRef.current?.(nextToken);
    };

    getCurrentSession()
      .then((session) => {
        applySessionToken(session?.access_token ?? null);
      })
      .catch(() => {
        applySessionToken(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsSessionReady(true);
        }
      });

    const subscription = onAuthStateChange((session) => {
      applySessionToken(session?.access_token ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setAccessToken = useCallback((nextToken: string | null) => {
    currentAccessToken.current = nextToken;
    setAccessTokenState(nextToken);
  }, []);

  return { accessToken, isSessionReady, setAccessToken };
}
