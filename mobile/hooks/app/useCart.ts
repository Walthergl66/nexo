import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import {
  addProductToCart,
  createOrderFromCart,
  fetchCart,
  removeCartItem,
  updateCartItemQuantity,
  type ProfileResource,
} from '../../services/marketplaceApi';
import type { CartItem, Product } from '../../types/marketplace';
import type { StatusTone } from '../../types/status';

type UseCartParams = {
  accessToken: string | null;
  profile: ProfileResource | null;
  hasBusinessProfile: boolean;
  isProfileLoading: boolean;
  /** Sends the user to the account tab when a business profile is required. */
  onRequireAccount: () => void;
  /** Runs after an order is placed so the app can navigate to orders. */
  onOrderPlaced: () => void;
  onStatusMessage?: (message: string, tone: StatusTone) => void;
};

/**
 * Manages the shopping cart: loading it for the active profile, adding/updating
 * items, checkout, and the header pulse animation played when items are added.
 */
export function useCart({
  accessToken,
  profile,
  hasBusinessProfile,
  isProfileLoading,
  onRequireAccount,
  onOrderPlaced,
  onStatusMessage,
}: UseCartParams) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const cartPulse = useRef(new Animated.Value(1)).current;

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

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const addToCart = useCallback(
    async (product: Product) => {
      if (!product.available || product.stock <= 0) {
        onStatusMessage?.('Este producto no esta disponible.', 'warning');
        return;
      }

      if (!hasBusinessProfile || isProfileLoading) {
        onStatusMessage?.('Inicia sesion para agregar productos al carrito.', 'info');
        onRequireAccount();
        return;
      }

      try {
        const nextItems = await addProductToCart(product.id, 1, accessToken ?? undefined);
        setCartItems(nextItems);
        onStatusMessage?.(`${product.title} agregado al carrito.`, 'success');
      } catch {
        onStatusMessage?.('No pudimos agregar el producto al carrito.', 'error');
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
    },
    [accessToken, cartPulse, hasBusinessProfile, isProfileLoading, onRequireAccount, onStatusMessage],
  );

  const changeQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!hasBusinessProfile || isProfileLoading) {
        onStatusMessage?.('Inicia sesion para modificar tu carrito.', 'info');
        onRequireAccount();
        return;
      }

      const currentItem = cartItems.find((item) => item.product.id === productId);

      if (!currentItem?.id) {
        return;
      }

      try {
        const isRemoving = quantity <= 0;
        const nextItems =
          isRemoving
            ? await removeCartItem(currentItem.id, accessToken ?? undefined)
            : await updateCartItemQuantity(currentItem.id, quantity, accessToken ?? undefined);

        setCartItems(nextItems);
        onStatusMessage?.(
          isRemoving ? 'Producto eliminado del carrito.' : 'Cantidad actualizada.',
          'success',
        );
      } catch {
        onStatusMessage?.('No pudimos actualizar el carrito.', 'error');
        return;
      }
    },
    [accessToken, cartItems, hasBusinessProfile, isProfileLoading, onRequireAccount, onStatusMessage],
  );

  const removeItem = useCallback((productId: string) => changeQuantity(productId, 0), [changeQuantity]);

  const checkout = useCallback(async () => {
    if (!accessToken || cartItems.length === 0) {
      if (!accessToken) {
        onStatusMessage?.('Inicia sesion para continuar con la compra.', 'info');
        onRequireAccount();
      }

      return;
    }

    try {
      await createOrderFromCart(accessToken);
      setCartItems([]);
      onStatusMessage?.('Orden creada correctamente.', 'success');
      onOrderPlaced();
    } catch {
      onStatusMessage?.('No pudimos crear la orden. Intenta nuevamente.', 'error');
      return;
    }
  }, [accessToken, cartItems.length, onOrderPlaced, onRequireAccount, onStatusMessage]);

  return {
    cartItems,
    cartCount,
    cartPulse,
    addToCart,
    changeQuantity,
    removeItem,
    checkout,
  };
}
