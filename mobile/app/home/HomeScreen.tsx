import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { RemoteImage } from '../../components/common/RemoteImage';
import { PressableScale } from '../../components/common/PressableScale';
import { Skeleton } from '../../components/common/Skeleton';
import { ProductCard } from '../../components/cards/ProductCard';
import { ProductDetailCard } from '../../components/cards/ProductDetailCard';
import { useAddToCartFeedback } from '../../hooks/app/useAddToCartFeedback';
import { colors, radii, shadows } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';

type HomeScreenProps = {
  activeFilter: string;
  filteredProducts: Product[];
  filters: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  lastSyncAt: Date | null;
  productsCount: number;
  search: string;
  selectedProduct: Product | null;
  myProfileId?: string | null;
  onAddToCart: (product: Product) => void | Promise<boolean>;
  onBackToCatalog: () => void;
  onChangeFilter: (filter: string) => void;
  onChangeSearch: (value: string) => void;
  onRefreshCatalog: () => void;
  onSelectProduct: (product: Product) => void;
};

function AnimatedProductCell({
  index,
  product,
  isAuthenticated,
  isOwn,
  onAddToCart,
  onSelectProduct,
}: {
  index: number;
  product: Product;
  isAuthenticated: boolean;
  isOwn: boolean;
  onAddToCart: () => void | Promise<boolean>;
  onSelectProduct: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(10);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 190,
        delay: index * 32,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 190,
        delay: index * 32,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, product.id, translateY]);

  return (
    <Animated.View style={[styles.productCell, { opacity, transform: [{ translateY }] }]}>
      <ProductCard
        product={product}
        isAuthenticated={isAuthenticated}
        isOwn={isOwn}
        onAddToCart={onAddToCart}
        onSelectProduct={onSelectProduct}
      />
    </Animated.View>
  );
}

function FeaturedBuyButton({ onBuy }: { onBuy: () => void | Promise<boolean> }) {
  const { isAdded, progress, run } = useAddToCartFeedback(onBuy);
  const pop = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.05, 1], extrapolate: 'clamp' });
  const labelOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' });
  const successOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <PressableScale
      style={[styles.featuredButton, isAdded && styles.featuredButtonSuccess]}
      onPress={(event) => {
        event.stopPropagation();
        void run();
      }}
    >
      <Animated.Text style={[styles.featuredButtonText, { opacity: labelOpacity, transform: [{ scale: pop }] }]}>
        Comprar ahora
      </Animated.Text>
      <Animated.View
        pointerEvents="none"
        style={[styles.featuredButtonSuccessLayer, { opacity: successOpacity, transform: [{ scale: pop }] }]}
      >
        <Ionicons name="checkmark-circle" size={15} color={colors.surface} />
        <Text style={styles.featuredButtonText}>Agregado</Text>
      </Animated.View>
    </PressableScale>
  );
}

// Fondos pastel suaves que rotan por tarjeta (estilo carrusel ecommerce). Usan
// tokens existentes: cada uno es una tinta clara sobre la que el texto oscuro
// contrasta bien, sin introducir colores nuevos a la paleta.
const FEATURED_BACKGROUNDS = [
  colors.brandBlueSoft,
  colors.success,
  colors.accentSoft,
  colors.warning,
];

