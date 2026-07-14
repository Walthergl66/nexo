import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants, { AppOwnership, ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { registerPushToken } from '../../services/marketplaceApi';

// Desde el SDK 53 expo-notifications ya no soporta push en Expo Go. El paquete
// tiene un side-effect (DevicePushTokenAutoRegistration.fx) que registra un push
// token listener con solo importarlo, lo que en Android + Expo Go lanza y muestra
// la pantalla roja. Por eso NO importamos 'expo-notifications' de forma estatica:
// lo cargamos con import() dinamico unicamente cuando NO estamos en Expo Go.
const isRunningInExpoGo =
  Constants.appOwnership === AppOwnership.Expo ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type NotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<NotificationsModule> | null = null;
let didConfigureHandler = false;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (isRunningInExpoGo || Platform.OS === 'web') {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications');
  }

  const Notifications = await notificationsModulePromise;

  if (!didConfigureHandler) {
    didConfigureHandler = true;
    // Mostrar el aviso aunque la app este en primer plano.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  return Notifications;
}

type UsePushNotificationsParams = {
  accessToken: string | null;
  /** Only register once the buyer profile is ready. */
  isEnabled: boolean;
  /** Called when a push arrives (foreground) or is tapped, to refresh the list. */
  onNotificationReceived: () => void;
};

async function resolveExpoPushToken(Notifications: NotificationsModule): Promise<string | null> {
  if (!Device.isDevice) {
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
 * it silently no-ops on web, Expo Go, simulators, or when permission is denied.
 */
export function usePushNotifications({ accessToken, isEnabled, onNotificationReceived }: UsePushNotificationsParams) {
  const onReceivedRef = useRef(onNotificationReceived);
  onReceivedRef.current = onNotificationReceived;

  useEffect(() => {
    if (!accessToken || !isEnabled || isRunningInExpoGo || Platform.OS === 'web') {
      return;
    }

    let isActive = true;
    let cleanup: (() => void) | undefined;

    loadNotifications()
      .then((Notifications) => {
        if (!isActive || !Notifications) {
          return;
        }

        resolveExpoPushToken(Notifications)
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

        cleanup = () => {
          receivedSub.remove();
          responseSub.remove();
        };
      })
      .catch(() => {
        // best-effort: si el modulo no carga, el centro in-app sigue funcionando.
      });

    return () => {
      isActive = false;
      cleanup?.();
    };
  }, [accessToken, isEnabled]);
}
