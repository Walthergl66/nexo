import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { registerPushToken } from '../../services/marketplaceApi';

type UsePushNotificationsParams = {
  accessToken: string | null;
  /** Only register once the buyer profile is ready. */
  isEnabled: boolean;
  /** Called when a push arrives (foreground) or is tapped, to refresh the list. */
  onNotificationReceived: () => void;
};

// Mostrar el aviso aunque la app este en primer plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function resolveExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }

  const settings = await Notifications.getPermissionsAsync();
  let status = settings.status;

  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }

  if (status !== 'granted') {
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
  } catch {
    return null;
  }
}

/**
 * Registers this device's Expo push token with the backend and refreshes the
 * in-app center whenever a push is received or tapped. Push is best-effort:
 * it silently no-ops on web, simulators, or when permission is denied.
 */
export function usePushNotifications({ accessToken, isEnabled, onNotificationReceived }: UsePushNotificationsParams) {
  const onReceivedRef = useRef(onNotificationReceived);
  onReceivedRef.current = onNotificationReceived;

  useEffect(() => {
    if (!accessToken || !isEnabled) {
      return;
    }

    let isActive = true;

    resolveExpoPushToken()
      .then((pushToken) => {
        if (isActive && pushToken) {
          return registerPushToken(pushToken, accessToken);
        }

        return undefined;
      })
      .catch(() => {
        // best-effort: si falla el registro, el centro in-app sigue funcionando.
      });

    const receivedSub = Notifications.addNotificationReceivedListener(() => onReceivedRef.current());
    const responseSub = Notifications.addNotificationResponseReceivedListener(() => onReceivedRef.current());

    return () => {
      isActive = false;
      receivedSub.remove();
      responseSub.remove();
    };
  }, [accessToken, isEnabled]);
}
