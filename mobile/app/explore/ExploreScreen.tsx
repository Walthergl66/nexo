import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ProductCard } from '../../components/cards/ProductCard';
import { colors, radii } from '../../theme/colors';
import type { Product } from '../../types/marketplace';

type ExploreScreenProps = {
  activeFilter: string;
  filters: string[];
  filteredProducts: Product[];
  isAuthenticated?: boolean;
  search: string;
  onAddToCart: (product: Product) => void;
  onChangeFilter: (filter: string) => void;
  onChangeSearch: (value: string) => void;
  onSelectProduct?: (product: Product) => void;
};

export function ExploreScreen({
  activeFilter,
  filters,
  filteredProducts,
  isAuthenticated = false,
  search,
  onAddToCart,
  onChangeFilter,
  onChangeSearch,
  onSelectProduct = () => undefined,
}: ExploreScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Volver" style={styles.iconButton}>
          <Ionicons name="chevron-back" size={19} color="#161616" />
        </Pressable>
        <Text style={styles.headerTitle}>Buscar producto</Text>
        <Image source={require('../../assets/icon.png')} style={styles.avatar} />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={14} color="#a4a8ae" />
          <TextInput
            placeholder="Buscar productos"
            placeholderTextColor="#9fa4aa"
            style={styles.searchInput}
            value={search}
            onChangeText={onChangeSearch}
          />
        </View>
        <Pressable accessibilityLabel="Filtros" style={styles.filterButton}>
          <Ionicons name="options" size={18} color="#151515" />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {filters.map((filter) => {
          const isActive = filter === activeFilter;
          return (
            <Pressable
              key={filter}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => onChangeFilter(filter)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{filter}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.resultTitle}>
        Encontramos{'\n'}
        {filteredProducts.length} resultados
      </Text>

      <View style={styles.productGrid}>
        {filteredProducts.map((product) => (
          <View key={product.id} style={styles.productColumn}>
            <ProductCard
              product={product}
              isAuthenticated={isAuthenticated}
              onAddToCart={() => onAddToCart(product)}
              onSelectProduct={() => onSelectProduct(product)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f1f1f1',
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#161616',
    fontSize: 12,
    fontWeight: '800',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: '#171717',
    fontSize: 12,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexGrow: 0,
    marginTop: 12,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#111111',
  },
  filterChipText: {
    color: '#717171',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  resultTitle: {
    color: '#171717',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 10,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-start',
  },
  productColumn: {
    width: '48%',
  },
});
