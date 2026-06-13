import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LogicCard } from '../../components/cards/LogicCard';
import { OrderCard } from '../../components/cards/OrderCard';
import { SectionTitle } from '../../components/common/SectionTitle';
import { fetchOrders, supabaseAccessToken } from '../../services/marketplaceApi';
import type { Order } from '../../types/marketplace';

export function OrdersScreen() {
  const [remoteOrders, setRemoteOrders] = useState<Order[]>([]);
  const isAuthenticated = supabaseAccessToken.length > 0;

  useEffect(() => {
    if (!isAuthenticated) {
      setRemoteOrders([]);
      return;
    }

    let isMounted = true;

    fetchOrders()
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
  }, [isAuthenticated]);

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
      {remoteOrders.length > 0 ? (
        remoteOrders.map((order) => <OrderCard key={order.id} order={order} />)
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

const styles = StyleSheet.create({
  logicList: {
    gap: 12,
  },
});
