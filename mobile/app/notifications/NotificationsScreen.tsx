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
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable accessibilityLabel="Volver" style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color={colors.brandBlue} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Notificaciones</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Estas al dia'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <Pressable style={styles.markAll} onPress={onMarkAllRead}>
            <Text style={styles.markAllText}>Marcar todo</Text>
          </Pressable>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={30} color={colors.inkMuted} />
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyBody}>
            Aqui veras tus ventas, pagos, cambios de estado de tus ordenes y avisos de stock.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              style={[styles.card, notification.readAt === null && styles.cardUnread]}
              onPress={() => onMarkRead(notification.id)}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={TYPE_ICONS[notification.type]} size={18} color={colors.brandBlue} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{notification.title}</Text>
                <Text style={styles.cardText}>{notification.body}</Text>
                {formatDate(notification.createdAt) ? (
                  <Text style={styles.cardDate}>{formatDate(notification.createdAt)}</Text>
                ) : null}
              </View>
              {notification.readAt === null && <View style={styles.unreadDot} />}
            </Pressable>
          ))}
        </View>
      )}
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

  return date.toLocaleString();
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
    gap: 10,
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