function FeaturedCard({
  product,
  index,
  width,
  isOwn,
  onAddToCart,
  onSelectProduct,
}: {
  product: Product;
  index: number;
  width: number;
  isOwn: boolean;
  onAddToCart: () => void | Promise<boolean>;
  onSelectProduct: () => void;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const showRealImage = Boolean(product.imageUrl) && !hasImageError;
  const background = FEATURED_BACKGROUNDS[index % FEATURED_BACKGROUNDS.length];

  return (
    <PressableScale
      accessibilityLabel={`Ver detalle de ${product.title}`}
      activeScale={0.985}
      style={[styles.featuredCard, { width, backgroundColor: background }]}
      onPress={onSelectProduct}
    >
      <View style={styles.featuredCopy}>
        <Text style={styles.featuredCategory}>{product.category}</Text>
        <Text numberOfLines={2} style={styles.featuredTitle}>{product.title}</Text>
        <View style={styles.featuredSellerRow}>
          <Ionicons name="storefront-outline" size={12} color={colors.inkMuted} />
          <Text numberOfLines={1} style={styles.featuredSeller}>{product.seller}</Text>
        </View>
        <Text style={styles.featuredPrice}>{formatPrice(product.price)}</Text>
        {isOwn ? (
          <View style={styles.featuredOwnTag}>
            <Ionicons name="storefront" size={13} color={colors.ink} />
            <Text style={styles.featuredOwnTagText}>Tu producto</Text>
          </View>
        ) : (
          <FeaturedBuyButton onBuy={onAddToCart} />
        )}
      </View>
      <View style={styles.featuredImageWrap}>
        {showRealImage ? (
          <RemoteImage
            accessibilityLabel={`Imagen de ${product.title}`}
            uri={product.imageUrl as string}
            width={520}
            style={styles.featuredImage}
            onFinalError={() => setHasImageError(true)}
          />
        ) : (
          <View style={styles.featuredImageFallback}>
            <Ionicons name="bag-handle-outline" size={56} color={colors.inkSoft} />
          </View>
        )}
      </View>
    </PressableScale>
  );
}

function ProductSkeletonGrid() {
  return (
    <View style={styles.productGrid}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={[styles.productCell, styles.skeletonCard]}>
          <Skeleton style={styles.skeletonVisual} />
          <Skeleton style={styles.skeletonLineLarge} />
          <Skeleton style={styles.skeletonLineSmall} />
        </View>
      ))}
    </View>
  );
}

