import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import {
  addProductToCart,
  ApiRequestError,
  createOrderFromCart,
  emptyCartSnapshot,
  fetchCart,
  payOrder,
  removeCartItem,
  updateCartItemQuantity,
  type ProfileResource,
} from '../../services/marketplaceApi';
import type { CartItem, CartSummary, Product } from '../../types/marketplace';
import type { StatusTone } from '../../types/status';

const EMPTY_SUMMARY = emptyCartSnapshot().summary;

/** True when the failure is the backend rejecting the request for lack of stock. */
function isStockError(error: unknown): boolean {
  return error instanceof ApiRequestError && /stock/i.test(error.message);
}

/** Friendly message when the requested amount reaches the product's stock. */
function outOfStockMessage(stock: number): string {
  if (stock <= 0) {
    return 'Este producto se quedo sin stock.';
  }

  if (stock === 1) {
    return 'Ya tienes en el carrito la unica unidad disponible.';
  }

  return `Ya agregaste las ${stock} unidades disponibles.`;
}

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
  const [cartSummary, setCartSummary] = useState<CartSummary>(EMPTY_SUMMARY);
  const cartPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;

    if (!accessToken || !profile) {
      setCartItems([]);
      setCartSummary(EMPTY_SUMMARY);
      return () => {
        isMounted = false;
      };
    }

    fetchCart(accessToken)
      .then((snapshot) => {
        if (isMounted) {
          setCartItems(snapshot.items);
          setCartSummary(snapshot.summary);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCartItems([]);
          setCartSummary(EMPTY_SUMMARY);
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

      const currentQuantity = cartItems.find((item) => item.product.id === product.id)?.quantity ?? 0;

      if (currentQuantity + 1 > product.stock) {
        onStatusMessage?.(outOfStockMessage(product.stock), 'warning');
        return;
      }

      try {
        const snapshot = await addProductToCart(product.id, 1, accessToken ?? undefined);
        setCartItems(snapshot.items);
        setCartSummary(snapshot.summary);
        onStatusMessage?.(`${product.title} agregado al carrito.`, 'success');
      } catch (error) {
        if (isStockError(error)) {
          onStatusMessage?.(outOfStockMessage(product.stock), 'warning');
        } else {
          onStatusMessage?.('No pudimos agregar el producto al carrito.', 'error');
        }
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
    [accessToken, cartItems, cartPulse, hasBusinessProfile, isProfileLoading, onRequireAccount, onStatusMessage],
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

      const isRemoving = quantity <= 0;

      if (!isRemoving && quantity > currentItem.product.stock) {
        onStatusMessage?.(outOfStockMessage(currentItem.product.stock), 'warning');
        return;
      }

      try {
        const snapshot =
          isRemoving
            ? await removeCartItem(currentItem.id, accessToken ?? undefined)
            : await updateCartItemQuantity(currentItem.id, quantity, accessToken ?? undefined);

        setCartItems(snapshot.items);
        setCartSummary(snapshot.summary);
        onStatusMessage?.(
          isRemoving ? 'Producto eliminado del carrito.' : 'Cantidad actualizada.',
          'success',
        );
      } catch (error) {
        if (isStockError(error)) {
          onStatusMessage?.(outOfStockMessage(currentItem.product.stock), 'warning');
        } else {
          onStatusMessage?.('No pudimos actualizar el carrito.', 'error');
        }
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

    let order;

    try {
      order = await createOrderFromCart(accessToken);
    } catch (error) {
      const reason =
        error instanceof ApiRequestError && error.message.trim().length > 0
          ? error.message
          : 'No pudimos crear la orden. Intenta nuevamente.';
      onStatusMessage?.(reason, 'error');
      return;
    }

    // La orden ya vació el carrito en el backend.
    setCartItems([]);
    setCartSummary(EMPTY_SUMMARY);

    try {
      await payOrder(order.id, accessToken);
      onStatusMessage?.('Compra realizada. Tu pago fue confirmado.', 'success');
    } catch {
      onStatusMessage?.(
        'Orden creada, pero el pago quedo pendiente. Puedes reintentarlo desde Pedidos.',
        'warning',
      );
    }

    onOrderPlaced();
  }, [accessToken, cartItems.length, onOrderPlaced, onRequireAccount, onStatusMessage]);

  return {
    cartItems,
    cartSummary,
    cartCount,
    cartPulse,
    addToCart,
    changeQuantity,
    removeItem,
    checkout,
  };
}
