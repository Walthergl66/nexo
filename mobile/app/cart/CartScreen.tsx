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

  const hasAvailabilityIssues = items.some(
    (item) => !item.product.available || item.product.stock <= 0 || item.quantity > item.product.stock,
  );
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

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
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryTitle}>Resumen de compra</Text>
            <Text style={styles.summaryCaption}>{itemCount} {itemCount === 1 ? 'artículo' : 'artículos'} en total</Text>
          </View>
          <View style={styles.summaryIcon}>
            <Ionicons name="receipt-outline" size={18} color={colors.brandBlue} />
          </View>
        </View>
        <InfoRow label="Subtotal" value={formatPrice(summary.subtotal)} />
        <InfoRow label="Envio" value={summary.shipping > 0 ? formatPrice(summary.shipping) : 'Gratis'} />
        <View style={styles.divider} />
        <InfoRow label="Total" value={formatPrice(summary.total)} emphasize />
      </View>

      {hasAvailabilityIssues && (
        <View style={styles.availabilityWarning}>
          <Ionicons name="alert-circle-outline" size={18} color="#8A5800" />
          <Text style={styles.availabilityWarningText}>Corrige la disponibilidad marcada antes de continuar.</Text>
        </View>
      )}

      <PressableScale
        accessibilityLabel={hasAvailabilityIssues ? 'Pago no disponible por problemas de stock' : 'Continuar al pago seguro'}
        disabled={hasAvailabilityIssues}
        style={[styles.checkoutButton, hasAvailabilityIssues && styles.checkoutButtonDisabled]}
        onPress={onCheckout}
      >
        <Ionicons name="lock-closed" size={16} color={colors.surface} />
        <Text style={styles.checkoutText}>{hasAvailabilityIssues ? 'Revisa tu carrito' : `Pagar ${formatPrice(summary.total)}`}</Text>
      </PressableScale>
      {!hasAvailabilityIssues && (
        <View style={styles.securePaymentRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.inkMuted} />
          <Text style={styles.securePaymentText}>Pago seguro. Confirmarás los datos antes de completar la compra.</Text>
        </View>
      )}
    </View>
  );
}
