import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { RemoteImage } from '../common/RemoteImage';
import { PressableScale } from '../common/PressableScale';
import { ReviewsSection } from '../reviews/ReviewsSection';
import { StarRating } from '../reviews/StarRating';
import { useAddToCartFeedback } from '../../hooks/app/useAddToCartFeedback';
import { useFavorites } from '../../context/FavoritesContext';
import { colors, radii, shadows, spacing } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import type { StatusTone } from '../../types/status';
import { formatPrice } from '../../utils/format';

type ProductDetailCardProps = {
  product: Product;
  isAuthenticated: boolean;
  isOwn?: boolean;
  accessToken: string | null;
  onAddToCart: () => void | Promise<boolean>;
  onBack: () => void;
  onStatusMessage?: (message: string, tone: StatusTone) => void;
  onCartAdded?: () => void;
};

export function ProductDetailCard({
  product,
  isAuthenticated,
  isOwn = false,
  accessToken,
  onAddToCart,
  onBack,
  onStatusMessage,
  onCartAdded,
}: ProductDetailCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const showRealImage = Boolean(product.imageUrl) && !hasImageError;
  const isOutOfStock = !product.available || product.stock <= 0;
  const hasLowStock = !isOutOfStock && product.stock <= 3;
  const stockLabel = isOutOfStock ? 'Agotado' : product.stock === 1 ? 'Última unidad' : hasLowStock ? `Últimas ${product.stock}` : `${product.stock} disponibles`;
  const { isAdded, isLoading, progress, run } = useAddToCartFeedback(onAddToCart, { onSuccess: onCartAdded });
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(product.id);

  const pop = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.05, 1], extrapolate: 'clamp' });
  const labelOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' });
  const successOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const bodyFade = useRef(new Animated.Value(0)).current;
  const bodySlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(bodyFade, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bodySlide, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim, bodyFade, bodySlide]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {showRealImage ? (
          <RemoteImage
            accessibilityLabel={`Imagen de ${product.title}`}
            uri={product.imageUrl as string}
            width={900}
            style={styles.heroImage}
            onFinalError={() => setHasImageError(true)}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={52} color={colors.inkMuted} />
            <Text style={styles.imageFallbackText}>Imagen no disponible</Text>
          </View>
        )}

        <Pressable
          accessibilityLabel="Volver al catalogo"
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={onBack}
        >
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
        </Pressable>

        <Pressable
          accessibilityLabel={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          style={({ pressed }) => [styles.favButton, pressed && styles.favButtonPressed]}
          onPress={() => toggleFavorite(product.id)}
        >
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? colors.brandAccent : colors.ink} />
        </Pressable>

        <View style={[styles.statusPill, isOutOfStock && styles.statusPillOff]}>
          <View style={[styles.statusDot, isOutOfStock && styles.statusDotOff]} />
          <Text style={[styles.statusText, isOutOfStock && styles.statusTextOff]}>
            {isOutOfStock ? 'Agotado' : hasLowStock ? 'Pocas unidades' : 'Disponible'}
          </Text>
        </View>

        {product.category && (
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
        )}

        <View style={styles.heroOverlay}>
          <Text numberOfLines={2} style={styles.heroTitle}>{product.title}</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.sellerChip}>
              <Ionicons name="storefront-outline" size={11} color="rgba(255,255,255,0.8)" />
              <Text numberOfLines={1} style={styles.sellerChipText}>{product.seller}</Text>
            </View>
            {product.reviewCount > 0 && (
              <View style={styles.ratingChip}>
                <Ionicons name="star" size={10} color={colors.popYellow} />
                <Text style={styles.ratingChipText}>{product.averageRating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.priceTag}>
          <Text style={styles.priceTagText}>{formatPrice(product.price)}</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.body, { opacity: bodyFade, transform: [{ translateY: bodySlide }] }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCopy}>
            <View style={styles.sellerRow}>
              <Ionicons name="storefront-outline" size={13} color={colors.brandBlue} />
              <Text numberOfLines={1} style={styles.seller}>{product.seller}</Text>
            </View>
            {product.reviewCount > 0 && (
              <View style={styles.ratingRow}>
                <StarRating rating={product.averageRating} size={12} />
                <Text style={styles.ratingText}>
                  {product.averageRating.toFixed(1)} ({product.reviewCount})
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={[styles.infoItem, hasLowStock && styles.infoItemWarning]}>
            <Ionicons name="cube-outline" size={16} color={colors.brandBlue} />
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>Inventario</Text>
              <Text style={styles.infoValue}>{stockLabel}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.brandBlue} />
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>Envio</Text>
              <Text numberOfLines={1} style={styles.infoValue}>Gratis y protegido</Text>
            </View>
          </View>
        </View>

        {isOwn ? (
          <View style={styles.ownBanner}>
            <Ionicons name="storefront-outline" size={18} color={colors.brandBlue} />
            <Text style={styles.ownBannerText}>Este es tu producto. Gestiona sus ventas desde la pestaña Vender.</Text>
          </View>
        ) : (
          <View style={styles.bottomActions}>
            <View style={styles.protection}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.ink} />
              <Text style={styles.protectionText}>Compra protegida</Text>
            </View>
            <PressableScale
              accessibilityLabel={
                isOutOfStock
                  ? `${product.title} está agotado`
                  : isAuthenticated
                    ? `Agregar ${product.title} al carrito por ${formatPrice(product.price)}`
                    : 'Iniciar sesión para comprar'
              }
              disabled={isOutOfStock || isLoading}
              style={[
                styles.addCartButton,
                isOutOfStock && styles.addCartButtonDisabled,
                isAdded && styles.addCartButtonSuccess,
              ]}
              onPress={() => void run()}
            >
              {isLoading ? (
                <ActivityIndicator size={18} color={colors.surface} />
              ) : (
                <>
                  <Animated.View style={[styles.addCartInner, { opacity: labelOpacity, transform: [{ scale: pop }] }]}>
                    <Ionicons
                      name={isOutOfStock ? 'close-circle-outline' : isAuthenticated ? 'bag-add-outline' : 'log-in-outline'}
                      size={18}
                      color={colors.surface}
                    />
                    <Text style={styles.addCartText}>
                      {isOutOfStock
                        ? 'Agotado'
                        : isAuthenticated
                          ? `Agregar · ${formatPrice(product.price)}`
                          : 'Iniciar sesión'}
                    </Text>
                  </Animated.View>
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.addCartInner, styles.addCartSuccessLayer, { opacity: successOpacity, transform: [{ scale: pop }] }]}
                  >
                    <Ionicons name="checkmark-circle" size={19} color={colors.surface} />
                    <Text style={styles.addCartText}>Agregado</Text>
                  </Animated.View>
                </>
              )}
            </PressableScale>
          </View>
        )}

        <View style={styles.descriptionBlock}>
          <Text style={styles.sectionTitle}>Descripcion</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        <View style={styles.reviewsBlock}>
          <ReviewsSection
            productSlug={product.slug}
            averageRating={product.averageRating}
            reviewCount={product.reviewCount}
            isAuthenticated={isAuthenticated}
            isOwn={isOwn}
            accessToken={accessToken}
            onStatusMessage={onStatusMessage}
          />
        </View>

      </Animated.View>
    </View>
  );
}

