import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { openPasswordRecoverySession } from '../../services/authService';

/**
 * Watches incoming deep links for a Supabase password-recovery session and
 * notifies the app so it can route the user to the reset flow. The callback is
 * invoked with `true` when a recovery session was opened and `false` when the
 * link could not be processed.
 */
export function usePasswordRecoveryDeepLink(onRecovery: (bumpResetKey: boolean) => void) {
  const onRecoveryRef = useRef(onRecovery);
  onRecoveryRef.current = onRecovery;

  useEffect(() => {
    let isMounted = true;

    const handlePasswordRecoveryUrl = async (url: string | null) => {
      if (!url) {
        return;
      }

      try {
        const isPasswordRecovery = await openPasswordRecoverySession(url);

        if (isMounted && isPasswordRecovery) {
          onRecoveryRef.current(true);
        }
      } catch {
        if (isMounted) {
          onRecoveryRef.current(false);
        }
      }
    };

    Linking.getInitialURL().then(handlePasswordRecoveryUrl);
    const subscription = Linking.addEventListener('url', (event) => {
      handlePasswordRecoveryUrl(event.url);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}
