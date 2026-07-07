import { RefObject, useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView } from 'react-native';

type UseScreenTransitionParams = {
  transitionKey: string;
  activeIndex: number;
  scrollViewRef: RefObject<ScrollView | null>;
};

/**
 * Drives the enter animation played whenever the visible screen changes and
 * resets the scroll position. Returns the animated style pieces to spread onto
 * the screen container.
 */
export function useScreenTransition({ transitionKey, activeIndex, scrollViewRef }: UseScreenTransitionParams) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const previousActiveIndex = useRef(0);

  useEffect(() => {
    const transitionDirection = activeIndex >= previousActiveIndex.current ? 1 : -1;

    opacity.setValue(0);
    translateX.setValue(26 * transitionDirection);
    translateY.setValue(8);
    scale.setValue(0.975);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        damping: 18,
        mass: 0.75,
        stiffness: 190,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 17,
        mass: 0.8,
        stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      previousActiveIndex.current = activeIndex;
    });
  }, [activeIndex, opacity, scale, scrollViewRef, transitionKey, translateX, translateY]);

  return {
    opacity,
    transform: [{ translateX }, { translateY }, { scale }],
  };
}
