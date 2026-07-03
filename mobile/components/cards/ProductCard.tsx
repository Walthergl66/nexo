import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';

type ProductCardProps = {
  product: Product;
  isAuthenticated: boolean;
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
    bottle: '#B9CAD7',
    cap: colors.brandBlue,
    label: colors.surface,
    labelText: colors.ink,
    leaf: '#B7DDF0',
    leafAlt: '#D8EAF3',
  },
  cool: {
    bottle: '#D3E5F0',
    cap: colors.brandBlue,
    label: colors.surface,
    labelText: colors.ink,
    leaf: '#A8D9F0',
    leafAlt: '#E1F2FA',
  },
  light: {
    bottle: '#E9F2F7',
    cap: colors.brandBlue,
    label: colors.surface,
    labelText: colors.ink,
    leaf: '#C4E5F4',
    leafAlt: '#E1EDF3',
  },
  warm: {
    bottle: '#C4D4DF',
    cap: colors.primarySoft,
    label: colors.surface,
    labelText: colors.ink,
    leaf: '#B5CEDD',
    leafAlt: '#E5EEF3',
  },
};

export function ProductCard({ product, isAuthenticated, onAddToCart, onSelectProduct }: ProductCardProps) {
  const palette = palettes[product.visualTone];
  const addLabel = isAuthenticated ? `Agregar ${product.title} al carrito` : `Iniciar sesion para comprar ${product.title}`;

  return (
    <Pressable
      accessibilityLabel={`Ver detalle de ${product.title}`}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      onPress={onSelectProduct}
    >
      <View style={styles.visual}>
        <View style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={14} color={colors.ink} />
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
        {product.seller}
      </Text>
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={styles.priceHint}>{product.stock} disponibles</Text>
        </View>
        <Pressable
          accessibilityLabel={addLabel}
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
          <Text style={styles.addButtonText}>{isAuthenticated ? 'Comprar' : 'Entrar'}</Text>
        </Pressable>
      </View>
    </Pressable>
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
    ...shadows.card,
  },
  containerPressed: {
    transform: [{ scale: 0.97 }],
  },
  visual: {
    height: 138,
    borderRadius: 14,
    backgroundColor: colors.silverSoft,
    marginBottom: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.line,
  },
  leaf: {
    position: 'absolute',
    width: 44,
    height: 28,
    borderTopLeftRadius: 26,
    borderBottomRightRadius: 26,
    opacity: 0.58,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  favoriteButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
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
    height: 112,
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
    borderWidth: 1,
    borderColor: colors.ink,
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
    height: 88,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.ink,
  },
  productLabel: {
    width: 30,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.94,
    borderWidth: 1,
    borderColor: colors.lineStrong,
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
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
    minHeight: 31,
    lineHeight: 17,
  },
  seller: {
    fontSize: 10,
    color: colors.inkMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  priceHint: {
    color: colors.inkSoft,
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  addButton: {
    minWidth: 64,
    height: 30,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    paddingHorizontal: 10,
  },
  addButtonDisabled: {
    backgroundColor: colors.inkSoft,
    shadowOpacity: 0,
  },
  addButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '800',
  },
});
