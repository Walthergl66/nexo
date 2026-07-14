import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows } from '../../theme/colors';
import type { Order, OrderStatus, PaymentStatus, Tone } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';
import { Tag } from '../common/Tag';

type OrderCardProps = {
  order: Order;
  isPaying?: boolean;
  onPay?: (orderId: string) => void;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente de pago',
  processing: 'En preparacion',
  shipped: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelada',
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pago pendiente',
  paid: 'Pago confirmado',
  failed: 'Pago fallido',
  refunded: 'Reembolsado',
};

const STATUS_PROGRESS: Record<OrderStatus, number> = {
  pending: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: 0,
};

export function OrderCard({ order, isPaying = false, onPay }: OrderCardProps) {
  const progress = STATUS_PROGRESS[order.status];
  const isCancelled = order.status === 'cancelled';
  const statusTone: Tone = isCancelled
    ? 'warning'
    : order.status === 'delivered'
      ? 'success'
      : 'default';
  const canPay = order.paymentStatus === 'pending' && !isCancelled;
  const orderDate = formatOrderDate(order.createdAt);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="cube-outline" size={20} color={colors.brandBlue} />
        </View>
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.id}>{order.orderNumber || order.id}</Text>
          <Text numberOfLines={1} style={styles.title}>
            {order.itemCount} {order.itemCount === 1 ? 'producto' : 'productos'}
            {orderDate ? ` · ${orderDate}` : ''}
          </Text>
        </View>
        <Text style={styles.total}>{formatPrice(order.total)}</Text>
      </View>

      {!isCancelled && (
        <View style={styles.progressRow}>
          {[0, 1, 2, 3].map((step) => (
            <View key={step} style={styles.progressSegment}>
              <View style={[styles.progressDot, step <= progress && styles.progressDotActive]} />
              {step < 3 && <View style={[styles.progressLine, step < progress && styles.progressLineActive]} />}
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Tag text={STATUS_LABELS[order.status]} tone={statusTone} />
        <View style={styles.paymentWrap}>
          <Ionicons
            name={order.paymentStatus === 'paid' ? 'checkmark-circle-outline' : 'time-outline'}
            size={14}
            color={order.paymentStatus === 'paid' ? colors.success : colors.inkMuted}
          />
          <Text style={styles.payment}>{PAYMENT_LABELS[order.paymentStatus]}</Text>
        </View>
      </View>

      {canPay && onPay && (
        <Pressable
          style={({ pressed }) => [
            styles.payButton,
            pressed && styles.payButtonPressed,
            isPaying && styles.payButtonDisabled,
          ]}
          disabled={isPaying}
          onPress={() => onPay(order.id)}
        >
          <Ionicons name="card-outline" size={16} color={colors.surface} />
          <Text style={styles.payButtonText}>{isPaying ? 'Procesando...' : 'Pagar ahora'}</Text>
        </Pressable>
      )}
    </View>
  );
}

function formatOrderDate(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  id: {
    fontSize: 12,
    color: colors.inkMuted,
    marginBottom: 4,
    fontWeight: '700',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 18,
  },
  total: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 13,
  },
  progressSegment: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  progressDotActive: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.line,
    marginHorizontal: 5,
    borderRadius: 1,
  },
  progressLineActive: {
    backgroundColor: colors.brandAccent,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  paymentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  payment: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  payButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brandBlue,
    borderRadius: radii.small,
    paddingVertical: 12,
  },
  payButtonPressed: {
    opacity: 0.85,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
});
