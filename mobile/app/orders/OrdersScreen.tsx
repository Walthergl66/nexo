import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet, Text, View } from 'react-native';
import { LogicCard } from '../../components/cards/LogicCard';
import { OrderCard } from '../../components/cards/OrderCard';
import { SectionTitle } from '../../components/common/SectionTitle';
import { createCheckoutSession, fetchOrders } from '../../services/marketplaceApi';
import { ORDERS_AUTO_REFRESH_MS } from '../../constants/app';
import { colors, radii, shadows } from '../../theme/colors';
import type { Order } from '../../types/marketplace';
import type { StatusTone } from '../../types/status';

type OrdersScreenProps = {
  accessToken: string | null;
  onStatusMessage?: (message: string, tone: StatusTone) => void;
};

const CLOSED_STATUSES: Order['status'][] = ['delivered', 'cancelled'];

export function OrdersScreen({ accessToken, onStatusMessage }: OrdersScreenProps) {
  const [remoteOrders, setRemoteOrders] = useState<Order[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const isAuthenticated = accessToken !== null;
  const activeOrders = remoteOrders.filter((order) => !CLOSED_STATUSES.includes(order.status)).length;
  const deliveredOrders = remoteOrders.filter((order) => order.status === 'delivered').length;

  const loadOrders = useCallback(async () => {
    if (!accessToken) {
      setRemoteOrders([]);
      return;
    }

    try {
      setRemoteOrders(await fetchOrders(accessToken));
    } catch {
      // Se conserva lo que ya estaba en pantalla; un fallo de red no debe
      // vaciar la lista de pedidos.
    }
  }, [accessToken]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Al volver de Stripe (o de cualquier salida a otra app) se recargan los
  // pedidos: el webhook ya habra confirmado el pago para entonces.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void loadOrders();
      }
    });

    return () => subscription.remove();
  }, [loadOrders]);

  // Refresco casi en vivo mientras el comprador mira sus pedidos: cuando el
  // vendedor avanza el estado (empacado, enviado, entregado), aparece en pocos
  // segundos sin que el comprador tenga que hacer nada. loadOrders es silencioso
  // (no vacía la lista ante un fallo), así que no parpadea.
  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const interval = setInterval(() => {
      void loadOrders();
    }, ORDERS_AUTO_REFRESH_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, loadOrders]);

  const handlePay = useCallback(
    async (orderId: string) => {
      if (!accessToken) {
        return;
      }

      setPayingId(orderId);

      try {
        const checkoutUrl = await createCheckoutSession(orderId, accessToken);
        await Linking.openURL(checkoutUrl);
        onStatusMessage?.('Te llevamos a Stripe para completar el pago.', 'info');
      } catch {
        onStatusMessage?.('No pudimos iniciar el pago. Intenta nuevamente.', 'error');
      } finally {
        setPayingId(null);
      }
    },
    [accessToken, onStatusMessage],
  );

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
          {remoteOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isPaying={payingId === order.id}
              onPay={handlePay}
            />
          ))}
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
    fontWeight: '700',
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
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  orderList: {
    gap: 0,
  },
  logicList: {
    gap: 12,
  },
});
