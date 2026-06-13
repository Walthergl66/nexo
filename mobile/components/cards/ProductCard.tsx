import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';

type ProductCardProps = {
  product: Product;
  onAddToCart: () => void;
  onSelectProduct: () => void;
};

type BottlePalette = {
  bottle: string;
  cap: string;
  label: string;
  labelText: string;
  leaf: string;
  leafAlt: string;
};

const palettes: Record<Product['visualTone'], BottlePalette> = {
  dark: {
    bottle: colors.brandBlue,
    cap: '#08285d',
    label: colors.surface,
    labelText: colors.brandBlue,
    leaf: colors.silver,
    leafAlt: colors.brandBlueMuted,
  },
  cool: {
    bottle: colors.primarySoft,
    cap: colors.brandBlue,
    label: colors.silverSoft,
    labelText: colors.brandBlue,
    leaf: colors.silver,
    leafAlt: colors.brandBlueMuted,
  },
  light: {
    bottle: colors.silverSoft,
    cap: colors.brandBlue,
    label: colors.surface,
    labelText: colors.brandBlue,
    leaf: colors.silver,
    leafAlt: colors.brandBlueLine,
  },
  warm: {
    bottle: colors.silver,
    cap: colors.brandBlue,
    label: colors.surface,
    labelText: colors.brandBlue,
    leaf: colors.brandBlueMuted,
    leafAlt: colors.silverSoft,
  },
};

export function ProductCard({ product, onAddToCart, onSelectProduct }: ProductCardProps) {
  const palette = palettes[product.visualTone];

  return (
    <Pressable
      accessibilityLabel={`Ver detalle de ${product.title}`}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      onPress={onSelectProduct}
    >
      <View style={styles.visual}>
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={10} color={colors.brandBlue} />
          <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
        </View>
        <View style={[styles.leaf, styles.leafLeft, { backgroundColor: palette.leaf }]} />
        <View style={[styles.leaf, styles.leafRight, { backgroundColor: palette.leafAlt }]} />
        <View style={styles.productShape}>
          <View style={[styles.productPump, { backgroundColor: palette.cap }]} />
          <View style={[styles.productNozzle, { backgroundColor: palette.cap }]} />
          <View style={[styles.productNeck, { backgroundColor: palette.cap }]} />
          <View style={[styles.productBody, { backgroundColor: palette.bottle }]}>
            <View style={[styles.productLabel, { backgroundColor: palette.label }]}>
              <Text style={[styles.labelTitle, { color: palette.labelText }]}>NEXO</Text>
              <Text style={[styles.labelLine, { color: palette.labelText }]}>{product.category}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.title}>
        {product.title}
      </Text>
      <Text numberOfLines={1} style={styles.seller}>
        {product.condition} / {product.seller}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{product.shipping}</Text>
        <Text style={styles.metaDot}>/</Text>
        <Text style={styles.metaText}>{product.stock} disp.</Text>
      </View>
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={styles.priceHint}>Proteccion incluida</Text>
        </View>
        <Pressable
          accessibilityLabel={`Agregar ${product.title} al carrito`}
          disabled={!product.available}
          style={({ pressed }) => [
            styles.addButton,
            !product.available && styles.addButtonDisabled,
            pressed && styles.addButtonPressed,
          ]}
          onPress={(event) => {
            event.stopPropagation();
            onAddToCart();
          }}
        >
          <Ionicons name="add" size={16} color={colors.surface} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 11,
    overflow: 'hidden',
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 6,
  },
  containerPressed: {
    transform: [{ scale: 0.99 }],
  },
  visual: {
    height: 104,
    borderRadius: radii.small,
    backgroundColor: colors.silverSoft,
    marginBottom: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  ratingPill: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  ratingText: {
    color: colors.brandBlue,
    fontSize: 10,
    fontWeight: '900',
  },
  leaf: {
    position: 'absolute',
    width: 44,
    height: 28,
    borderTopLeftRadius: 26,
    borderBottomRightRadius: 26,
    opacity: 0.72,
  },
  leafLeft: {
    left: 18,
    bottom: 20,
    transform: [{ rotate: '-26deg' }],
  },
  leafRight: {
    right: 14,
    bottom: 28,
    transform: [{ rotate: '28deg' }],
  },
  productShape: {
    alignSelf: 'center',
    width: 64,
    height: 94,
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  productPump: {
    width: 23,
    height: 7,
    borderRadius: 3,
    position: 'absolute',
    top: 0,
  },
  productNozzle: {
    width: 32,
    height: 5,
    borderRadius: 3,
    position: 'absolute',
    top: 3,
    right: 6,
  },
  productNeck: {
    width: 18,
    height: 12,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    position: 'absolute',
    top: 8,
    zIndex: 2,
  },
  productBody: {
    width: 42,
    height: 74,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productLabel: {
    width: 30,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.94,
  },
  labelTitle: {
    fontSize: 6,
    fontWeight: '900',
  },
  labelLine: {
    fontSize: 4,
    fontWeight: '700',
    marginTop: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
    minHeight: 31,
    lineHeight: 15,
  },
  seller: {
    fontSize: 9,
    color: colors.inkMuted,
    marginTop: 2,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  metaText: {
    color: colors.brandBlue,
    fontSize: 9,
    fontWeight: '900',
  },
  metaDot: {
    color: colors.silver,
    fontSize: 9,
    fontWeight: '900',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  price: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  priceHint: {
    color: colors.inkSoft,
    fontSize: 8,
    fontWeight: '800',
    marginTop: 1,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlue,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: colors.inkSoft,
    shadowOpacity: 0,
  },
  addButtonPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.82,
  },
});
