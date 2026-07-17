import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/marketplaceApi';
import type { AppNotification } from '../../types/marketplace';

type UseNotificationsParams = {
  accessToken: string | null;
  /** Only load once the buyer profile is ready. */
  isEnabled: boolean;
  /** How often to poll for new notifications, in ms. */
  pollIntervalMs?: number;
};

/**
 * Loads the notification center for the active profile, keeps the unread badge
 * fresh via polling, and exposes read/mark-all actions with optimistic updates.
 */
export function useNotifications({ accessToken, isEnabled, pollIntervalMs = 30000 }: UseNotificationsParams) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!accessToken || !isEnabled) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const snapshot = await fetchNotifications(accessToken);

      if (isMountedRef.current) {
        setNotifications(snapshot.notifications);
        setUnreadCount(snapshot.unreadCount);
      }
    } catch {
      // Silencioso: el badge simplemente no se actualiza en este intento.
    }
  }, [accessToken, isEnabled]);

  useEffect(() => {
    if (!accessToken || !isEnabled) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    refresh().finally(() => {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    });

    const intervalId = setInterval(refresh, pollIntervalMs);

    return () => clearInterval(intervalId);
  }, [accessToken, isEnabled, pollIntervalMs, refresh]);

  const markRead = useCallback(
    async (notificationId: string) => {
      const target = notifications.find((item) => item.id === notificationId);

      if (!target || target.readAt !== null) {
        return;
      }

      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, readAt } : item)),
      );
      setUnreadCount((current) => Math.max(0, current - 1));

      try {
        await markNotificationRead(notificationId, accessToken ?? undefined);
      } catch {
        refresh();
      }
    },
    [accessToken, notifications, refresh],
  );

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) {
      return;
    }

    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => (item.readAt ? item : { ...item, readAt })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead(accessToken ?? undefined);
    } catch {
      refresh();
    }
  }, [accessToken, refresh, unreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markRead,
    markAllRead,
  };
}
