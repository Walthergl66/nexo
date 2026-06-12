import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ProductCard } from '../../components/cards/ProductCard';
import { ProductDetailCard } from '../../components/cards/ProductDetailCard';
import { filters } from '../../constants/navigation';
import { colors, radii } from '../../theme/colors';
import type { Product, ProductComment } from '../../types/marketplace';

type HomeScreenProps = {
  activeFilter: string;
  commentText: string;
  filteredProducts: Product[];
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

export function HomeScreen({
  activeFilter,
  commentText,
  filteredProducts,
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

  return (
    <>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.brandBlue} />
        <TextInput
          placeholder="Buscar producto, vendedor o categoria"
          placeholderTextColor={colors.inkSoft}
          style={styles.searchInput}
          value={search}
          onChangeText={onChangeSearch}
        />
        <Ionicons name="options" size={18} color={colors.inkMuted} />
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
          <Text style={styles.resultsTitle}>Productos destacados</Text>
          <Text style={styles.resultsSubtitle}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'} disponibles
          </Text>
        </View>
        <View style={styles.resultsBadge}>
          <Ionicons name="star" size={13} color={colors.brandBlue} />
          <Text style={styles.resultsBadgeText}>Mejor valor</Text>
        </View>
      </View>

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

      {filteredProducts.length === 0 && (
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
    borderRadius: radii.large,
    backgroundColor: colors.brandBlue,
    padding: 18,
    gap: 16,
    overflow: 'hidden',
  },
  heroCopy: {
    gap: 6,
  },
  heroEyebrow: {
    color: colors.silver,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 30,
  },
  heroSubtitle: {
    color: colors.brandBlueLine,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    maxWidth: 310,
  },
  heroMetric: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  heroMetricText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
  },
  trustRow: {
    flexDirection: 'row',
    gap: 10,
  },
  trustPill: {
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
  trustText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
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
