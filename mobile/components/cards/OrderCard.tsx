import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FULFILLMENT_LABELS, FULFILLMENT_STEPS, fulfillmentStepIndex } from '../../constants/fulfillment';
import { colors, radii, shadows } from '../../theme/colors';
import type { Order, OrderItem, OrderStatus, PaymentStatus, Tone } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';
import { Tag } from '../common/Tag';

type OrderCardProps = {
  order: Order;
  isPaying?: boolean;
  isCancelling?: boolean;
  onPay?: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
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

export function OrderCard({ order, isPaying = false, isCancelling = false, onPay, onCancel }: OrderCardProps) {
  const progress = STATUS_PROGRESS[order.status];
  const isCancelled = order.status === 'cancelled';
  const statusTone: Tone = isCancelled
    ? 'warning'
    : order.status === 'delivered'
      ? 'success'
      : 'default';
  // Solo se puede pagar o cancelar mientras esté pendiente de pago.
  const isUnpaid = order.paymentStatus === 'pending' && !isCancelled;
  const canPay = isUnpaid;
  const canCancel = isUnpaid;
  const isBusy = isPaying || isCancelling;
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

      {order.paymentStatus === 'paid' && !isCancelled && order.items.length > 0 && (
        <View style={styles.items}>
          <Text style={styles.itemsTitle}>Seguimiento por producto</Text>
          {order.items.map((item) => (
            <OrderItemStatus key={item.id} item={item} />
          ))}
        </View>
      )}

      {(canPay || canCancel) && (
        <View style={styles.actionRow}>
          {canPay && onPay && (
            <Pressable
              style={({ pressed }) => [
                styles.payButton,
                pressed && styles.payButtonPressed,
                isBusy && styles.payButtonDisabled,
              ]}
              disabled={isBusy}
              onPress={() => onPay(order.id)}
            >
              <Ionicons name="card-outline" size={16} color={colors.surface} />
              <Text style={styles.payButtonText}>{isPaying ? 'Procesando...' : 'Pagar ahora'}</Text>
            </Pressable>
          )}

          {canCancel && onCancel && (
            <Pressable
              accessibilityLabel="Cancelar compra"
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
                isBusy && styles.payButtonDisabled,
              ]}
              disabled={isBusy}
              onPress={() => onCancel(order.id)}
            >
              <Ionicons name="close-circle-outline" size={16} color={colors.inkMuted} />
              <Text style={styles.cancelButtonText}>{isCancelling ? 'Cancelando...' : 'Cancelar compra'}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function OrderItemStatus({ item }: { item: OrderItem }) {
  const stepIndex = fulfillmentStepIndex(item.fulfillmentStatus);

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemTop}>
        <Text numberOfLines={1} style={styles.itemName}>
          {item.productName}
        </Text>
        <Text style={styles.itemStatus}>{FULFILLMENT_LABELS[item.fulfillmentStatus]}</Text>
      </View>
      <View style={styles.itemSteps}>
        {FULFILLMENT_STEPS.map((step, index) => {
          const reached = stepIndex >= index;
          return (
            <View key={step} style={styles.itemStepSeg}>
              {index > 0 && <View style={[styles.itemBar, reached && styles.itemBarOn]} />}
              <View style={[styles.itemDot, reached && styles.itemDotOn]} />
            </View>
          );
        })}
      </View>
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
  actionRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  payButton: {
    flex: 1,
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
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.small,
    paddingVertical: 12,
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  items: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 12,
  },
  itemsTitle: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  itemRow: {
    gap: 7,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemName: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  itemStatus: {
    color: colors.brandBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  itemSteps: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemStepSeg: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemBar: {
    flex: 1,
    height: 2,
    backgroundColor: colors.line,
  },
  itemBarOn: {
    backgroundColor: colors.brandAccent,
  },
  itemDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  itemDotOn: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue,
  },
});
