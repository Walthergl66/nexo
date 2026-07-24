import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ProductCard } from '../../components/cards/ProductCard';
import { ProductDetailCard } from '../../components/cards/ProductDetailCard';
import { Skeleton } from '../../components/common/Skeleton';
import { fetchProducts } from '../../services/marketplaceApi';
import { colors, radii } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import type { PublicUser } from '../../types/social';
import type { StatusTone } from '../../types/status';

type PublicProfileScreenProps = {
  user: PublicUser;
  accessToken: string | null;
  isAuthenticated: boolean;
  myProfileId?: string | null;
  onBack: () => void;
  onAddToCart: (product: Product) => void | Promise<boolean>;
  onStatusMessage?: (message: string, tone: StatusTone) => void;
  onCartAdded?: () => void;
};

/**
 * Perfil público de otro usuario: identidad segura (nombre, avatar, badge) y, si
 * es vendedor, su tienda y productos. El detalle de producto se maneja acá mismo
 * para no acoplarse al catálogo de Inicio.
 */
export function PublicProfileScreen({
  user,
  accessToken,
  isAuthenticated,
  myProfileId,
  onBack,
  onAddToCart,
  onStatusMessage,
  onCartAdded,
}: PublicProfileScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const storeSlug = user.store?.slug ?? null;

  useEffect(() => {
    if (!storeSlug) {
      setProducts([]);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    fetchProducts({ store: storeSlug })
      .then((items) => {
        if (isActive) {
          setProducts(items);
        }
      })
      .catch(() => {
        if (isActive) {
          setProducts([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [storeSlug]);

  if (selectedProduct) {
    return (
      <ProductDetailCard
        product={selectedProduct}
        isAuthenticated={isAuthenticated}
        isOwn={Boolean(myProfileId) && selectedProduct.ownerProfileId === myProfileId}
        accessToken={accessToken}
        onAddToCart={() => onAddToCart(selectedProduct)}
        onBack={() => setSelectedProduct(null)}
        onStatusMessage={onStatusMessage}
        onCartAdded={onCartAdded}
      />
    );
  }

  const roleLabel = user.role === 'seller' ? 'Vendedor' : user.role === 'admin' ? 'Administrador' : 'Comprador';

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
        <Text style={styles.backText}>Volver</Text>
      </Pressable>

      <View style={styles.header}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={34} color={colors.brandBlue} />
          </View>
        )}

        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>
            {user.displayName ?? 'Usuario nexo'}
          </Text>
          {user.isVerified && <Ionicons name="checkmark-circle" size={20} color={colors.brandBlue} />}
        </View>
        <Text style={styles.role}>{roleLabel}</Text>

        {user.store && (
          <View style={styles.storeChip}>
            <Ionicons name="storefront-outline" size={15} color={colors.brandBlue} />
            <Text style={styles.storeName}>{user.store.name}</Text>
          </View>
        )}
      </View>

      {user.store ? (
        <>
          <Text style={styles.sectionTitle}>Productos</Text>

          {isLoading ? (
            <View style={styles.grid}>
              {[0, 1, 2, 3].map((placeholder) => (
                <View key={placeholder} style={styles.cell}>
                  <Skeleton style={styles.skeleton} />
                </View>
              ))}
            </View>
          ) : products.length > 0 ? (
            <View style={styles.grid}>
              {products.map((product) => (
                <View key={product.id} style={styles.cell}>
                  <ProductCard
                    product={product}
                    isAuthenticated={isAuthenticated}
                    isOwn={Boolean(myProfileId) && product.ownerProfileId === myProfileId}
                    onAddToCart={() => onAddToCart(product)}
                    onSelectProduct={() => setSelectedProduct(product)}
                    onCartAdded={onCartAdded}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={26} color={colors.brandBlue} />
              <Text style={styles.emptyText}>Esta tienda todavía no tiene productos publicados.</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="storefront-outline" size={26} color={colors.brandBlue} />
          <Text style={styles.emptyText}>Este usuario todavía no tiene una tienda.</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  backText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  name: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  role: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    backgroundColor: colors.brandBlueSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  storeName: {
    color: colors.brandBlue,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  cell: {
    width: '47.5%',
  },
  skeleton: {
    height: 180,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    padding: 28,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyText: {
    color: colors.inkMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
