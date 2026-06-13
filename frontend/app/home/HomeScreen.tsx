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
import { filters } from '../../constants/navigation';
import { colors, radii } from '../../theme/colors';
import type { Product, ProductComment } from '../../types/marketplace';

type HomeScreenProps = {
  activeFilter: string;
  commentText: string;
  filteredProducts: Product[];
  isLoading: boolean;
  isRefreshing: boolean;
  lastSyncAt: Date | null;
  productsCount: number;
  productComments: ProductComment[];
  search: string;
  selectedProduct: Product | null;
  selectedRating: number;
  onAddToCart: (product: Product) => void;
  onBackToCatalog: () => void;
  onChangeCommentText: (value: string) => void;
  onChangeFilter: (filter: string) => void;
  onChangeRating: (rating: number) => void;
  onChangeSearch: (value: string) => void;
  onRefreshCatalog: () => void;
  onSelectProduct: (product: Product) => void;
  onSubmitComment: () => void;
};

type AnimatedProductCellProps = {
  index: number;
  product: Product;
  onAddToCart: () => void;
  onSelectProduct: () => void;
};

function AnimatedProductCell({ index, product, onAddToCart, onSelectProduct }: AnimatedProductCellProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(12);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        delay: index * 35,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        delay: index * 35,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY, product.id]);

  return (
    <Animated.View style={[styles.productCell, { opacity, transform: [{ translateY }] }]}>
      <ProductCard product={product} onAddToCart={onAddToCart} onSelectProduct={onSelectProduct} />
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
          <View style={styles.skeletonBottomRow}>
            <View style={styles.skeletonPrice} />
            <View style={styles.skeletonButton} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function HomeScreen({
  activeFilter,
  commentText,
  filteredProducts,
  isLoading,
  isRefreshing,
  lastSyncAt,
  productsCount,
  productComments,
  search,
  selectedProduct,
  selectedRating,
  onAddToCart,
  onBackToCatalog,
  onChangeCommentText,
  onChangeFilter,
  onChangeRating,
  onChangeSearch,
  onRefreshCatalog,
  onSelectProduct,
  onSubmitComment,
}: HomeScreenProps) {
  if (selectedProduct) {
    return (
      <ProductDetailCard
        product={selectedProduct}
        comments={productComments}
        selectedRating={selectedRating}
        commentText={commentText}
        onAddToCart={() => onAddToCart(selectedProduct)}
        onBack={onBackToCatalog}
        onChangeCommentText={onChangeCommentText}
        onChangeRating={onChangeRating}
        onSubmitComment={onSubmitComment}
      />
    );
  }

  const availableProducts = filteredProducts.filter((product) => product.available).length;
  const bestRating = filteredProducts.length > 0 ? Math.max(...filteredProducts.map((product) => product.rating)) : 0;
  const syncLabel = lastSyncAt
    ? `Sync ${lastSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Conectando';

  return (
    <>
      <View style={styles.marketHero}>
        <View style={styles.heroHeader}>
          <View style={styles.heroBrandMark}>
            <Ionicons name="storefront" size={18} color={colors.brandBlue} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Marketplace NEXO</Text>
            <Text style={styles.heroTitle}>Catalogo conectado</Text>
          </View>
          <View style={styles.heroMetric}>
            {isRefreshing ? (
              <ActivityIndicator size="small" color={colors.brandBlue} />
            ) : (
              <Ionicons name="cloud-done" size={14} color={colors.brandBlue} />
            )}
            <Text style={styles.heroMetricText}>{syncLabel}</Text>
          </View>
        </View>

        <View style={styles.trustRow}>
          <View style={styles.trustPill}>
            <Text style={styles.trustValue}>{productsCount || '...'}</Text>
            <Text style={styles.trustText}>productos</Text>
          </View>
          <View style={styles.trustPill}>
            <Text style={styles.trustValue}>{availableProducts}</Text>
            <Text style={styles.trustText}>disponibles</Text>
          </View>
          <View style={styles.trustPill}>
            <Text style={styles.trustValue}>{bestRating.toFixed(1)}</Text>
            <Text style={styles.trustText}>rating top</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.brandBlue} />
        <TextInput
          placeholder="Buscar producto, vendedor o categoria"
          placeholderTextColor={colors.inkSoft}
          style={styles.searchInput}
          value={search}
          onChangeText={onChangeSearch}
        />
        <Pressable
          accessibilityLabel="Actualizar catalogo"
          style={({ pressed }) => [styles.syncButton, pressed && styles.syncButtonPressed]}
          onPress={onRefreshCatalog}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={colors.brandBlue} />
          ) : (
            <Ionicons name="sync" size={17} color={colors.brandBlue} />
          )}
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {filters.map((filter) => {
          const isActive = filter === activeFilter;
          return (
            <Pressable
              key={filter}
              style={({ pressed }) => [
                styles.filterChip,
                isActive && styles.filterChipActive,
                pressed && styles.filterChipPressed,
              ]}
              onPress={() => onChangeFilter(filter)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{filter}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.resultsHeader}>
        <View>
          <Text style={styles.resultsTitle}>{activeFilter === 'Todo' ? 'Productos destacados' : activeFilter}</Text>
          <Text style={styles.resultsSubtitle}>
            {isLoading
              ? 'Consultando catalogo remoto'
              : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'resultado' : 'resultados'} disponibles`}
          </Text>
        </View>
        
      </View>

      {isLoading ? (
        <ProductSkeletonGrid />
      ) : (
        <View style={styles.productGrid}>
          {filteredProducts.map((product, index) => (
            <AnimatedProductCell
              key={product.id}
              index={index}
              product={product}
              onAddToCart={() => onAddToCart(product)}
              onSelectProduct={() => onSelectProduct(product)}
            />
          ))}
        </View>
      )}

      {!isLoading && filteredProducts.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No encontramos productos</Text>
          <Text style={styles.emptyText}>Prueba con otra categoria o una busqueda mas corta.</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  marketHero: {
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroBrandMark: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  heroEyebrow: {
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  heroMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroMetricText: {
    color: colors.brandBlue,
    fontSize: 10,
    fontWeight: '900',
  },
  trustRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trustPill: {
    flex: 1,
    minHeight: 50,
    borderRadius: radii.small,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  trustValue: {
    color: colors.brandBlue,
    fontSize: 16,
    fontWeight: '900',
  },
  trustText: {
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: colors.ink,
    fontWeight: '700',
  },
  syncButton: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  filterRow: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.silverSoft,
    borderWidth: 1,
    borderColor: colors.line,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue,
  },
  filterChipPressed: {
    transform: [{ scale: 0.97 }],
  },
  filterChipText: {
    color: colors.inkMuted,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultsTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  resultsSubtitle: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  resultsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlueSoft,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  resultsBadgeText: {
    color: colors.brandBlue,
    fontSize: 11,
    fontWeight: '900',
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
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 11,
    gap: 9,
  },
  skeletonVisual: {
    height: 104,
    borderRadius: radii.small,
    backgroundColor: colors.surfaceSoft,
  },
  skeletonLineLarge: {
    width: '86%',
    height: 13,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSoft,
  },
  skeletonLineSmall: {
    width: '62%',
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.silverSoft,
  },
  skeletonBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonPrice: {
    width: 58,
    height: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSoft,
  },
  skeletonButton: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlueSoft,
  },
  emptyState: {
    borderRadius: radii.medium,
    padding: 18,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 6,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.inkMuted,
    lineHeight: 20,
  },
});
