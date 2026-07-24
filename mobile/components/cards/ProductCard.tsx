import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { ProductVisual } from './ProductVisual';
import { PressableScale } from '../common/PressableScale';
import { StarRating } from '../reviews/StarRating';
import { useAddToCartFeedback } from '../../hooks/app/useAddToCartFeedback';
import { colors, radii, shadows } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';

type ProductCardProps = {
  product: Product;
  isAuthenticated: boolean;
  isOwn?: boolean;
  onAddToCart: () => void | Promise<boolean>;
  onSelectProduct: () => void;
  onCartAdded?: () => void;
};

export function ProductCard({ product, isAuthenticated, isOwn = false, onAddToCart, onSelectProduct, onCartAdded }: ProductCardProps) {
  const { isAdded, isLoading, progress, run } = useAddToCartFeedback(onAddToCart, { onSuccess: onCartAdded });
  const isOutOfStock = !product.available || product.stock <= 0;
  const hasLowStock = !isOutOfStock && product.stock <= 3;
  const stockLabel = isOutOfStock ? 'Agotado' : hasLowStock ? `Últimas ${product.stock}` : `${product.stock} disponibles`;
  const addLabel = isOutOfStock
    ? `${product.title} está agotado`
    : isAuthenticated
      ? `Agregar ${product.title} al carrito`
      : `Iniciar sesión para comprar ${product.title}`;

  const pop = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.05, 1], extrapolate: 'clamp' });
  const labelOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' });
  const successOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <PressableScale
      accessibilityLabel={`Ver detalle de ${product.title}`}
      activeScale={0.98}
      style={styles.container}
      onPress={onSelectProduct}
    >
      <View style={styles.visualWrap}>
        <ProductVisual product={product} showFavorite imageWidth={500} />
        {(isOutOfStock || hasLowStock) && (
          <View style={[styles.stockBadge, isOutOfStock ? styles.stockBadgeEmpty : styles.stockBadgeLow]}>
            <Ionicons
              name={isOutOfStock ? 'close-circle-outline' : 'alert-circle-outline'}
              size={12}
              color={isOutOfStock ? colors.inkMuted : '#8A5800'}
            />
            <Text style={[styles.stockBadgeText, isOutOfStock && styles.stockBadgeTextEmpty]}>{stockLabel}</Text>
          </View>
        )}
      </View>

      <Text numberOfLines={2} style={styles.title}>
        {product.title}
      </Text>
      <View style={styles.sellerRow}>
        <Ionicons name="storefront-outline" size={11} color={colors.brandBlue} />
        <Text numberOfLines={1} style={styles.seller}>
          {product.seller}
        </Text>
      </View>
      {product.reviewCount > 0 && (
        <View style={styles.ratingRow}>
          <StarRating rating={product.averageRating} size={10} />
          <Text style={styles.ratingText}>{product.averageRating.toFixed(1)}</Text>
        </View>
      )}
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={[styles.priceHint, hasLowStock && styles.priceHintLow, isOutOfStock && styles.priceHintEmpty]}>
            {stockLabel}
          </Text>
        </View>
        {isOwn ? (
          <View style={styles.ownTag}>
            <Ionicons name="storefront" size={11} color={colors.brandBlue} />
            <Text style={styles.ownTagText}>Tu producto</Text>
          </View>
        ) : (
          <PressableScale
            accessibilityLabel={addLabel}
            disabled={isOutOfStock || isLoading}
            style={[
              styles.addButton,
              isOutOfStock && styles.addButtonDisabled,
              isAdded && styles.addButtonSuccess,
            ]}
            onPress={(event) => {
              event.stopPropagation();
              void run();
            }}
          >
            {isLoading ? (
              <ActivityIndicator size={12} color={colors.surface} />
            ) : (
              <>
                <Animated.Text style={[styles.addButtonText, { opacity: labelOpacity, transform: [{ scale: pop }] }]}>
                  {isOutOfStock ? 'Agotado' : isAuthenticated ? 'Comprar' : 'Entrar'}
                </Animated.Text>
                <Animated.View
                  pointerEvents="none"
                  style={[styles.addButtonSuccessLayer, { opacity: successOpacity, transform: [{ scale: pop }] }]}
                >
                  <Ionicons name="checkmark" size={13} color={colors.surface} />
                  <Text style={styles.addButtonSuccessText}>Listo</Text>
                </Animated.View>
              </>
            )}
          </PressableScale>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 12,
    overflow: 'hidden',
    ...shadows.card,
  },
  visualWrap: {
    position: 'relative',
  },
  stockBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    minHeight: 25,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  stockBadgeLow: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F1D391',
  },
  stockBadgeEmpty: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.lineStrong,
  },
  stockBadgeText: {
    color: '#8A5800',
    fontSize: 9,
    fontWeight: '800',
  },
  stockBadgeTextEmpty: {
    color: colors.inkMuted,
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.inkMuted,
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
  priceHintLow: {
    color: '#8A5800',
    fontWeight: '700',
  },
  priceHintEmpty: {
    color: colors.inkMuted,
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
  ownTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    backgroundColor: colors.brandBlueSoft,
    paddingHorizontal: 10,
  },
  ownTagText: {
    color: colors.brandBlue,
    fontSize: 9,
    fontWeight: '700',
  },
});
