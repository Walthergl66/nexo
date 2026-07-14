import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { PressableScale } from '../../components/common/PressableScale';
import { CartEmptyState } from '../../components/cart/CartEmptyState';
import { CartLineItem } from '../../components/cart/CartLineItem';
import { cartStyles as styles } from '../../components/cart/cartStyles';
import { InfoRow } from '../../components/common/InfoRow';
import { colors } from '../../theme/colors';
import type { CartItem, CartSummary } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';

type CartScreenProps = {
  isAuthenticated: boolean;
  items: CartItem[];
  summary: CartSummary;
  onBackToCatalog: () => void;
  onChangeQuantity: (productId: string, quantity: number) => void;
  onCheckout: () => void;
  onRemoveItem: (productId: string) => void;
};

export function CartScreen({
  isAuthenticated,
  items,
  summary,
  onBackToCatalog,
  onChangeQuantity,
  onCheckout,
  onRemoveItem,
}: CartScreenProps) {
  if (items.length === 0) {
    return <CartEmptyState isAuthenticated={isAuthenticated} onBackToCatalog={onBackToCatalog} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable accessibilityLabel="Volver al catalogo" style={styles.backButton} onPress={onBackToCatalog}>
          <Ionicons name="chevron-back" size={20} color={colors.brandBlue} />
        </Pressable>
        <View>
          <Text style={styles.title}>Carrito</Text>
          <Text style={styles.subtitle}>{items.length} productos agregados</Text>
        </View>
      </View>

      <View style={styles.list}>
        {items.map((item, index) => (
          <CartLineItem
            key={item.product.id}
            item={item}
            index={index}
            onChangeQuantity={onChangeQuantity}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Resumen</Text>
        <InfoRow label="Subtotal" value={formatPrice(summary.subtotal)} />
        <InfoRow label="Envio" value={summary.shipping > 0 ? formatPrice(summary.shipping) : 'Gratis'} />
        <View style={styles.divider} />
        <InfoRow label="Total" value={formatPrice(summary.total)} emphasize />
      </View>

      <PressableScale style={styles.checkoutButton} onPress={onCheckout}>
        <Ionicons name="lock-closed" size={16} color={colors.surface} />
        <Text style={styles.checkoutText}>Continuar compra</Text>
      </PressableScale>
    </View>
  );
}
