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
import { Skeleton } from '../../components/common/Skeleton';
import { ProductCard } from '../../components/cards/ProductCard';
import { ProductDetailCard } from '../../components/cards/ProductDetailCard';
import { HeroSection } from '../../components/home/HeroSection';
import { colors, radii, shadows } from '../../theme/colors';
import type { Product } from '../../types/marketplace';

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
  accessToken?: string | null;
  onAddToCart: (product: Product) => void | Promise<boolean>;
  onBackToCatalog: () => void;
  onChangeFilter: (filter: string) => void;
  onChangeSearch: (value: string) => void;
  onRefreshCatalog: () => void;
  onSelectProduct: (product: Product) => void;
  onStatusMessage?: (message: string, tone: import('../../types/status').StatusTone) => void;
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
  accessToken = null,
  onAddToCart,
  onBackToCatalog,
  onChangeFilter,
  onChangeSearch,
  onRefreshCatalog,
  onSelectProduct,
  onStatusMessage,
}: HomeScreenProps) {
  const isOwnProduct = (product: Product) =>
    Boolean(myProfileId) && product.ownerProfileId === myProfileId;

  if (selectedProduct) {
    return (
      <ProductDetailCard
        product={selectedProduct}
        isAuthenticated={isAuthenticated}
        isOwn={isOwnProduct(selectedProduct)}
        accessToken={accessToken}
        onAddToCart={() => onAddToCart(selectedProduct)}
        onBack={onBackToCatalog}
        onStatusMessage={onStatusMessage}
      />
    );
  }

  const availableProducts = filteredProducts.filter((product) => product.available).length;
  // Destacados en carrusel: 4 si hay catálogo amplio, 1 si es medio, ninguno si
  // hay muy pocos (para no dejar la parrilla "Recomendados" vacía).
  const featuredCount = filteredProducts.length >= 6 ? 4 : filteredProducts.length >= 3 ? 1 : 0;
  const featuredProducts = isLoading ? [] : filteredProducts.slice(0, featuredCount);
  const catalogProducts = filteredProducts.slice(featuredProducts.length);
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

      {!isLoading && featuredProducts.length > 0 && activeFilter === 'Todo' && (
        <View style={styles.heroWrap}>
          <HeroSection
            imageUrl={featuredProducts[0].imageUrl}
            title={featuredProducts[0].title}
            seller={featuredProducts[0].seller}
            price={featuredProducts[0].price}
            category={featuredProducts[0].category}
            onPress={() => onSelectProduct(featuredProducts[0])}
          />
        </View>
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
  heroWrap: {
    marginHorizontal: -20,
  },
});
