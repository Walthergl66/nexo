import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * Owns the animated value that shows/hides the home header as the catalog
 * scrolls, and exposes the scroll handler that toggles it.
 */
export function useHeaderVisibility(shouldShowHeader: boolean) {
  const headerVisibility = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const isHeaderVisible = useRef(true);
  const lastProductScrollY = useRef(0);

  const headerTranslateY = headerVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [-94, 0],
    extrapolate: 'clamp',
  });

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

    scrollY.setValue(nextY);

    if (nextY <= 10) {
      animateHeader(true);
    } else if (delta > scrollThreshold) {
      animateHeader(false);
    } else if (delta < -scrollThreshold) {
      animateHeader(true);
    }

    lastProductScrollY.current = nextY;
  };

  return {
    headerVisibility,
    headerTranslateY,
    scrollY,
    handleProductScroll,
  };
}
