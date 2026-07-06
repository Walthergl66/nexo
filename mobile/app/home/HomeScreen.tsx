import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ProductCard } from '../../components/cards/ProductCard';
import { ProductDetailCard } from '../../components/cards/ProductDetailCard';
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
  onAddToCart: (product: Product) => void;
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
  onAddToCart,
  onSelectProduct,
}: {
  index: number;
  product: Product;
  isAuthenticated: boolean;
  onAddToCart: () => void;
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
        onAddToCart={onAddToCart}
        onSelectProduct={onSelectProduct}
      />
    </Animated.View>
  );
}

function ProductSkeletonGrid() {
  return (
    <View style={styles.productGrid}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={[styles.productCell, styles.skeletonCard]}>
          <View style={styles.skeletonVisual} />
          <View style={styles.skeletonLineLarge} />
          <View style={styles.skeletonLineSmall} />
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
  onAddToCart,
  onBackToCatalog,
  onChangeFilter,
  onChangeSearch,
  onRefreshCatalog,
  onSelectProduct,
}: HomeScreenProps) {
  if (selectedProduct) {
    return (
      <ProductDetailCard
        product={selectedProduct}
        isAuthenticated={isAuthenticated}
        onAddToCart={() => onAddToCart(selectedProduct)}
        onBack={onBackToCatalog}
      />
    );
  }

  const availableProducts = filteredProducts.filter((product) => product.available).length;
  const featuredProduct = filteredProducts[0] ?? null;
  const catalogProducts = featuredProduct ? filteredProducts.slice(1) : filteredProducts;
  const syncLabel = lastSyncAt
    ? `Actualizado ${lastSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Conectando';

  return (
    <>
      <View style={styles.introRow}>
        <View style={styles.introOrbLarge} />
        <View style={styles.introOrbSmall} />
        <View style={styles.introCopy}>
          <Text style={styles.introEyebrow}>NEXO MARKET</Text>
          <Text style={styles.introTitle}>Encuentra algo único.</Text>
          <View style={styles.trustPill}>
            <View style={styles.trustDot} />
            <Text style={styles.trustText}>Marketplace verificado</Text>
          </View>
        </View>
        <Pressable
          accessibilityLabel="Actualizar catálogo"
          style={({ pressed }) => [styles.refreshButton, pressed && styles.pressFeedback]}
          onPress={onRefreshCatalog}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={colors.ink} />
          ) : (
            <Ionicons name="refresh-outline" size={18} color={colors.ink} />
          )}
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.inkMuted} />
        <TextInput
          placeholder="Buscar productos o tiendas"
          placeholderTextColor={colors.inkSoft}
          style={styles.searchInput}
          value={search}
          onChangeText={onChangeSearch}
        />
        <Ionicons name="options-outline" size={18} color={colors.inkMuted} />
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

      {featuredProduct && !isLoading && (
        <Pressable
          accessibilityLabel={`Ver detalle de ${featuredProduct.title}`}
          style={({ pressed }) => [styles.featuredCard, pressed && styles.featuredCardPressed]}
          onPress={() => onSelectProduct(featuredProduct)}
        >
          <View style={styles.featuredOrbitLarge} />
          <View style={styles.featuredOrbitSmall} />
          <View style={styles.featuredSpark} />
          <View style={styles.featuredCopy}>
            <Text style={styles.featuredCategory}>{featuredProduct.category}</Text>
            <Text numberOfLines={3} style={styles.featuredTitle}>{featuredProduct.title}</Text>
            <Text style={styles.featuredPrice}>{formatPrice(featuredProduct.price)}</Text>
            <Pressable
              style={({ pressed }) => [styles.featuredButton, pressed && styles.pressFeedback]}
              onPress={(event) => {
                event.stopPropagation();
                onAddToCart(featuredProduct);
              }}
            >
              <Text style={styles.featuredButtonText}>Comprar ahora</Text>
            </Pressable>
          </View>
          <View style={styles.featuredVisual}>
            <View style={styles.featuredHalo} />
            <Ionicons name="bag-handle-outline" size={88} color={colors.surface} />
          </View>
        </Pressable>
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
              product={product}
              onAddToCart={() => onAddToCart(product)}
              onSelectProduct={() => onSelectProduct(product)}
            />
          ))}
        </View>
      )}

      {!isLoading && filteredProducts.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={24} color={colors.inkMuted} />
          <Text style={styles.emptyTitle}>No encontramos productos</Text>
          <Text style={styles.emptyText}>Prueba otra categoría o una búsqueda más corta.</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 132,
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    overflow: 'hidden',
    ...shadows.card,
  },
  introCopy: {
    flex: 1,
    zIndex: 2,
  },
  introOrbLarge: {
    position: 'absolute',
    width: 152,
    height: 152,
    borderRadius: 76,
    right: -74,
    top: -70,
    backgroundColor: colors.brandBlueSoft,
  },
  introOrbSmall: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    right: -18,
    bottom: -42,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
  },
  introEyebrow: {
    color: colors.brandAccent,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  introTitle: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -1.1,
    marginTop: 4,
  },
  trustPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlueSoft,
  },
  trustDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandAccent,
  },
  trustText: {
    color: colors.brandBlue,
    fontSize: 9,
    fontWeight: '700',
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    zIndex: 2,
  },
  pressFeedback: {
    transform: [{ scale: 0.96 }],
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    ...shadows.card,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: colors.ink,
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
    backgroundColor: colors.surface,
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
  featuredCard: {
    minHeight: 214,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    padding: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.floating,
  },
  featuredOrbitLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -92,
    top: -80,
    borderWidth: 1,
    borderColor: colors.brandBlueMuted,
    opacity: 0.42,
  },
  featuredOrbitSmall: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    right: -32,
    bottom: -70,
    borderWidth: 1,
    borderColor: colors.accent,
    opacity: 0.32,
  },
  featuredSpark: {
    position: 'absolute',
    width: 46,
    height: 5,
    borderRadius: 3,
    right: 32,
    top: 28,
    backgroundColor: colors.brandAccent,
    opacity: 0.65,
    transform: [{ rotate: '-42deg' }],
  },
  featuredCardPressed: {
    transform: [{ scale: 0.985 }],
  },
  featuredCopy: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'center',
  },
  featuredCategory: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuredTitle: {
    color: colors.surface,
    fontSize: 24,
    lineHeight: 27,
    fontWeight: '600',
    letterSpacing: -0.8,
    marginTop: 8,
    maxWidth: 190,
  },
  featuredPrice: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  featuredButton: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 18,
  },
  featuredButtonText: {
    color: colors.brandBlue,
    fontSize: 11,
    fontWeight: '600',
  },
  featuredVisual: {
    width: 122,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredHalo: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: colors.brandBlue,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultsTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  resultsSubtitle: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  syncLabel: {
    color: colors.inkSoft,
    fontSize: 9,
    fontWeight: '600',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCell: {
    width: '48%',
  },
  skeletonCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 10,
    gap: 10,
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
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 7,
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
