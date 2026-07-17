import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

/** The add-to-cart handler resolves truthy only when the item really landed in the cart. */
type AddToCartHandler = () => void | Promise<boolean>;

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Drives the "just added" confirmation on a buy button: it runs the async add
 * handler and, only when the backend confirms the item was added, plays a short
 * pop + checkmark morph that settles back to the idle label on its own.
 */
export function useAddToCartFeedback(onAddToCart: AddToCartHandler, holdMs = 1200) {
  const [isAdded, setIsAdded] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const run = useCallback(async () => {
    const outcome = onAddToCart();
    const added =
      outcome != null && typeof (outcome as Promise<boolean>).then === 'function'
        ? await outcome
        : false;

    if (!added || !isMounted.current) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsAdded(true);
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 12,
    }).start();

    timeoutRef.current = setTimeout(() => {
      if (!isMounted.current) {
        return;
      }
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: EASE_OUT,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && isMounted.current) {
          setIsAdded(false);
        }
      });
    }, holdMs);
  }, [holdMs, onAddToCart, progress]);

  return { isAdded, progress, run };
}
