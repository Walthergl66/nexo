import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../theme/colors';
import type { Order } from '../../types/marketplace';
import { Tag } from '../common/Tag';

type OrderCardProps = {
  order: Order;
};

export function OrderCard({ order }: OrderCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.id}>{order.id}</Text>
      <Text style={styles.title}>{order.title}</Text>
      <View style={styles.footer}>
        <Tag text={order.status} tone="default" />
        <Text style={styles.eta}>{order.eta}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
  },
  id: {
    fontSize: 12,
    color: colors.inkMuted,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eta: {
    color: colors.inkMuted,
    fontSize: 12,
  },
});
