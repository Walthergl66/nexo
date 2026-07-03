import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LogicCard } from '../../components/cards/LogicCard';
import { OrderCard } from '../../components/cards/OrderCard';
import { SectionTitle } from '../../components/common/SectionTitle';
import { fetchOrders } from '../../services/marketplaceApi';
import { colors, radii, shadows } from '../../theme/colors';
import type { Order } from '../../types/marketplace';

type OrdersScreenProps = {
  accessToken: string | null;
};

export function OrdersScreen({ accessToken }: OrdersScreenProps) {
  const [remoteOrders, setRemoteOrders] = useState<Order[]>([]);
  const isAuthenticated = accessToken !== null;
  const activeOrders = remoteOrders.filter((order) => order.status !== 'Entregado').length;
  const deliveredOrders = remoteOrders.length - activeOrders;

  useEffect(() => {
    if (!isAuthenticated) {
      setRemoteOrders([]);
      return;
    }

    let isMounted = true;

    fetchOrders(accessToken ?? undefined)
      .then((items) => {
        if (isMounted) {
          setRemoteOrders(items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRemoteOrders([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <>
        <SectionTitle title="Pedidos" subtitle="Historial y seguimiento protegidos." />
        <View style={styles.logicList}>
          <LogicCard
            title="Inicia sesion"
            description="Necesitas una cuenta para crear ordenes, ver pagos pendientes y consultar el historial de compras."
          />
        </View>
      </>
    );
  }

  return (
    <>
      <SectionTitle
        title="Seguimiento de pedidos"
        subtitle="Ordenes creadas desde tu carrito."
      />

      <View style={styles.summaryPanel}>
        <View style={styles.summaryHeader}>
          <View style={styles.summaryIcon}>
            <Ionicons name="receipt-outline" size={21} color={colors.brandBlue} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>Historial de compras</Text>
            <Text style={styles.summarySubtitle}>
              Estado actualizado desde ordenes confirmadas por el backend.
            </Text>
          </View>
        </View>
        <View style={styles.metricRow}>
          <MetricTile label="Total" value={String(remoteOrders.length)} />
          <MetricTile label="Activos" value={String(activeOrders)} />
          <MetricTile label="Entregados" value={String(deliveredOrders)} />
        </View>
      </View>

      {remoteOrders.length > 0 ? (
        <View style={styles.orderList}>
          {remoteOrders.map((order) => <OrderCard key={order.id} order={order} />)}
        </View>
      ) : (
        <View style={styles.logicList}>
          <LogicCard
            title="Sin ordenes"
            description="Cuando crees una orden desde el carrito, aparecera aqui con su estado real."
          />
        </View>
      )}
    </>
  );
}

type MetricTileProps = {
  label: string;
  value: string;
};

function MetricTile({ label, value }: MetricTileProps) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryPanel: {
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 14,
    ...shadows.card,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  summaryTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  summarySubtitle: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 3,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    minHeight: 68,
    borderRadius: radii.small,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  metricValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  orderList: {
    gap: 0,
  },
  logicList: {
    gap: 12,
  },
});
