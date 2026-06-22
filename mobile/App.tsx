import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { AmbientBackground } from './components/common/AmbientBackground';
import { BrandLogo } from './components/common/BrandLogo';
import { tabs } from './constants/navigation';
import { AccountScreen } from './app/account/AccountScreen';
import { CartScreen } from './app/cart/CartScreen';
import { HomeScreen } from './app/home/HomeScreen';
import { OrdersScreen } from './app/orders/OrdersScreen';
import { SellScreen } from './app/sell/SellScreen';
import {
  addProductToCart,
  createOrderFromCart,
  fetchCategoryNames,
  fetchCart,
  fetchProfile,
  fetchProducts,
  removeCartItem,
  updateCartItemQuantity,
  type ProfileResource,
} from './services/marketplaceApi';
import { getCurrentSession, onAuthStateChange } from './services/authService';
import { colors, radii } from './theme/colors';
import type { CartItem, Product, TabKey } from './types/marketplace';

type NavIconName = keyof typeof Ionicons.glyphMap;

const navIcons: Record<TabKey, { active: NavIconName; inactive: NavIconName }> = {
  Inicio: { active: 'home', inactive: 'home-outline' },
  Vender: { active: 'flame', inactive: 'flame-outline' },
  Pedidos: { active: 'bag-handle', inactive: 'bag-handle-outline' },
  Cuenta: { active: 'person', inactive: 'person-outline' },
};