export function HomeScreen({
  activeFilter,
  filteredProducts,
  filters,
  isLoading,
  isAuthenticated,
  isRefreshing,
  lastSyncAt,
  productsCount,
  search,
  selectedProduct,
  myProfileId,
  onAddToCart,
  onBackToCatalog,
  onChangeFilter,
  onChangeSearch,
  onRefreshCatalog,
  onSelectProduct,
}: HomeScreenProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isOwnProduct = (product: Product) =>
    Boolean(myProfileId) && product.ownerProfileId === myProfileId;

  if (selectedProduct) {
    return (
      <ProductDetailCard
        product={selectedProduct}
        isAuthenticated={isAuthenticated}
        isOwn={isOwnProduct(selectedProduct)}
        onAddToCart={() => onAddToCart(selectedProduct)}
        onBack={onBackToCatalog}
      />
    );
  }

  const availableProducts = filteredProducts.filter((product) => product.available).length;
  // Destacados en carrusel: 4 si hay catálogo amplio, 1 si es medio, ninguno si
  // hay muy pocos (para no dejar la parrilla "Recomendados" vacía).
  const featuredCount = filteredProducts.length >= 6 ? 4 : filteredProducts.length >= 3 ? 1 : 0;
  const featuredProducts = isLoading ? [] : filteredProducts.slice(0, featuredCount);
  const catalogProducts = filteredProducts.slice(featuredProducts.length);
  // Ancho de tarjeta con un "peek" de la siguiente para invitar al swipe.
  const featuredCardWidth = Math.round(screenWidth - 72);
  const syncLabel = lastSyncAt
    ? `Actualizado ${lastSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Conectando';

  return (
    <>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.inkMuted} />
        <TextInput
          placeholder="Buscar productos o tiendas"
          placeholderTextColor={colors.inkSoft}
          style={styles.searchInput}
          value={search}
          onChangeText={onChangeSearch}
        />
        <Pressable
          accessibilityLabel="Actualizar catálogo"
          style={({ pressed }) => pressed && styles.pressFeedback}
          onPress={onRefreshCatalog}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={colors.inkMuted} />
          ) : (
            <Ionicons name="refresh-outline" size={18} color={colors.inkMuted} />
          )}
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filters.map((filter) => {
          const isActive = filter === activeFilter;
          return (
            <Pressable
              key={filter}
              style={({ pressed }) => [styles.filterChip, pressed && styles.pressFeedback]}
              onPress={() => onChangeFilter(filter)}
            >
              <View style={[styles.filterIcon, isActive && styles.filterIconActive]}>
                <Ionicons
                  name={filter === 'Todo' ? 'grid-outline' : 'pricetag-outline'}
                  size={18}
                  color={isActive ? colors.surface : colors.inkMuted}
                />
              </View>
              <Text numberOfLines={1} style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {featuredProducts.length > 0 && !isLoading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={featuredCardWidth + 12}
          snapToAlignment="start"
          contentContainerStyle={styles.featuredRow}
        >
          {featuredProducts.map((product, index) => (
            <FeaturedCard
              key={product.id}
              product={product}
              index={index}
              width={featuredCardWidth}
              isOwn={isOwnProduct(product)}
              onAddToCart={() => onAddToCart(product)}
              onSelectProduct={() => onSelectProduct(product)}
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.resultsHeader}>
        <View>
          <Text style={styles.resultsTitle}>{activeFilter === 'Todo' ? 'Recomendados para ti' : activeFilter}</Text>
          <Text style={styles.resultsSubtitle}>
            {isLoading ? 'Cargando catálogo' : `${productsCount || 0} productos · ${availableProducts} disponibles`}
          </Text>
        </View>
        <Text style={styles.syncLabel}>{syncLabel}</Text>
      </View>

      {isLoading ? (
        <ProductSkeletonGrid />
      ) : (
        <View style={styles.productGrid}>
          {catalogProducts.map((product, index) => (
            <AnimatedProductCell
              key={product.id}
              index={index}
              isAuthenticated={isAuthenticated}
              isOwn={isOwnProduct(product)}
              product={product}
              onAddToCart={() => onAddToCart(product)}
              onSelectProduct={() => onSelectProduct(product)}
            />
          ))}
        </View>
      )}

      {!isLoading && filteredProducts.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="search-outline" size={26} color={colors.brandBlue} />
          </View>
          <Text style={styles.emptyTitle}>No encontramos productos</Text>
          <Text style={styles.emptyText}>Prueba otra categoría o una búsqueda más corta.</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pressFeedback: {
    transform: [{ scale: 0.96 }],
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  filterRow: {
    gap: 16,
    paddingVertical: 2,
  },
  filterChip: {
    width: 64,
    alignItems: 'center',
    gap: 7,
  },
  filterIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconActive: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue,
  },
  filterChipText: {
    width: 64,
    textAlign: 'center',
    color: colors.inkMuted,
    fontWeight: '600',
    fontSize: 10,
  },
  filterChipTextActive: {
    color: colors.ink,
    fontWeight: '600',
  },
  featuredRow: {
    gap: 12,
    paddingVertical: 2,
    paddingRight: 4,
  },
  featuredCard: {
    height: 196,
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'stretch',
    ...shadows.card,
  },
  featuredCopy: {
    flex: 1,
    minWidth: 0,
    padding: 20,
    justifyContent: 'center',
  },
  featuredCategory: {
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  featuredTitle: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginTop: 8,
  },
  featuredSellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  featuredSeller: {
    flex: 1,
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  featuredPrice: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '700',
    marginTop: 8,
  },
  featuredButton: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 16,
  },
  featuredButtonSuccess: {
    backgroundColor: colors.brandBlue,
  },
  featuredOwnTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 16,
  },
  featuredOwnTagText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  featuredButtonSuccessLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  featuredButtonText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  featuredImageWrap: {
    width: 148,
    alignSelf: 'stretch',
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  featuredImageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultsTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  resultsSubtitle: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  syncLabel: {
    color: colors.inkSoft,
    fontSize: 9,
    fontWeight: '600',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  productCell: {
    width: '47.5%',
  },
  skeletonCard: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 10,
    ...shadows.card,
  },
  skeletonVisual: {
    height: 126,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
  },
  skeletonLineLarge: {
    width: '86%',
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSoft,
  },
  skeletonLineSmall: {
    width: '62%',
    height: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.silverSoft,
  },
  emptyState: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 9,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
    marginBottom: 4,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.inkMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
});
