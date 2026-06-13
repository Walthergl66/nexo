import { StyleSheet, View } from 'react-native';
import { LogicCard } from '../../components/cards/LogicCard';
import { OrderCard } from '../../components/cards/OrderCard';
import { SectionTitle } from '../../components/common/SectionTitle';
import { orders } from '../../data/mockMarketplace';

export function OrdersScreen() {
  return (
    <>
      <SectionTitle
        title="Seguimiento de pedidos"
        subtitle="Estados claros para comprador y soporte."
      />
      {orders.map((order) => (
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