const HERO_HEIGHT = 340;
const CLIP_BOTTOM_RADIUS = 56;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...shadows.card,
  },

  heroSection: {
    height: HERO_HEIGHT,
    backgroundColor: colors.surfaceMuted,
    borderBottomRightRadius: CLIP_BOTTOM_RADIUS,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderBottomRightRadius: CLIP_BOTTOM_RADIUS,
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageFallbackText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },

  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  favButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg + 50,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  favButtonPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  statusPill: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(6, 79, 158, 0.78)',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  statusPillOff: {
    backgroundColor: 'rgba(147, 163, 178, 0.78)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#57D6C7',
  },
  statusDotOff: {
    backgroundColor: colors.inkSoft,
  },
  statusText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusTextOff: {
    color: 'rgba(255,255,255,0.7)',
  },

  categoryTag: {
    position: 'absolute',
    top: spacing.lg + 50,
    left: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingBottom: 20,
    gap: 8,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sellerChipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '600',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingChipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '700',
  },

  priceTag: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  priceTagText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  body: {
    padding: 20,
    gap: 18,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  seller: {
    flex: 1,
    color: colors.brandBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  price: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoItem: {
    flex: 1,
    minWidth: 138,
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoItemWarning: {
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F1D391',
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  infoValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  descriptionBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 14,
    gap: 8,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  reviewsBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  ratingText: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
  },
  protection: {
    flex: 0.8,
    minHeight: 48,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
  },
  protectionText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '700',
  },
  addCartButton: {
    flex: 1.2,
    minHeight: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 14,
  },
  addCartButtonDisabled: {
    backgroundColor: colors.inkSoft,
  },
  addCartButtonSuccess: {
    backgroundColor: colors.brandAccent,
  },
  addCartInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  addCartSuccessLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  addCartText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  ownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    backgroundColor: colors.brandBlueSoft,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  ownBannerText: {
    flex: 1,
    color: colors.brandBlue,
    fontSize: 11,
    fontWeight: '700',
  },
});