const bottomNavHorizontalPadding = 16;
const bottomNavDotSize = 7;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('Inicio');
  const [activeFilter, setActiveFilter] = useState('Todo');
  const [search, setSearch] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [marketplaceProducts, setMarketplaceProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>(['Todo']);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResource | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [isCatalogRefreshing, setIsCatalogRefreshing] = useState(false);
  const [lastCatalogSync, setLastCatalogSync] = useState<Date | null>(null);
  const [catalogRequestKey, setCatalogRequestKey] = useState(0);
  const [navWidth, setNavWidth] = useState(0);
  const activeIconBuild = useRef(new Animated.Value(1)).current;
  const activeDotX = useRef(new Animated.Value(0)).current;
  const activeDotJump = useRef(new Animated.Value(0)).current;
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
  const isProductPresentation = activeTab === 'Inicio';
  const isAuthenticated = accessToken !== null;
  const hasBusinessProfile = isAuthenticated && profile !== null;
  const visibleTabs = useMemo<TabKey[]>(
    () => (hasBusinessProfile ? tabs : ['Inicio', 'Cuenta']),
    [hasBusinessProfile],
  );
  const visibleActiveIndex = Math.max(0, visibleTabs.indexOf(activeTab));
  const screenTransitionKey = `${activeTab}-${isCartOpen ? 'carrito' : selectedProductId ?? 'catalogo'}`;
  const headerTranslateY = headerVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [-94, 0],
    extrapolate: 'clamp',
  });
  const activeIconScale = activeIconBuild.interpolate({
    inputRange: [0, 0.58, 1],
    outputRange: [0.72, 1.16, 1],
    extrapolate: 'clamp',
  });
  const navItemWidth =
    navWidth > 0 ? (navWidth - bottomNavHorizontalPadding * 2) / visibleTabs.length : 0;
  const activeDotY = activeDotJump.interpolate({
    inputRange: [0, 0.52, 1],
    outputRange: [0, -15, 0],
    extrapolate: 'clamp',
  });
  const activeDotScale = activeDotJump.interpolate({
    inputRange: [0, 0.52, 1],
    outputRange: [1, 1.12, 1],
    extrapolate: 'clamp',
  });

  const applyCatalogFilters = useCallback((sourceProducts: Product[], filter: string, query: string) => {
    const normalizedQuery = query.trim().toLowerCase();

    return sourceProducts.filter((product) => {
      const matchesFilter = filter === 'Todo' || product.category === filter;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.seller.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const isInitialLoad = !hasLoadedCatalog.current;

    if (isInitialLoad) {
      setIsCatalogLoading(true);
    } else {
      setIsCatalogRefreshing(true);
    }

    fetchProducts()
      .then((nextProducts) => {
        if (!isMounted) {
          return;
        }

        setMarketplaceProducts(nextProducts);
        setFilteredProducts(applyCatalogFilters(nextProducts, activeFilter, search));
        setLastCatalogSync(new Date());
        hasLoadedCatalog.current = true;
      })
      .catch(() => {
        if (isMounted) {
          setMarketplaceProducts([]);
          setFilteredProducts([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCatalogLoading(false);
          setIsCatalogRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeFilter, applyCatalogFilters, catalogRequestKey, search]);

  useEffect(() => {
    let isMounted = true;

    fetchCategoryNames()
      .then((names) => {
        if (isMounted) {
          setCategoryFilters(['Todo', ...names]);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCategoryFilters(['Todo']);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [catalogRequestKey]);

  useEffect(() => {
    setFilteredProducts(applyCatalogFilters(marketplaceProducts, activeFilter, search));
  }, [activeFilter, applyCatalogFilters, marketplaceProducts, search]);

  useEffect(() => {
    let isMounted = true;

    getCurrentSession()
      .then((session) => {
        if (isMounted) {
          setAccessToken(session?.access_token ?? null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccessToken(null);
        }
      });

    const subscription = onAuthStateChange((session) => {
      setAccessToken(session?.access_token ?? null);
      setSelectedProductId(null);
      setIsCartOpen(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!accessToken) {
      setProfile(null);
      setCartItems([]);
      setIsProfileLoading(false);
      setProfileError(null);
      return () => {
        isMounted = false;
      };
    }

    setIsProfileLoading(true);
    setProfileError(null);

    fetchProfile(accessToken)
      .then((nextProfile) => {
        if (isMounted) {
          setProfile(nextProfile);
          setProfileError(null);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setProfile(null);
          setCartItems([]);
          setProfileError(
            error instanceof Error
              ? error.message
              : 'No se pudo sincronizar el perfil interno con Laravel.',
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, profileRefreshKey]);

  useEffect(() => {
    let isMounted = true;

    if (!accessToken || !profile) {
      setCartItems([]);
      return () => {
        isMounted = false;
      };
    }

    fetchCart(accessToken)
      .then((items) => {
        if (isMounted) {
          setCartItems(items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCartItems([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, profile]);

  useEffect(() => {
    if (!hasBusinessProfile && (activeTab === 'Vender' || activeTab === 'Pedidos')) {
      setActiveTab('Cuenta');
      setIsCartOpen(false);
      setSelectedProductId(null);
    }
  }, [activeTab, hasBusinessProfile]);

  const selectedProduct = useMemo(
    () => marketplaceProducts.find((product) => product.id === selectedProductId) ?? null,
    [marketplaceProducts, selectedProductId],
  );
  const shouldShowHeader = activeTab === 'Inicio' && !isCartOpen && !selectedProduct;

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const handleAddToCart = async (product: Product) => {
    if (!product.available || product.stock <= 0) {
      return;
    }

    if (!hasBusinessProfile || isProfileLoading) {
      setSelectedProductId(null);
      setIsCartOpen(false);
      setActiveTab('Cuenta');
      return;
    }

    try {
      const nextItems = await addProductToCart(product.id, 1, accessToken);
      setCartItems(nextItems);
    } catch {
      return;
    }

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
  };

  const handleBackToCatalog = () => {
    setSelectedProductId(null);
    setIsCartOpen(false);
  };

  const handleOpenCart = () => {
    if (!hasBusinessProfile) {
      setSelectedProductId(null);
      setIsCartOpen(false);
      setActiveTab('Cuenta');
      return;
    }

    setActiveTab('Inicio');
    setSelectedProductId(null);
    setIsCartOpen(true);
  };

  const handleRefreshCatalog = () => {
    setCatalogRequestKey((current) => current + 1);
  };

  const handleChangeCartQuantity = async (productId: string, quantity: number) => {
    const currentItem = cartItems.find((item) => item.product.id === productId);

    if (!hasBusinessProfile || isProfileLoading) {
      setActiveTab('Cuenta');
      setIsCartOpen(false);
      return;
    }

    if (currentItem?.id) {
      try {
        const nextItems =
          quantity <= 0
            ? await removeCartItem(currentItem.id, accessToken)
            : await updateCartItemQuantity(currentItem.id, quantity, accessToken);

        setCartItems(nextItems);
      } catch {
        return;
      }

      return;
    }
  };

  const handleSelectTab = (tab: TabKey) => {
    if (!hasBusinessProfile && (tab === 'Vender' || tab === 'Pedidos')) {
      setActiveTab('Cuenta');
      setIsCartOpen(false);
      setSelectedProductId(null);
      return;
    }

    setActiveTab(tab);
    setIsCartOpen(false);
    setSelectedProductId(null);
  };

  const handleRemoveCartItem = (productId: string) => {
    handleChangeCartQuantity(productId, 0);
  };

  const handleCheckout = async () => {
    if (!accessToken || cartItems.length === 0) {
      if (!accessToken) {
        setActiveTab('Cuenta');
        setIsCartOpen(false);
      }

      return;
    }

    try {
      await createOrderFromCart(accessToken);
      setCartItems([]);
      setActiveTab('Pedidos');
      setIsCartOpen(false);
    } catch {
      return;
    }
  };

  useEffect(() => {
    activeIconBuild.setValue(0);
    Animated.sequence([
      Animated.timing(activeIconBuild, {
        toValue: 0.58,
        duration: 85,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
      Animated.spring(activeIconBuild, {
        toValue: 1,
        damping: 8,
        mass: 0.5,
        stiffness: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIconBuild, activeTab]);

  useEffect(() => {
    if (navItemWidth <= 0) {
      return;
    }

    activeDotJump.setValue(0);

    Animated.parallel([
      Animated.spring(activeDotX, {
        toValue:
          bottomNavHorizontalPadding +
          visibleActiveIndex * navItemWidth +
          navItemWidth / 2 -
          bottomNavDotSize / 2,
        damping: 18,
        mass: 0.65,
        stiffness: 230,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(activeDotJump, {
          toValue: 0.52,
          duration: 115,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          useNativeDriver: true,
        }),
        Animated.spring(activeDotJump, {
          toValue: 1,
          damping: 9,
          mass: 0.48,
          stiffness: 270,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [activeDotJump, activeDotX, navItemWidth, visibleActiveIndex]);

  const handleNavLayout = (event: LayoutChangeEvent) => {
    setNavWidth(event.nativeEvent.layout.width);
  };

  useEffect(() => {
    const transitionDirection = visibleActiveIndex >= previousActiveIndex.current ? 1 : -1;

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
      previousActiveIndex.current = visibleActiveIndex;
    });
  }, [screenOpacity, screenScale, screenTransitionKey, screenTranslateX, screenTranslateY, visibleActiveIndex]);

  useEffect(() => {
    if (shouldShowHeader) {
      isHeaderVisible.current = true;
      lastProductScrollY.current = 0;
      headerVisibility.setValue(1);
    }
  }, [headerVisibility, shouldShowHeader]);

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
          isAuthenticated={hasBusinessProfile}
          items={cartItems}
          shipping={4.99}
          onBackToCatalog={handleBackToCatalog}
          onChangeQuantity={handleChangeCartQuantity}
          onCheckout={handleCheckout}
          onRemoveItem={handleRemoveCartItem}
        />
      );
    }

    switch (activeTab) {
      case 'Inicio':
        return (
          <HomeScreen
            activeFilter={activeFilter}
            filteredProducts={filteredProducts}
            filters={categoryFilters}
            isLoading={isCatalogLoading}
            isRefreshing={isCatalogRefreshing}
            lastSyncAt={lastCatalogSync}
            productsCount={marketplaceProducts.length}
            search={search}
            selectedProduct={selectedProduct}
            isAuthenticated={hasBusinessProfile}
            onAddToCart={handleAddToCart}
            onBackToCatalog={handleBackToCatalog}
            onChangeFilter={setActiveFilter}
            onChangeSearch={setSearch}
            onRefreshCatalog={handleRefreshCatalog}
            onSelectProduct={handleSelectProduct}
          />
        );
      case 'Vender':
        return (
          <SellScreen
            accessToken={accessToken}
            profile={profile}
            isProfileLoading={isProfileLoading}
            onGoToAccount={() => setActiveTab('Cuenta')}
            onProfileChange={setProfile}
          />
        );
      case 'Pedidos':
        return <OrdersScreen accessToken={hasBusinessProfile ? accessToken : null} />;
      case 'Cuenta':
        return (
          <AccountScreen
            accessToken={accessToken}
            profile={profile}
            profileError={profileError}
            isProfileLoading={isProfileLoading}
            onExplore={() => setActiveTab('Inicio')}
            onProfileChange={setProfile}
            onRetryProfile={() => setProfileRefreshKey((current) => current + 1)}
            onSell={() => setActiveTab('Vender')}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={[styles.appShell, isProductPresentation && styles.appShellProduct]}>
        <AmbientBackground />
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
            {hasBusinessProfile && (
              <Animated.View style={{ transform: [{ scale: cartPulse }] }}>
                <Pressable
                  accessibilityLabel="Abrir carrito"
                  style={({ pressed }) => [styles.cartBadge, pressed && styles.cartBadgePressed]}
                  onPress={handleOpenCart}
                >
                  <Ionicons name="bag-handle-outline" size={19} color={colors.surface} />
                  {cartCount > 0 && (
                    <View style={styles.cartCountBubble}>
                      <Text style={styles.cartCountText}>{cartCount}</Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        )}

        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scrollLayer}
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
          </Animated.View>
        </Animated.ScrollView>

        <View style={styles.bottomNav}>
          <View style={styles.bottomNavTrack} onLayout={handleNavLayout}>
            {navItemWidth > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.bottomNavMovingDot,
                  {
                    transform: [
                      { translateX: activeDotX },
                      { translateY: activeDotY },
                      { scale: activeDotScale },
                    ],
                  },
                ]}
              />
            )}
            {visibleTabs.map((tab) => {
              const isActive = tab === activeTab;

              return (
                <Pressable
                  key={tab}
                  accessibilityLabel={tab}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }) => [
                    styles.bottomNavItem,
                    pressed && styles.bottomNavItemPressed,
                  ]}
                  onPress={() => handleSelectTab(tab)}
                >
                  {isActive ? (
                    <Animated.View
                      key={tab}
                      style={[
                        styles.bottomNavActiveIcon,
                        { transform: [{ scale: activeIconScale }] },
                      ]}
                    >
                      <Ionicons name={navIcons[tab].active} size={22} color={colors.brandBlue} />
                      <View pointerEvents="none" style={styles.bottomNavSelectionShadow} />
                    </Animated.View>
                  ) : (
                    <Ionicons name={navIcons[tab].inactive} size={22} color={colors.ink} />
                  )}
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    borderBottomWidth: 0,
    shadowColor: colors.primarySoft,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.035,
    shadowRadius: 14,
    elevation: 2,
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
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.8,
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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
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
    borderColor: colors.brandAccent,
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
    paddingBottom: 142,
  },
  scrollLayer: {
    zIndex: 1,
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
    left: 28,
    right: 28,
    bottom: 4,
    height: 86,
    justifyContent: 'flex-end',
    zIndex: 20,
  },
  bottomNavTrack: {
    height: 78,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
    backgroundColor: colors.surface,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: colors.brandBlueSoft,
    paddingHorizontal: bottomNavHorizontalPadding,
    shadowColor: colors.primarySoft,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 12,
  },
  bottomNavActiveIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  bottomNavMovingDot: {
    position: 'absolute',
    left: 0,
    top: -4,
    width: bottomNavDotSize,
    height: bottomNavDotSize,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlue,
    shadowColor: colors.brandAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 5,
  },
  bottomNavSelectionShadow: {
    position: 'absolute',
    bottom: 5,
    width: 25,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.brandAccent,
    opacity: 0.09,
    shadowColor: colors.brandAccent,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 1,
    zIndex: -1,
  },
  bottomNavItem: {
    flex: 1,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    transform: [{ scale: 1 }],
    zIndex: 4,
  },
  bottomNavItemPressed: {
    transform: [{ scale: 0.95 }],
  },
});
