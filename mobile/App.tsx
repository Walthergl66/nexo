import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { FavoritesProvider } from './context/FavoritesContext';
import { AmbientBackground } from './components/common/AmbientBackground';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { StatusToast } from './components/common/StatusToast';
import { AppHeader } from './components/navigation/AppHeader';
import { BottomNav } from './components/navigation/BottomNav';
import { tabs } from './constants/navigation';
import { AccountScreen } from './app/account/AccountScreen';
import { CartScreen } from './app/cart/CartScreen';
import { HomeScreen } from './app/home/HomeScreen';
import { NotificationsScreen } from './app/notifications/NotificationsScreen';
import { SellScreen } from './app/sell/SellScreen';
import { AdminVerificationPanel } from './components/admin/AdminVerificationPanel';
import { useAuthSession } from './hooks/app/useAuthSession';
import { useCart } from './hooks/app/useCart';
import { useNotifications } from './hooks/app/useNotifications';
import { usePushNotifications } from './hooks/app/usePushNotifications';
import { useCatalog } from './hooks/app/useCatalog';
import { useProfile } from './hooks/app/useProfile';
import { usePasswordRecoveryDeepLink } from './hooks/app/usePasswordRecoveryDeepLink';
import { useBottomNavAnimations } from './hooks/navigation/useBottomNavAnimations';
import { useHeaderVisibility } from './hooks/navigation/useHeaderVisibility';
import { useScreenTransition } from './hooks/navigation/useScreenTransition';
import { signOut } from './services/authService';
import { colors } from './theme/colors';
import type { Product, TabKey } from './types/marketplace';
import type { ConfirmActionRequest, StatusMessage, StatusTone } from './types/status';
import { formatPrice } from './utils/format';

