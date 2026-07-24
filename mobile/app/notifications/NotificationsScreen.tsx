import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows } from '../../theme/colors';
import type { AppNotification, NotificationType } from '../../types/marketplace';

type NotificationsScreenProps = {
  notifications: AppNotification[];
  unreadCount: number;
  onBack: () => void;
  onMarkRead: (notificationId: string) => void;
  onMarkAllRead: () => void;
};

const TYPE_ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  sale: 'pricetag-outline',
  payment_confirmed: 'card-outline',
  order_status: 'cube-outline',
  cart_stock: 'alert-circle-outline',
};

export function NotificationsScreen({
  notifications,
  unreadCount,
  onBack,
  onMarkRead,
  onMarkAllRead,
}: NotificationsScreenProps) {
  const unreadNotifications = notifications.filter((notification) => notification.readAt === null);
  const previousNotifications = notifications.filter((notification) => notification.readAt !== null);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable accessibilityLabel="Volver" style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color={colors.brandBlue} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Notificaciones</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Estás al día'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel="Marcar todas como leídas" style={styles.markAll} onPress={onMarkAllRead}>
            <Ionicons name="checkmark-done-outline" size={15} color={colors.brandBlue} />
            <Text style={styles.markAllText}>Leer todas</Text>
          </Pressable>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={30} color={colors.inkMuted} />
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyBody}>
            Aquí verás tus ventas, pagos, cambios de estado de tus órdenes y avisos de stock.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {unreadNotifications.length > 0 && (
            <NotificationGroup
              title="Nuevas"
              notifications={unreadNotifications}
              onMarkRead={onMarkRead}
            />
          )}
          {previousNotifications.length > 0 && (
            <NotificationGroup
              title={unreadNotifications.length > 0 ? 'Anteriores' : 'Actividad reciente'}
              notifications={previousNotifications}
              onMarkRead={onMarkRead}
            />
          )}
        </View>
      )}
    </View>
  );
}

function NotificationGroup({
  title,
  notifications,
  onMarkRead,
}: {
  title: string;
  notifications: AppNotification[];
  onMarkRead: (notificationId: string) => void;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{title}</Text>
        <Text style={styles.groupCount}>{notifications.length}</Text>
      </View>
      {notifications.map((notification) => {
        const isUnread = notification.readAt === null;

        return (
          <Pressable
            key={notification.id}
            accessibilityRole="button"
            accessibilityLabel={`${isUnread ? 'Sin leer. ' : ''}${notification.title}`}
            style={({ pressed }) => [
              styles.card,
              isUnread && styles.cardUnread,
              pressed && styles.cardPressed,
            ]}
            onPress={() => onMarkRead(notification.id)}
          >
            <View style={[styles.iconWrap, isUnread && styles.iconWrapUnread]}>
              <Ionicons name={TYPE_ICONS[notification.type]} size={18} color={colors.brandBlue} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{notification.title}</Text>
              <Text style={styles.cardText}>{notification.body}</Text>
              {formatDate(notification.createdAt) ? (
                <Text style={styles.cardDate}>{formatDate(notification.createdAt)}</Text>
              ) : null}
            </View>
            {isUnread && <View style={styles.unreadDot} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const elapsed = Date.now() - date.getTime();
  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;

  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  markAll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    backgroundColor: colors.brandBlueSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  markAllText: {
    color: colors.brandBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  emptyBody: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
  },
  list: {
    gap: 18,
  },
  group: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  groupCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceSoft,
    color: colors.inkMuted,
    fontSize: 10,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    ...shadows.card,
  },
  cardUnread: {
    borderColor: colors.brandBlueLine,
    backgroundColor: colors.brandBlueSoft,
  },
  cardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
  },
  iconWrapUnread: {
    backgroundColor: colors.surface,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  cardText: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  cardDate: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.brandBlue,
    marginTop: 4,
  },
});
