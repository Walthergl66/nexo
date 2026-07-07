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

type UseCartParams = {
  accessToken: string | null;
  profile: ProfileResource | null;
  hasBusinessProfile: boolean;
  isProfileLoading: boolean;
  /** Sends the user to the account tab when a business profile is required. */
  onRequireAccount: () => void;
  /** Runs after an order is placed so the app can navigate to orders. */
  onOrderPlaced: () => void;
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
        return;
      }

      if (!hasBusinessProfile || isProfileLoading) {
        onRequireAccount();
        return;
      }

      try {
        const nextItems = await addProductToCart(product.id, 1, accessToken ?? undefined);
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
    },
    [accessToken, cartPulse, hasBusinessProfile, isProfileLoading, onRequireAccount],
  );

  const changeQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!hasBusinessProfile || isProfileLoading) {
        onRequireAccount();
        return;
      }

      const currentItem = cartItems.find((item) => item.product.id === productId);

      if (!currentItem?.id) {
        return;
      }

      try {
        const nextItems =
          quantity <= 0
            ? await removeCartItem(currentItem.id, accessToken ?? undefined)
            : await updateCartItemQuantity(currentItem.id, quantity, accessToken ?? undefined);

        setCartItems(nextItems);
      } catch {
        return;
      }
    },
    [accessToken, cartItems, hasBusinessProfile, isProfileLoading, onRequireAccount],
  );

  const removeItem = useCallback((productId: string) => changeQuantity(productId, 0), [changeQuantity]);

  const checkout = useCallback(async () => {
    if (!accessToken || cartItems.length === 0) {
      if (!accessToken) {
        onRequireAccount();
      }

      return;
    }

    try {
      await createOrderFromCart(accessToken);
      setCartItems([]);
      onOrderPlaced();
    } catch {
      return;
    }
  }, [accessToken, cartItems.length, onOrderPlaced, onRequireAccount]);

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
