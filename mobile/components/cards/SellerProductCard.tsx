import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProductVisual } from './ProductVisual';
import { colors, radii, shadows } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';

type SellerProductCardProps = {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
};

export function SellerProductCard({ product, onEdit, onDelete }: SellerProductCardProps) {
  return (
    <View style={styles.container}>
      <ProductVisual product={product} imageWidth={500} />

      <Text numberOfLines={1} style={styles.category}>
        {product.category}
      </Text>
      <Text numberOfLines={2} style={styles.title}>
        {product.title}
      </Text>

      <View style={styles.bottomRow}>
        <View style={styles.priceBlock}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={styles.stockHint}>{product.stock} en stock</Text>
        </View>
        <View style={[styles.statusPill, product.available ? styles.statusActive : styles.statusDraft]}>
          <Text style={[styles.statusText, product.available ? styles.statusTextActive : styles.statusTextDraft]}>
            {product.available ? 'Activo' : 'Borrador'}
          </Text>
        </View>
      </View>

      {(onEdit || onDelete) && (
        <View style={styles.actionRow}>
          {onEdit && (
            <Pressable
              accessibilityLabel="Editar producto"
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionBtn, styles.editBtn, pressed && styles.btnPressed]}
              onPress={() => onEdit(product)}
            >
              <Ionicons name="pencil-outline" size={13} color={colors.brandBlue} />
              <Text style={styles.editBtnText}>Editar</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              accessibilityLabel="Eliminar producto"
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && styles.btnPressed]}
              onPress={() => onDelete(product)}
            >
              <Ionicons name="trash-outline" size={13} color={colors.popCoral} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    overflow: 'hidden',
    gap: 0,
    ...shadows.card,
  },
  category: {
    color: colors.brandAccent,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    minHeight: 31,
    lineHeight: 17,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  priceBlock: {
    flex: 1,
    minWidth: 0,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  stockHint: {
    color: colors.inkSoft,
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  statusPill: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: colors.brandBlueSoft,
    borderColor: colors.brandBlueLine,
  },
  statusDraft: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.line,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusTextActive: {
    color: colors.brandBlue,
  },
  statusTextDraft: {
    color: colors.inkMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  actionBtn: {
    height: 30,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  editBtn: {
    flex: 1,
    backgroundColor: colors.brandBlueSoft,
    borderColor: colors.brandBlueLine,
  },
  deleteBtn: {
    width: 30,
    paddingHorizontal: 0,
    backgroundColor: '#FF6B6B11',
    borderColor: '#FF6B6B44',
  },
  editBtnText: {
    color: colors.brandBlue,
    fontSize: 11,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
