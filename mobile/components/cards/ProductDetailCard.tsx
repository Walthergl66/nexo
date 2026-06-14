import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';
import { InfoRow } from '../common/InfoRow';
import { Tag } from '../common/Tag';

type ProductDetailCardProps = {
  product: Product;
  isAuthenticated: boolean;
  onAddToCart: () => void;
  onBack: () => void;
};

export function ProductDetailCard({
  product,
  isAuthenticated,
  onAddToCart,
  onBack,
}: ProductDetailCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable accessibilityLabel="Volver al catalogo" style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color={colors.brandBlue} />
        </Pressable>
        <Tag text={product.available ? 'Disponible' : 'Agotado'} tone={product.available ? 'success' : 'warning'} />
      </View>

      <View style={styles.heroVisual}>
        <Ionicons name="bag-handle" size={72} color={colors.brandBlue} />
      </View>

      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.description}>{product.description}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
      </View>

      <View style={styles.infoPanel}>
        <InfoRow label="Categoria" value={product.category} />
        <InfoRow label="Vendedor" value={product.seller} />
        <InfoRow label="Inventario" value={`${product.stock} unidades`} />
      </View>

      <View style={styles.promiseRow}>
        <View style={styles.promisePill}>
          <Ionicons name="shield-checkmark" size={14} color={colors.brandBlue} />
          <Text style={styles.promiseText}>Compra protegida</Text>
        </View>
        <View style={styles.promisePill}>
          <Ionicons name="cube" size={14} color={colors.brandBlue} />
          <Text style={styles.promiseText}>Stock confirmado</Text>
        </View>
      </View>

      <Pressable
        disabled={!product.available}
        style={({ pressed }) => [
          styles.addCartButton,
          !product.available && styles.addCartButtonDisabled,
          pressed && styles.addCartButtonPressed,
        ]}
        onPress={onAddToCart}
      >
        <Ionicons name={isAuthenticated ? 'cart' : 'log-in-outline'} size={18} color={colors.surface} />
        <Text style={styles.addCartText}>{isAuthenticated ? 'Agregar a carrito' : 'Iniciar sesion para comprar'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
  },
  heroVisual: {
    height: 150,
    borderRadius: radii.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
  },
  description: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: colors.brandBlue,
    fontSize: 28,
    fontWeight: '900',
  },
  infoPanel: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.medium,
    padding: 14,
    gap: 10,
  },
  promiseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  promisePill: {
    flex: 1,
    minHeight: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.silverSoft,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
  },
  promiseText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
  },
  addCartButton: {
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addCartButtonDisabled: {
    backgroundColor: colors.inkSoft,
  },
  addCartButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  addCartText: {
    color: colors.surface,
    fontWeight: '900',
  },
});
