import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';

type ProductDetailCardProps = {
  product: Product;
  isAuthenticated: boolean;
  onAddToCart: () => void;
  onBack: () => void;
};

export function ProductDetailCard({
  product,
  isAuthenticated,
  onAddToCart,
  onBack,
}: ProductDetailCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const showRealImage = Boolean(product.imageUrl) && !hasImageError;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityLabel="Volver al catálogo"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={onBack}
        >
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>
        <Text style={styles.changeText}>{product.available ? 'Disponible' : 'Agotado'}</Text>
      </View>

      <Text style={styles.pageTitle}>Producto</Text>

      <View style={styles.heroVisual}>
        {showRealImage ? (
          <Image
            accessibilityLabel={`Imagen de ${product.title}`}
            source={{ uri: product.imageUrl as string }}
            style={styles.heroImage}
            resizeMode="cover"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <>
            <View style={styles.heroHalo} />
            <View style={styles.heroOrbit} />
            <Ionicons name="bag-handle-outline" size={112} color={colors.ink} />
          </>
        )}
        <View style={styles.heroBadge}>
          <Ionicons name="shield-checkmark-outline" size={15} color={colors.ink} />
        </View>
      </View>

      <View style={styles.thumbnailRow}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={[styles.thumbnail, item === 1 && styles.thumbnailActive]}>
            <Ionicons name="bag-handle-outline" size={28} color={item === 1 ? colors.surface : colors.inkMuted} />
          </View>
        ))}
      </View>

      <View style={styles.productHeading}>
        <View style={styles.headingCopy}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.title}>{product.title}</Text>
          <View style={styles.sellerRow}>
            <Ionicons name="storefront-outline" size={13} color={colors.brandBlue} />
            <Text numberOfLines={1} style={styles.seller}>{product.seller}</Text>
          </View>
        </View>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
      </View>

      <View style={styles.optionRow}>
        <View>
          <Text style={styles.optionLabel}>Condición</Text>
          <View style={styles.sizeRow}>
            <View style={styles.sizeActive}><Text style={styles.sizeActiveText}>{product.condition}</Text></View>
            <View style={styles.sizeChip}><Text style={styles.sizeText}>{product.stock} uds.</Text></View>
          </View>
        </View>
        <View style={styles.colorBlock}>
          <Text style={styles.optionLabel}>Estilo</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorDot, { backgroundColor: colors.silver }]} />
            <View style={[styles.colorDot, styles.colorDotActive, { backgroundColor: colors.brandAccent }]} />
            <View style={[styles.colorDot, { backgroundColor: colors.primarySoft }]} />
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        <Text style={[styles.tabText, styles.tabActive]}>Acerca de</Text>
        <Text style={styles.tabText}>Detalles</Text>
        <Text style={styles.tabText}>Reseñas</Text>
      </View>

      <Text style={styles.description}>{product.description}</Text>

      <View style={styles.bottomActions}>
        <View style={styles.protection}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.ink} />
          <Text style={styles.protectionText}>Compra protegida</Text>
        </View>
        <Pressable
          disabled={!product.available}
          style={({ pressed }) => [
            styles.addCartButton,
            !product.available && styles.addCartButtonDisabled,
            pressed && styles.pressed,
          ]}
          onPress={onAddToCart}
        >
          <Ionicons name={isAuthenticated ? 'bag-add-outline' : 'log-in-outline'} size={18} color={colors.surface} />
          <Text style={styles.addCartText}>{isAuthenticated ? 'Agregar al carrito' : 'Iniciar sesión'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  backText: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  changeText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '700',
  },
  pageTitle: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.8,
  },
  heroVisual: {
    height: 248,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroHalo: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: colors.surfaceSoft,
  },
  heroOrbit: {
    position: 'absolute',
    bottom: 30,
    width: 220,
    height: 48,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: colors.lineStrong,
    transform: [{ scaleY: 0.35 }],
  },
  heroBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnail: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  productHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  headingCopy: {
    flex: 1,
  },
  category: {
    color: colors.brandAccent,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.ink,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '600',
    letterSpacing: -0.7,
    marginTop: 4,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  seller: {
    flex: 1,
    color: colors.brandBlue,
    fontSize: 12,
    fontWeight: '600',
  },
  price: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  optionLabel: {
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sizeChip: {
    minHeight: 30,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeActive: {
    minHeight: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeText: {
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  sizeActiveText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  colorBlock: {
    alignItems: 'flex-end',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 7,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  colorDotActive: {
    borderColor: colors.ink,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tabText: {
    flex: 1,
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 10,
  },
  tabActive: {
    color: colors.ink,
    fontWeight: '600',
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  description: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
  },
  protection: {
    flex: 0.8,
    minHeight: 48,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
  },
  protectionText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '700',
  },
  addCartButton: {
    flex: 1.2,
    minHeight: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 14,
  },
  addCartButtonDisabled: {
    backgroundColor: colors.inkSoft,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  addCartText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '600',
  },
});
