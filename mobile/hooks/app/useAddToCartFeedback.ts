import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

type AddToCartHandler = () => void | Promise<boolean>;

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export function useAddToCartFeedback(
  onAddToCart: AddToCartHandler,
  { holdMs = 1200, onSuccess }: { holdMs?: number; onSuccess?: () => void } = {},
) {
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const run = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    const outcome = onAddToCart();
    const added =
      outcome != null && typeof (outcome as Promise<boolean>).then === 'function'
        ? await outcome
        : false;

    if (!isMounted.current) return;

    setIsLoading(false);

    if (!added) return;

    onSuccessRef.current?.();

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
      if (!isMounted.current) return;
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
  }, [holdMs, isLoading, onAddToCart, progress]);

  return { isAdded, isLoading, progress, run };
}
