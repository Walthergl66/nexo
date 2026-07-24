import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
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
  const [loadError, setLoadError] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const storeSlug = user.store?.slug ?? null;

  const loadProducts = useCallback(async () => {
    if (!storeSlug) {
      setProducts([]);
      setLoadError(false);
      return;
    }

    setIsLoading(true);
    setLoadError(false);

    try {
      setProducts(await fetchProducts({ store: storeSlug }));
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

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
        <View style={styles.roleRow}>
          <View style={styles.roleBadge}>
            <Ionicons name={user.role === 'seller' ? 'storefront-outline' : 'person-outline'} size={13} color={colors.brandBlue} />
            <Text style={styles.role}>{roleLabel}</Text>
          </View>
          {user.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark-outline" size={13} color="#16836b" />
              <Text style={styles.verifiedText}>Verificado</Text>
            </View>
          )}
        </View>

        {user.store && (
          <View style={styles.storeCard}>
            <View style={styles.storeIcon}>
              <Ionicons name="storefront-outline" size={18} color={colors.brandBlue} />
            </View>
            <View style={styles.storeCopy}>
              <Text style={styles.storeLabel}>Tienda activa</Text>
              <Text numberOfLines={1} style={styles.storeName}>{user.store.name}</Text>
            </View>
            <View style={styles.productCount}>
              <Text style={styles.productCountValue}>{isLoading ? '—' : products.length}</Text>
              <Text style={styles.productCountLabel}>productos</Text>
            </View>
          </View>
        )}
      </View>

      {user.store ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos publicados</Text>
            {!isLoading && !loadError && <Text style={styles.sectionCount}>{products.length}</Text>}
          </View>

          {isLoading ? (
            <View style={styles.grid}>
              {[0, 1, 2, 3].map((placeholder) => (
                <View key={placeholder} style={styles.cell}>
                  <Skeleton style={styles.skeleton} />
                </View>
              ))}
            </View>
          ) : loadError ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="cloud-offline-outline" size={26} color={colors.brandBlue} />
              </View>
              <Text style={styles.emptyTitle}>No pudimos cargar la tienda</Text>
              <Text style={styles.emptyText}>Comprueba tu conexión e inténtalo nuevamente.</Text>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                onPress={() => void loadProducts()}
              >
                <Ionicons name="refresh" size={15} color={colors.surface} />
                <Text style={styles.retryText}>Reintentar</Text>
              </Pressable>
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
              <View style={styles.emptyIcon}>
                <Ionicons name="cube-outline" size={26} color={colors.brandBlue} />
              </View>
              <Text style={styles.emptyTitle}>Sin productos publicados</Text>
              <Text style={styles.emptyText}>Esta tienda todavía no tiene productos publicados.</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="storefront-outline" size={26} color={colors.brandBlue} />
          </View>
          <Text style={styles.emptyTitle}>Sin tienda disponible</Text>
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
    padding: 18,
    borderRadius: radii.large,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
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
    color: colors.brandBlue,
    fontSize: 11,
    fontWeight: '700',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brandBlueSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.pill,
    backgroundColor: '#F0FAF7',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  verifiedText: {
    color: '#16836b',
    fontSize: 10,
    fontWeight: '700',
  },
  storeCard: {
    width: '100%',
    marginTop: 8,
    borderRadius: radii.medium,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
  },
  storeCopy: {
    flex: 1,
    minWidth: 0,
  },
  storeLabel: {
    color: colors.inkMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  storeName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  productCount: {
    alignItems: 'flex-end',
  },
  productCountValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  productCountLabel: {
    color: colors.inkMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '700',
  },
  sectionCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brandBlueSoft,
    color: colors.brandBlue,
    fontSize: 11,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
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
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.inkMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  retryButton: {
    minHeight: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlue,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retryText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
});
