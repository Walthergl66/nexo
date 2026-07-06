import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows } from '../../theme/colors';
import type { Order } from '../../types/marketplace';
import { Tag } from '../common/Tag';

type OrderCardProps = {
  order: Order;
};

export function OrderCard({ order }: OrderCardProps) {
  const progress = getOrderProgress(order.status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="cube-outline" size={20} color={colors.brandBlue} />
        </View>
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.id}>{order.id}</Text>
          <Text numberOfLines={2} style={styles.title}>{order.title}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        {[0, 1, 2, 3].map((step) => (
          <View key={step} style={styles.progressSegment}>
            <View style={[styles.progressDot, step <= progress && styles.progressDotActive]} />
            {step < 3 && <View style={[styles.progressLine, step < progress && styles.progressLineActive]} />}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Tag text={order.status} tone={order.status === 'Entregado' ? 'success' : 'default'} />
        <View style={styles.etaWrap}>
          <Ionicons name="time-outline" size={14} color={colors.inkMuted} />
          <Text style={styles.eta}>{order.eta}</Text>
        </View>
      </View>
    </View>
  );
}

function getOrderProgress(status: Order['status']) {
  if (status === 'Pagado') {
    return 0;
  }

  if (status === 'Empacado') {
    return 1;
  }

  if (status === 'En camino') {
    return 2;
  }

  return 3;
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
    alignItems: 'flex-start',
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 20,
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
  },
  etaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  eta: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
