import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RemoteImage } from '../common/RemoteImage';
import { colors, radii, shadows, spacing } from '../../theme/colors';
import { formatPrice } from '../../utils/format';

type HeroSectionProps = {
  imageUrl?: string | null;
  title?: string;
  seller?: string;
  price?: number;
  category?: string;
  badge?: string;
  onPress?: () => void;
};

export function HeroSection({
  imageUrl,
  title = 'Descubre lo que tus clientes buscan',
  seller,
  price,
  category,
  badge = 'Destacado',
  onPress,
}: HeroSectionProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const showImage = Boolean(imageUrl) && !hasImageError;

  return (
    <Pressable
      accessibilityLabel={`Ver producto: ${title}`}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        {showImage ? (
          <RemoteImage
            uri={imageUrl as string}
            width={780}
            style={styles.image}
            onFinalError={() => setHasImageError(true)}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="sparkles-outline" size={36} color={colors.brandBlueMuted} />
          </View>
        )}

        {category && (
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        )}

        <View style={styles.bottomContent}>
          <View style={styles.textBlock}>
            <Text numberOfLines={2} style={styles.title}>{title}</Text>
            <View style={styles.metaRow}>
              {seller && (
                <View style={styles.sellerChip}>
                  <Ionicons name="storefront-outline" size={11} color="rgba(255,255,255,0.8)" />
                  <Text numberOfLines={1} style={styles.sellerText}>{seller}</Text>
                </View>
              )}
              {price != null && (
                <View style={styles.priceChip}>
                  <Text style={styles.priceText}>{formatPrice(price)}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.ctaRow}>
            <Text style={styles.ctaText}>Ver producto</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.surface} />
          </View>
        </View>

        <View style={styles.badgeWrap}>
          <Ionicons name="star" size={9} color={colors.surface} />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const HERO_HEIGHT = 260;
const CLIP_BOTTOM_RADIUS = 48;

const styles = StyleSheet.create({
  container: {},
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  imageContainer: {
    height: HERO_HEIGHT,
    borderBottomRightRadius: CLIP_BOTTOM_RADIUS,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    ...shadows.card,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
  },

  categoryTag: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  badgeWrap: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 79, 158, 0.8)',
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  title: {
    color: colors.surface,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sellerText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
  },
  priceChip: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priceText: {
    color: colors.primarySoft,
    fontSize: 13,
    fontWeight: '700',
  },

  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginLeft: 12,
  },
  ctaText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
});
