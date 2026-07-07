import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Tag } from '../common/Tag';
import { colors } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';
import { styles } from './sellStyles';

type SellerProductListProps = {
  products: Product[];
};

export function SellerProductList({ products }: SellerProductListProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <View style={styles.productList}>
      <View style={styles.productListHeader}>
        <Text style={styles.formTitle}>Tus productos</Text>
        <Tag text={`${products.length} items`} tone="default" />
      </View>
      {products.map((product) => (
        <View key={product.id} style={styles.productRow}>
          <View style={styles.productIcon}>
            <Ionicons name={product.available ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={colors.brandBlue} />
          </View>
          <View style={styles.productInfo}>
            <Text numberOfLines={1} style={styles.productName}>{product.title}</Text>
            <Text style={styles.productMeta}>{formatPrice(product.price)} / stock {product.stock}</Text>
          </View>
          <Tag text={product.available ? 'active' : 'draft'} tone={product.available ? 'success' : 'default'} />
        </View>
      ))}
    </View>
  );
}
