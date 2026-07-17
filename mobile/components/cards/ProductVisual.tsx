import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RemoteImage } from '../common/RemoteImage';
import { useFavorites } from '../../context/FavoritesContext';
import { colors } from '../../theme/colors';
import type { Product } from '../../types/marketplace';

type ProductVisualProps = {
  product: Product;
  showFavorite?: boolean;
  imageWidth?: number;
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

/**
 * Shared product artwork used by the buyer catalog card and the seller card:
 * shows the real product image when available, otherwise a stylized illustration.
 */
export function ProductVisual({ product, showFavorite = false, imageWidth = 500 }: ProductVisualProps) {
  const palette = palettes[product.visualTone];
  const [hasImageError, setHasImageError] = useState(false);
  const showRealImage = Boolean(product.imageUrl) && !hasImageError;
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.id);

  return (
    <View style={styles.visual}>
      {showFavorite && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? `Quitar ${product.title} de favoritos` : `Agregar ${product.title} a favoritos`}
          accessibilityState={{ selected: favorite }}
          hitSlop={8}
          style={({ pressed }) => [styles.favoriteButton, pressed && styles.favoriteButtonPressed]}
          onPress={(event) => {
            event.stopPropagation();
            toggleFavorite(product.id);
          }}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={15}
            color={favorite ? colors.popCoral : colors.ink}
          />
        </Pressable>
      )}
      {showRealImage ? (
        <RemoteImage
          accessibilityLabel={`Imagen de ${product.title}`}
          uri={product.imageUrl as string}
          width={imageWidth}
          style={styles.productImage}
          onFinalError={() => setHasImageError(true)}
        />
      ) : (
        <>
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  visual: {
    height: 140,
    borderRadius: 14,
    backgroundColor: colors.silverSoft,
    marginBottom: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
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
  favoriteButtonPressed: {
    transform: [{ scale: 0.88 }],
    backgroundColor: colors.surface,
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
    fontWeight: '700',
  },
  labelLine: {
    fontSize: 4,
    fontWeight: '700',
    marginTop: 2,
  },
});
