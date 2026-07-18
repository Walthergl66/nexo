import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SellerProductCard } from '../cards/SellerProductCard';
import { Tag } from '../common/Tag';
import { colors } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import { styles as sellStyles } from './sellStyles';

type SellerProductListProps = {
  products: Product[];
  isLoading?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
};

export function SellerProductList({ products, isLoading = false, onEdit, onDelete }: SellerProductListProps) {
  if (products.length === 0) {
    if (isLoading) {
      return (
        <View style={sellStyles.productList}>
          <View style={sellStyles.productLoadingRow}>
            <ActivityIndicator color={colors.brandBlue} />
            <Text style={sellStyles.productMeta}>Cargando tus productos…</Text>
          </View>
        </View>
      );
    }

    return null;
  }

  return (
    <View style={sellStyles.productList}>
      <View style={sellStyles.productListHeader}>
        <Text style={sellStyles.formTitle}>Tus productos</Text>
        <Tag text={`${products.length} items`} tone="default" />
      </View>
      <View style={styles.grid}>
        {products.map((product) => (
          <View key={product.id} style={styles.cell}>
            <SellerProductCard
              product={product}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    width: '48%',
  },
});
