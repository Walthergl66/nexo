import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { CheckoutSummary } from './components/cards/CheckoutSummary';
import { BrandLogo } from './components/common/BrandLogo';
import { tabs } from './constants/navigation';
import { products } from './data/mockMarketplace';
import { AccountScreen } from './app/account/AccountScreen';
import { CartScreen } from './app/cart/CartScreen';
import { HomeScreen } from './app/home/HomeScreen';
import { OrdersScreen } from './app/orders/OrdersScreen';
import { SellScreen } from './app/sell/SellScreen';
import { colors, radii } from './theme/colors';
import type { CartItem, Product, ProductComment, TabKey } from './types/marketplace';

type NavIconName = keyof typeof Ionicons.glyphMap;

const navIcons: Record<TabKey, { active: NavIconName; inactive: NavIconName }> = {
  Inicio: { active: 'home', inactive: 'home-outline' },
  Vender: { active: 'pricetag', inactive: 'pricetag-outline' },
  Pedidos: { active: 'trophy', inactive: 'trophy-outline' },
  Cuenta: { active: 'person', inactive: 'person-outline' },
};

const activeNavSize = 62;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('Inicio');
  const [activeFilter, setActiveFilter] = useState('Todo');
  const [search, setSearch] = useState('');
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [customComments, setCustomComments] = useState<Record<string, ProductComment[]>>({});
  const [marketplaceProducts, setMarketplaceProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [isCatalogRefreshing, setIsCatalogRefreshing] = useState(false);
  const [lastCatalogSync, setLastCatalogSync] = useState<Date | null>(null);
  const [catalogRequestKey, setCatalogRequestKey] = useState(0);
  const [navWidth, setNavWidth] = useState(0);
  const activePillX = useRef(new Animated.Value(0)).current;
  const activeBubbleScale = useRef(new Animated.Value(1)).current;
  const cartPulse = useRef(new Animated.Value(1)).current;
  const hasLoadedCatalog = useRef(false);
  const headerVisibility = useRef(new Animated.Value(1)).current;
  const isHeaderVisible = useRef(true);
  const lastProductScrollY = useRef(0);
  const previousActiveIndex = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenTranslateX = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(0)).current;
  const screenScale = useRef(new Animated.Value(1)).current;
  const activeIndex = tabs.indexOf(activeTab);
  const isProductPresentation = activeTab === 'Inicio';
  const screenTransitionKey = `${activeTab}-${isCartOpen ? 'carrito' : selectedProductId ?? 'catalogo'}`;
  const navGap = 0;
  const tabWidth = navWidth > 0 ? navWidth / tabs.length : 0;
  const headerTranslateY = headerVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [-94, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const isInitialLoad = !hasLoadedCatalog.current;
    const requestDelay = isInitialLoad ? 680 : 360;

    if (isInitialLoad) {
      setIsCatalogLoading(true);
    } else {
      setIsCatalogRefreshing(true);
    }

    const request = setTimeout(() => {
      const nextProducts = products.map((product) => {
        const stock = Math.max(product.stock - (cartQuantities[product.id] ?? 0), 0);

        return {
          ...product,
          stock,
          available: product.available && stock > 0,
        };
      });
      const normalizedQuery = search.trim().toLowerCase();
      const nextFilteredProducts = nextProducts.filter((product) => {
        const matchesFilter = activeFilter === 'Todo' || product.category === activeFilter;
        const matchesSearch =
          normalizedQuery.length === 0 ||
          product.title.toLowerCase().includes(normalizedQuery) ||
          product.seller.toLowerCase().includes(normalizedQuery) ||
          product.category.toLowerCase().includes(normalizedQuery) ||
          product.description.toLowerCase().includes(normalizedQuery);

        return matchesFilter && matchesSearch;
      });

      setMarketplaceProducts(nextProducts);
      setFilteredProducts(nextFilteredProducts);
      setLastCatalogSync(new Date());
      hasLoadedCatalog.current = true;
      setIsCatalogLoading(false);
      setIsCatalogRefreshing(false);
    }, requestDelay);

    return () => clearTimeout(request);
  }, [activeFilter, catalogRequestKey, cartQuantities, search]);

  const selectedProduct = useMemo(() => {
    return marketplaceProducts.find((product) => product.id === selectedProductId) ?? null;
  }, [marketplaceProducts, selectedProductId]);
  const shouldShowHeader = activeTab === 'Inicio' && !isCartOpen && !selectedProduct;

  const selectedProductComments = useMemo(() => {
    if (!selectedProduct) {
      return [];
    }

    return [...selectedProduct.comments, ...(customComments[selectedProduct.id] ?? [])];
  }, [customComments, selectedProduct]);

  const cartItems = useMemo<CartItem[]>(() => {
    const sourceProducts = marketplaceProducts.length > 0 ? marketplaceProducts : products;

    return sourceProducts
      .map((product) => ({
        product,
        quantity: cartQuantities[product.id] ?? 0,
      }))
      .filter((item) => item.quantity > 0);
  }, [cartQuantities, marketplaceProducts]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const handleAddToCart = (product: Product) => {
    if (!product.available || product.stock <= 0) {
      return;
    }

    setCartQuantities((current) => ({
      ...current,
      [product.id]: (current[product.id] ?? 0) + 1,
    }));
    cartPulse.setValue(0.92);
    Animated.sequence([
      Animated.timing(cartPulse, {
        toValue: 1.08,
        duration: 110,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
      Animated.timing(cartPulse, {
        toValue: 1,
        duration: 140,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setIsCartOpen(false);
    setSelectedRating(5);
    setCommentText('');
  };

  const handleBackToCatalog = () => {
    setSelectedProductId(null);
    setIsCartOpen(false);
  };

  const handleOpenCart = () => {
    setActiveTab('Inicio');
    setSelectedProductId(null);
    setIsCartOpen(true);
  };

  const handleRefreshCatalog = () => {
    setCatalogRequestKey((current) => current + 1);
  };

  const handleChangeCartQuantity = (productId: string, quantity: number) => {
    setCartQuantities((current) => {
      const next = { ...current };

      if (quantity <= 0) {
        delete next[productId];
      } else {
        next[productId] = quantity;
      }

      return next;
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    handleChangeCartQuantity(productId, 0);
  };

  const handleSubmitComment = () => {
    if (!selectedProduct || commentText.trim().length === 0) {
      return;
    }

    const comment: ProductComment = {
      id: `C-${selectedProduct.id}-${Date.now()}`,
      author: 'Walter',
      rating: selectedRating,
      text: commentText.trim(),
    };

    setCustomComments((current) => ({
      ...current,
      [selectedProduct.id]: [...(current[selectedProduct.id] ?? []), comment],
    }));
    setCommentText('');
  };

  useEffect(() => {
    if (tabWidth <= 0) {
      return;
    }

    Animated.parallel([
      Animated.spring(activePillX, {
        toValue: activeIndex * (tabWidth + navGap) + tabWidth / 2 - activeNavSize / 2,
        damping: 18,
        mass: 0.85,
        stiffness: 180,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(activeBubbleScale, {
          toValue: 0.9,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(activeBubbleScale, {
          toValue: 1,
          damping: 11,
          stiffness: 170,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [activeBubbleScale, activeIndex, activePillX, navGap, tabWidth]);

  useEffect(() => {
    const transitionDirection = activeIndex >= previousActiveIndex.current ? 1 : -1;

    screenOpacity.setValue(0);
    screenTranslateX.setValue(26 * transitionDirection);
    screenTranslateY.setValue(8);
    screenScale.setValue(0.975);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });

    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
      Animated.spring(screenTranslateX, {
        toValue: 0,
        damping: 18,
        mass: 0.75,
        stiffness: 190,
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
      Animated.spring(screenScale, {
        toValue: 1,
        damping: 17,
        mass: 0.8,
        stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      previousActiveIndex.current = activeIndex;
    });
  }, [activeIndex, screenOpacity, screenScale, screenTransitionKey, screenTranslateX, screenTranslateY]);

  useEffect(() => {
    if (shouldShowHeader) {
      isHeaderVisible.current = true;
      lastProductScrollY.current = 0;
      headerVisibility.setValue(1);
    }
  }, [headerVisibility, shouldShowHeader]);

  const handleNavLayout = (event: LayoutChangeEvent) => {
    setNavWidth(event.nativeEvent.layout.width);
  };

  const animateHeader = (visible: boolean) => {
    if (isHeaderVisible.current === visible) {
      return;
    }

    isHeaderVisible.current = visible;
    Animated.timing(headerVisibility, {
      toValue: visible ? 1 : 0,
      duration: 180,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: true,
    }).start();
  };

  const handleProductScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextY = Math.max(0, event.nativeEvent.contentOffset.y);
    const delta = nextY - lastProductScrollY.current;
    const scrollThreshold = 8;

    if (nextY <= 10) {
      animateHeader(true);
    } else if (delta > scrollThreshold) {
      animateHeader(false);
    } else if (delta < -scrollThreshold) {
      animateHeader(true);
    }

    lastProductScrollY.current = nextY;
  };

  const renderActiveScreen = () => {
    if (isCartOpen) {
      return (
        <CartScreen
          items={cartItems}
          shipping={4.99}
          onBackToCatalog={handleBackToCatalog}
          onChangeQuantity={handleChangeCartQuantity}
          onRemoveItem={handleRemoveCartItem}
        />
      );
    }

    switch (activeTab) {
      case 'Inicio':
        return (
          <HomeScreen
            activeFilter={activeFilter}
            commentText={commentText}
            filteredProducts={filteredProducts}
            isLoading={isCatalogLoading}
            isRefreshing={isCatalogRefreshing}
            lastSyncAt={lastCatalogSync}
            productsCount={marketplaceProducts.length}
            productComments={selectedProductComments}
            search={search}
            selectedProduct={selectedProduct}
            selectedRating={selectedRating}
            onAddToCart={handleAddToCart}
            onBackToCatalog={handleBackToCatalog}
            onChangeCommentText={setCommentText}
            onChangeFilter={setActiveFilter}
            onChangeRating={setSelectedRating}
            onChangeSearch={setSearch}
            onRefreshCatalog={handleRefreshCatalog}
            onSelectProduct={handleSelectProduct}
            onSubmitComment={handleSubmitComment}
          />
        );
      case 'Vender':
        return <SellScreen />;
      case 'Pedidos':
        return <OrdersScreen />;
      case 'Cuenta':
        return <AccountScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={[styles.appShell, isProductPresentation && styles.appShellProduct]}>
        {shouldShowHeader && (
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.header,
              {
                opacity: headerVisibility,
                transform: [{ translateY: headerTranslateY }],
              },
            ]}
          >
            <View style={styles.headerBrand}>
              <BrandLogo />
              <View>
                <Text style={styles.headerTitle}>NEXO</Text>
              </View>
            </View>
            <Animated.View style={{ transform: [{ scale: cartPulse }] }}>
              <Pressable
                accessibilityLabel="Abrir carrito"
                style={({ pressed }) => [styles.cartBadge, pressed && styles.cartBadgePressed]}
                onPress={handleOpenCart}
              >
                <Ionicons name="cart" size={21} color={colors.surface} />
                {cartCount > 0 && (
                  <View style={styles.cartCountBubble}>
                    <Text style={styles.cartCountText}>{cartCount}</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          </Animated.View>
        )}

        <Animated.ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.content,
            isProductPresentation && styles.productContent,
            shouldShowHeader && styles.contentWithHeader,
          ]}
          onScroll={shouldShowHeader ? handleProductScroll : undefined}
          scrollEventThrottle={16}
        >
          <Animated.View
            style={[
              styles.screenTransition,
              {
                opacity: screenOpacity,
                transform: [{ translateX: screenTranslateX }, { translateY: screenTranslateY }, { scale: screenScale }],
              },
            ]}
          >
            {renderActiveScreen()}
            {!isProductPresentation && <CheckoutSummary subtotal={cartSubtotal} shipping={4.99} />}
          </Animated.View>
        </Animated.ScrollView>

        <View style={styles.bottomNav}>
          <View style={styles.bottomNavTrack} onLayout={handleNavLayout}>
            {tabWidth > 0 && (
              <>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.bottomNavPocket,
                    {
                      transform: [{ translateX: activePillX }],
                    },
                  ]}
                />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.bottomNavHalo,
                    {
                      transform: [{ translateX: activePillX }, { scale: activeBubbleScale }],
                    },
                  ]}
                />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.bottomNavBubble,
                    {
                      transform: [{ translateX: activePillX }, { scale: activeBubbleScale }],
                    },
                  ]}
                >
                  <Ionicons name={navIcons[activeTab].active} size={30} color={colors.surface} />
                </Animated.View>
              </>
            )}
            {tabs.map((tab) => {
              const isActive = tab === activeTab;
              const iconName = navIcons[tab].inactive;

              return (
                <Pressable
                  key={tab}
                  accessibilityLabel={tab}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }) => [
                    styles.bottomNavItem,
                    { width: tabWidth || undefined },
                    pressed && styles.bottomNavItemPressed,
                  ]}
                  onPress={() => {
                    setActiveTab(tab);
                    setIsCartOpen(false);
                  }}
                >
                  <Ionicons
                    name={iconName}
                    size={23}
                    color={isActive ? 'transparent' : colors.inkMuted}
                  />
                  <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.surface,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : undefined,
    alignSelf: 'center',
    borderRadius: Platform.OS === 'web' ? 28 : 0,
    overflow: 'hidden',
  },
  appShellProduct: {
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: colors.brandBlueLine,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },
  statusBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: Platform.OS === 'web' ? 320 : 260,
  },
  headerTitle: {
    color: colors.brandBlue,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerSubtitle: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    maxWidth: 210,
  },
  cartBadge: {
    backgroundColor: colors.brandBlue,
    borderWidth: 1,
    borderColor: colors.brandBlue,
    borderRadius: radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    height: 46,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  cartBadgePressed: {
    transform: [{ scale: 0.96 }],
  },
  cartCountBubble: {
    position: 'absolute',
    right: -3,
    top: -5,
    minWidth: 20,
    height: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  cartCountText: {
    color: colors.brandBlue,
    fontSize: 11,
    fontWeight: '900',
  },
  cartBadgeValue: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 132,
  },
  contentWithHeader: {
    paddingTop: 104,
  },
  productContent: {
    paddingTop: 0,
  },
  screenTransition: {
    gap: 14,
  },
  bottomNav: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    height: 94,
    justifyContent: 'flex-end',
  },
  bottomNavTrack: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: Platform.OS === 'web' ? '#fbfdff' : colors.surface,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 26,
    elevation: 14,
  },
  bottomNavPocket: {
    position: 'absolute',
    top: -22,
    left: 0,
    width: activeNavSize,
    height: activeNavSize,
    borderRadius: activeNavSize / 2,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
  },
  bottomNavHalo: {
    position: 'absolute',
    top: -27,
    left: 0,
    width: activeNavSize,
    height: activeNavSize,
    borderRadius: activeNavSize / 2,
    backgroundColor: colors.brandBlueSoft,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 15,
    opacity: 0.72,
  },
  bottomNavBubble: {
    position: 'absolute',
    top: -31,
    left: 0,
    width: activeNavSize,
    height: activeNavSize,
    borderRadius: activeNavSize / 2,
    backgroundColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 20,
  },
  bottomNavItem: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: radii.large,
    gap: 3,
    paddingBottom: 10,
    transform: [{ scale: 1 }],
  },
  bottomNavItemPressed: {
    transform: [{ scale: 0.96 }],
  },
  bottomNavLabel: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
    letterSpacing: 0,
  },
  bottomNavLabelActive: {
    color: colors.brandBlue,
  },
});
