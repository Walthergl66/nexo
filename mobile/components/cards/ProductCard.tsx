import { Ionicons } from '@expo/vector-icons';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ProductVisual } from './ProductVisual';
import { PressableScale } from '../common/PressableScale';
import { useAddToCartFeedback } from '../../hooks/app/useAddToCartFeedback';
import { colors, radii, shadows } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';

type ProductCardProps = {
  product: Product;
  isAuthenticated: boolean;
  onAddToCart: () => void | Promise<boolean>;
  onSelectProduct: () => void;
};

export function ProductCard({ product, isAuthenticated, onAddToCart, onSelectProduct }: ProductCardProps) {
  const addLabel = isAuthenticated ? `Agregar ${product.title} al carrito` : `Iniciar sesion para comprar ${product.title}`;
  const { isAdded, progress, run } = useAddToCartFeedback(onAddToCart);

  const pop = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.09, 1], extrapolate: 'clamp' });
  const labelOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' });
  const successOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

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
        <PressableScale
          accessibilityLabel={addLabel}
          disabled={!product.available}
          style={[
            styles.addButton,
            !product.available && styles.addButtonDisabled,
            isAdded && styles.addButtonSuccess,
          ]}
          onPress={(event) => {
            event.stopPropagation();
            void run();
          }}
        >
          <Animated.Text style={[styles.addButtonText, { opacity: labelOpacity, transform: [{ scale: pop }] }]}>
            {isAuthenticated ? 'Comprar' : 'Entrar'}
          </Animated.Text>
          <Animated.View
            pointerEvents="none"
            style={[styles.addButtonSuccessLayer, { opacity: successOpacity, transform: [{ scale: pop }] }]}
          >
            <Ionicons name="checkmark" size={13} color={colors.surface} />
            <Text style={styles.addButtonSuccessText}>Listo</Text>
          </Animated.View>
        </PressableScale>
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
  addButtonSuccess: {
    backgroundColor: colors.brandAccent,
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '600',
  },
  addButtonSuccessLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  addButtonSuccessText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '700',
  },
});
