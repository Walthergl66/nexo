import { View } from 'react-native';
import { SellerSalesList } from '../SellerSalesList';
import { LogicCard } from '../../cards/LogicCard';
import { styles as sellStyles } from '../sellStyles';
import type { Sale } from '../../../types/marketplace';

type SalesSectionProps = {
  canManageSales: boolean;
  sales: Sale[];
  isLoading: boolean;
  advancingId: string | null;
  onAdvance: (sale: Sale) => void;
};

/**
 * Sección "Ventas": los productos ya pagados, con la logística de fulfilment
 * (Procesar → Empacar → Enviar → Entregar). Al avanzar, el backend le avisa al
 * comprador; el comprador lo ve casi en vivo desde sus Pedidos.
 */
export function SalesSection({ canManageSales, sales, isLoading, advancingId, onAdvance }: SalesSectionProps) {
  if (!canManageSales) {
    return (
      <View style={sellStyles.logicList}>
        <LogicCard
          title="Aún no puedes gestionar ventas"
          description="Necesitas una tienda activa para recibir pedidos pagados y gestionar su envío."
        />
      </View>
    );
  }

  return <SellerSalesList sales={sales} isLoading={isLoading} advancingId={advancingId} onAdvance={onAdvance} />;
}