function AppShell() {
  const [activeTab, setActiveTab] = useState<TabKey>('Inicio');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [ordersFocusSignal, setOrdersFocusSignal] = useState(0);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionRequest | null>(null);
  const [isConfirmResolving, setIsConfirmResolving] = useState(false);
  const [statusToast, setStatusToast] = useState<StatusMessage | null>(null);
  const [passwordResetKey, setPasswordResetKey] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleTokenChange = useCallback(() => {
    setSelectedProductId(null);
    setIsCartOpen(false);
    setIsNotificationsOpen(false);
  }, []);

  const { accessToken, isSessionReady, setAccessToken } = useAuthSession(handleTokenChange);

  const handleUnauthorized = useCallback(async () => {
    try {
      await signOut();
    } catch {
      return;
    }

    setAccessToken(null);
  }, [setAccessToken]);

  const {
    profile,
    isProfileLoading,
    profileError,
    onProfileChange,
    retryProfile,
    clearProfileError,
  } = useProfile({ accessToken, onUnauthorized: handleUnauthorized });

  const isAuthenticated = accessToken !== null;
  const hasBusinessProfile = isAuthenticated && profile !== null;

  const catalog = useCatalog({ accessToken, profile, profileError, isSessionReady, activeTab });

  const goToAccount = useCallback(() => {
    setSelectedProductId(null);
    setIsCartOpen(false);
    setActiveTab('Cuenta');
  }, []);

  // Los pedidos viven dentro de la pestaña Cuenta: al crear una orden llevamos
  // al usuario a su perfil y activamos la seccion de pedidos con esta senal.
  const goToOrders = useCallback(() => {
    setIsCartOpen(false);
    setSelectedProductId(null);
    setActiveTab('Cuenta');
    setOrdersFocusSignal((current) => current + 1);
  }, []);

  const handleStatusMessage = useCallback((text: string, tone: StatusTone) => {
    setStatusToast({ text, tone });
  }, []);

  const cart = useCart({
    accessToken,
    profile,
    hasBusinessProfile,
    isProfileLoading,
    onRequireAccount: goToAccount,
    onOrderPlaced: goToOrders,
    onStatusMessage: handleStatusMessage,
  });

  const notificationsState = useNotifications({
    accessToken,
    isEnabled: hasBusinessProfile,
  });

  usePushNotifications({
    accessToken,
    isEnabled: hasBusinessProfile,
    onNotificationReceived: notificationsState.refresh,
  });

  const handlePasswordRecovery = useCallback(
    (bumpResetKey: boolean) => {
      setActiveTab('Cuenta');
      setIsCartOpen(false);
      setSelectedProductId(null);
      clearProfileError();

      if (bumpResetKey) {
        setPasswordResetKey((current) => current + 1);
      }
    },
    [clearProfileError],
  );

  usePasswordRecoveryDeepLink(handlePasswordRecovery);

  useEffect(() => {
    if (statusToast === null) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setStatusToast(null);
    }, 4200);

    return () => clearTimeout(timeoutId);
  }, [statusToast]);

  const handleClearStatusMessage = useCallback(() => {
    setStatusToast(null);
  }, []);

  const requestConfirmation = useCallback((action: ConfirmActionRequest) => {
    setConfirmAction(action);
  }, []);

  const handleCancelConfirmation = useCallback(() => {
    if (!isConfirmResolving) {
      setConfirmAction(null);
    }
  }, [isConfirmResolving]);

  const handleConfirmAction = useCallback(async () => {
    if (!confirmAction) {
      return;
    }

    setIsConfirmResolving(true);

    try {
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } finally {
      setIsConfirmResolving(false);
    }
  }, [confirmAction]);

  const visibleTabs = useMemo<TabKey[]>(() => {
    if (!hasBusinessProfile) {
      return ['Inicio', 'Cuenta'];
    }

    if (profile?.role === 'admin') {
      return ['Inicio', 'Admin', 'Cuenta'];
    }

    return tabs;
  }, [hasBusinessProfile, profile?.role]);
  const visibleActiveIndex = Math.max(0, visibleTabs.indexOf(activeTab));

  const selectedProduct = useMemo(
    () => catalog.products.find((product) => product.id === selectedProductId) ?? null,
    [catalog.products, selectedProductId],
  );

  const isProductPresentation = activeTab === 'Inicio';
  const screenTransitionKey = `${activeTab}-${isNotificationsOpen ? 'notificaciones' : isCartOpen ? 'carrito' : selectedProductId ?? 'catalogo'}`;
  const shouldShowHeader = activeTab === 'Inicio' && !isCartOpen && !isNotificationsOpen;

  const nav = useBottomNavAnimations({ activeTab, visibleActiveIndex, tabCount: visibleTabs.length });
  const header = useHeaderVisibility(shouldShowHeader);
  const transition = useScreenTransition({
    transitionKey: screenTransitionKey,
    activeIndex: visibleActiveIndex,
    scrollViewRef,
  });

  useEffect(() => {
    if (!hasBusinessProfile && activeTab === 'Vender') {
      setActiveTab('Cuenta');
      setIsCartOpen(false);
      setSelectedProductId(null);
    }
  }, [activeTab, hasBusinessProfile]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setIsCartOpen(false);
  };

  // Abrir el detalle de un producto desde la pestaña Cuenta (p. ej. Favoritos).
  const handleOpenProductFromAccount = (product: Product) => {
    setActiveTab('Inicio');
    setIsCartOpen(false);
    setIsNotificationsOpen(false);
    setSelectedProductId(product.id);
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
    setIsNotificationsOpen(false);
    setIsCartOpen(true);
  };

  const handleOpenNotifications = () => {
    setActiveTab('Inicio');
    setSelectedProductId(null);
    setIsCartOpen(false);
    setIsNotificationsOpen(true);
    notificationsState.refresh();
  };

  const handleCloseNotifications = () => {
    setIsNotificationsOpen(false);
  };

  const handleRefreshCatalog = () => {
    catalog.refreshCatalog();
  };

  const handleChangeCartQuantity = (productId: string, quantity: number) => {
    if (quantity > 0) {
      cart.changeQuantity(productId, quantity);
      return;
    }

    const item = cart.cartItems.find((cartItem) => cartItem.product.id === productId);
    requestConfirmation({
      title: 'Eliminar producto',
      description: `Quieres eliminar ${item?.product.title ?? 'este producto'} del carrito?`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      onConfirm: () => cart.removeItem(productId),
    });
  };

  const handleCheckout = () => {
    if (cart.cartItems.length === 0) {
      return;
    }

    requestConfirmation({
      title: 'Confirmar compra',
      description: `Se creara tu orden por ${formatPrice(cart.cartSummary.total)} (envio incluido) y confirmaremos el pago. Deseas continuar?`,
      confirmLabel: 'Pagar',
      cancelLabel: 'Cancelar',
      onConfirm: () => cart.checkout(),
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    const item = cart.cartItems.find((cartItem) => cartItem.product.id === productId);
    requestConfirmation({
      title: 'Eliminar producto',
      description: `Quieres eliminar ${item?.product.title ?? 'este producto'} del carrito?`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      onConfirm: () => cart.removeItem(productId),
    });
  };

  const handleSelectTab = (tab: TabKey) => {
    setIsNotificationsOpen(false);

    if (!hasBusinessProfile && tab === 'Vender') {
      setActiveTab('Cuenta');
      setIsCartOpen(false);
      setSelectedProductId(null);
      return;
    }

    setActiveTab(tab);
    setIsCartOpen(false);
    setSelectedProductId(null);

    if (tab === 'Inicio') {
      catalog.refreshCatalog();
    }
  };

  const renderActiveScreen = () => {
    if (isNotificationsOpen) {
      return (
        <NotificationsScreen
          notifications={notificationsState.notifications}
          unreadCount={notificationsState.unreadCount}
          onBack={handleCloseNotifications}
          onMarkRead={notificationsState.markRead}
          onMarkAllRead={notificationsState.markAllRead}
        />
      );
    }

    if (isCartOpen) {
      return (
        <CartScreen
          isAuthenticated={hasBusinessProfile}
          items={cart.cartItems}
          summary={cart.cartSummary}
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
            activeFilter={catalog.activeFilter}
            filteredProducts={catalog.filteredProducts}
            filters={catalog.filters}
            isLoading={catalog.isLoading}
            isRefreshing={catalog.isRefreshing}
            lastSyncAt={catalog.lastSyncAt}
            productsCount={catalog.products.length}
            search={catalog.search}
            selectedProduct={selectedProduct}
            isAuthenticated={hasBusinessProfile}
            myProfileId={profile?.id ?? null}
            accessToken={accessToken}
            onAddToCart={cart.addToCart}
            onBackToCatalog={handleBackToCatalog}
            onChangeFilter={catalog.setActiveFilter}
            onChangeSearch={catalog.setSearch}
            onRefreshCatalog={handleRefreshCatalog}
            onSelectProduct={handleSelectProduct}
            onStatusMessage={handleStatusMessage}
          />
        );
      case 'Vender':
        return (
          <SellScreen
            accessToken={accessToken}
            profile={profile}
            isProfileLoading={isProfileLoading}
            onExploreProducts={() => setActiveTab('Inicio')}
            onGoToAccount={() => setActiveTab('Cuenta')}
            onProfileChange={onProfileChange}
            onStatusMessage={handleStatusMessage}
          />
        );
      case 'Admin':
        return (
          <AdminVerificationPanel
            accessToken={accessToken ?? ''}
            onStatusMessage={handleStatusMessage}
          />
        );
      case 'Cuenta':
        return (
          <AccountScreen
            accessToken={accessToken}
            profile={profile}
            profileError={profileError}
            isProfileLoading={isProfileLoading}
            catalogProducts={catalog.products}
            isAuthenticated={hasBusinessProfile}
            ordersFocusSignal={ordersFocusSignal}
            onClearStatusMessage={handleClearStatusMessage}
            onConfirmAction={requestConfirmation}
            onStatusMessage={handleStatusMessage}
            onExplore={() => setActiveTab('Inicio')}
            onAddToCart={cart.addToCart}
            onOpenProduct={handleOpenProductFromAccount}
            passwordResetKey={passwordResetKey}
            onProfileChange={onProfileChange}
            onRetryProfile={retryProfile}
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
          <AppHeader
            cartCount={cart.cartCount}
            cartPulse={cart.cartPulse}
            headerOpacity={header.headerVisibility}
            headerTranslateY={header.headerTranslateY}
            userName={profile?.first_name ?? profile?.display_name ?? null}
            showCart={hasBusinessProfile}
            onOpenCart={handleOpenCart}
            showNotifications={hasBusinessProfile}
            unreadCount={notificationsState.unreadCount}
            onOpenNotifications={handleOpenNotifications}
          />
        )}

        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scrollLayer}
          contentContainerStyle={[
            styles.content,
            isProductPresentation && styles.productContent,
            shouldShowHeader && styles.contentWithHeader,
          ]}
          onScroll={shouldShowHeader ? header.handleProductScroll : undefined}
          scrollEventThrottle={16}
        >
          <Animated.View
            style={[
              styles.screenTransition,
              {
                opacity: transition.opacity,
                transform: transition.transform,
              },
            ]}
          >
            {renderActiveScreen()}
          </Animated.View>
        </Animated.ScrollView>

        <ConfirmDialog
          action={confirmAction}
          isResolving={isConfirmResolving}
          onCancel={handleCancelConfirmation}
          onConfirm={handleConfirmAction}
        />
        <StatusToast status={statusToast} />

        <BottomNav
          activeDotScale={nav.activeDotScale}
          activeDotX={nav.activeDotX}
          activeDotY={nav.activeDotY}
          activeIconScale={nav.activeIconScale}
          activeIndentLeftRotation={nav.activeIndentLeftRotation}
          activeIndentOpacity={nav.activeIndentOpacity}
          activeIndentRightRotation={nav.activeIndentRightRotation}
          activeIndentScaleX={nav.activeIndentScaleX}
          activeIndentScaleY={nav.activeIndentScaleY}
          activeIndentTipScale={nav.activeIndentTipScale}
          activeIndentX={nav.activeIndentX}
          activeIndentY={nav.activeIndentY}
          activeTab={activeTab}
          navItemWidth={nav.navItemWidth}
          tabs={visibleTabs}
          onLayout={nav.onNavLayout}
          onSelectTab={handleSelectTab}
        />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <AppShell />
      </FavoritesProvider>
    </SafeAreaProvider>
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
  content: {
    paddingHorizontal: 20,
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
    gap: 18,
  },
});
