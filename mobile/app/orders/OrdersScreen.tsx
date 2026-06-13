import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LogicCard } from '../../components/cards/LogicCard';
import { OrderCard } from '../../components/cards/OrderCard';
import { SectionTitle } from '../../components/common/SectionTitle';
import { orders } from '../../data/mockMarketplace';
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

  const visibleOrders = isAuthenticated && remoteOrders.length > 0 ? remoteOrders : orders;

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
        subtitle="Estados claros para comprador y soporte."
      />
      {visibleOrders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}

      <SectionTitle
        title="Postventa"
        subtitle="Escenarios necesarios para confianza y retención."
      />
      <View style={styles.logicList}>
        <LogicCard
          title="Devoluciones"
          description="Solicitud dentro del plazo, validación y resolución por evidencia."
        />
        <LogicCard
          title="Reclamos"
          description="Mediación cuando el producto no llega o no coincide."
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  logicList: {
    gap: 12,
  },
});
