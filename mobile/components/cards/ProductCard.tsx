import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProductVisual } from './ProductVisual';
import { colors, radii, shadows } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';

type ProductCardProps = {
  product: Product;
  isAuthenticated: boolean;
  onAddToCart: () => void;
  onSelectProduct: () => void;
};

export function ProductCard({ product, isAuthenticated, onAddToCart, onSelectProduct }: ProductCardProps) {
  const addLabel = isAuthenticated ? `Agregar ${product.title} al carrito` : `Iniciar sesion para comprar ${product.title}`;

  return (
    <Pressable
      accessibilityLabel={`Ver detalle de ${product.title}`}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      onPress={onSelectProduct}
    >
      <ProductVisual product={product} showFavorite imageWidth={500} />

      <Text numberOfLines={2} style={styles.title}>
        {product.title}
      </Text>
      <View style={styles.sellerRow}>
        <Ionicons name="storefront-outline" size={11} color={colors.brandBlue} />
        <Text numberOfLines={1} style={styles.seller}>
          {product.seller}
        </Text>
      </View>
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={styles.priceHint}>{product.stock} disponibles</Text>
        </View>
        <Pressable
          accessibilityLabel={addLabel}
          disabled={!product.available}
          style={({ pressed }) => [
            styles.addButton,
            !product.available && styles.addButtonDisabled,
            pressed && styles.addButtonPressed,
          ]}
          onPress={(event) => {
            event.stopPropagation();
            onAddToCart();
          }}
        >
          <Text style={styles.addButtonText}>{isAuthenticated ? 'Comprar' : 'Entrar'}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    overflow: 'hidden',
    ...shadows.card,
  },
  containerPressed: {
    transform: [{ scale: 0.97 }],
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    minHeight: 31,
    lineHeight: 17,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  seller: {
    flex: 1,
    fontSize: 10,
    color: colors.brandBlue,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  priceHint: {
    color: colors.inkSoft,
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  addButton: {
    minWidth: 64,
    height: 30,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    paddingHorizontal: 10,
  },
  addButtonDisabled: {
    backgroundColor: colors.inkSoft,
    shadowOpacity: 0,
  },
  addButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '600',
  },
});
