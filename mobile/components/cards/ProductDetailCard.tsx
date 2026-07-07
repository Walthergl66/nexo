import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RemoteImage } from '../common/RemoteImage';
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
  const stockLabel = product.stock === 1 ? '1 disponible' : `${product.stock} disponibles`;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityLabel="Volver al catalogo"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={onBack}
        >
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>
        <Text style={styles.statusText}>{product.available ? 'Disponible' : 'Agotado'}</Text>
      </View>

      <Text style={styles.title}>{product.title}</Text>

      <View style={styles.heroVisual}>
        {showRealImage ? (
          <RemoteImage
            accessibilityLabel={`Imagen de ${product.title}`}
            uri={product.imageUrl as string}
            width={900}
            style={styles.heroImage}
            onFinalError={() => setHasImageError(true)}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={52} color={colors.inkMuted} />
            <Text style={styles.imageFallbackText}>Imagen no disponible</Text>
          </View>
        )}
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCopy}>
          <Text style={styles.category}>{product.category}</Text>
          <View style={styles.sellerRow}>
            <Ionicons name="storefront-outline" size={13} color={colors.brandBlue} />
            <Text numberOfLines={1} style={styles.seller}>{product.seller}</Text>
          </View>
        </View>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Ionicons name="cube-outline" size={16} color={colors.brandBlue} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>Inventario</Text>
            <Text style={styles.infoValue}>{stockLabel}</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="pricetag-outline" size={16} color={colors.brandBlue} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>Categoria</Text>
            <Text numberOfLines={1} style={styles.infoValue}>{product.category}</Text>
          </View>
        </View>
      </View>

      <View style={styles.descriptionBlock}>
        <Text style={styles.sectionTitle}>Descripcion</Text>
        <Text style={styles.description}>{product.description}</Text>
      </View>

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
          <Text style={styles.addCartText}>{isAuthenticated ? 'Agregar al carrito' : 'Iniciar sesion'}</Text>
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
    gap: 12,
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
  statusText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '700',
  },
  heroVisual: {
    height: 280,
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
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
  },
  imageFallbackText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  category: {
    color: colors.brandAccent,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    fontWeight: '700',
  },
  price: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoItem: {
    flex: 1,
    minWidth: 138,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  infoValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  descriptionBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 14,
    gap: 8,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '700',
  },
});
