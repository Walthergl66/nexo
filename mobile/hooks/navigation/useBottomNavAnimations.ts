import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent } from 'react-native';
import type { TabKey } from '../../types/marketplace';
import { bottomNavDotSize, bottomNavHorizontalPadding } from '../../components/navigation/navigationStyles';

type UseBottomNavAnimationsParams = {
  activeTab: TabKey;
  visibleActiveIndex: number;
  tabCount: number;
};

/**
 * Encapsulates every animated value that drives the bottom navigation bar:
 * the active-icon pop, the sliding dot, and the elastic "indent" indicator.
 */
export function useBottomNavAnimations({ activeTab, visibleActiveIndex, tabCount }: UseBottomNavAnimationsParams) {
  const [navWidth, setNavWidth] = useState(0);
  const activeIconBuild = useRef(new Animated.Value(1)).current;
  const activeDotX = useRef(new Animated.Value(0)).current;
  const activeDotJump = useRef(new Animated.Value(0)).current;
  const activeIndentX = useRef(new Animated.Value(0)).current;
  const activeIndentBuild = useRef(new Animated.Value(1)).current;
  const hasPositionedNavIndicator = useRef(false);

  const navItemWidth = navWidth > 0 ? (navWidth - bottomNavHorizontalPadding * 2) / tabCount : 0;

  const activeIconScale = activeIconBuild.interpolate({
    inputRange: [0, 0.62, 1],
    outputRange: [0.88, 1.07, 1],
    extrapolate: 'clamp',
  });
  const activeDotY = activeDotJump.interpolate({
    inputRange: [0, 0.52, 1],
    outputRange: [0, -12, 0],
    extrapolate: 'clamp',
  });
  const activeDotScale = activeDotJump.interpolate({
    inputRange: [0, 0.52, 1],
    outputRange: [1, 1.12, 1],
    extrapolate: 'clamp',
  });
  const activeIndentScaleX = activeIndentBuild.interpolate({
    inputRange: [0, 0.24, 0.48, 0.74, 0.9, 1],
    outputRange: [1, 0.82, 0.72, 0.72, 1.1, 1],
    extrapolate: 'clamp',
  });
  const activeIndentScaleY = activeIndentBuild.interpolate({
    inputRange: [0, 0.24, 0.48, 0.74, 0.9, 1],
    outputRange: [1, 0.42, 0.32, 0.32, 1.12, 1],
    extrapolate: 'clamp',
  });
  const activeIndentY = activeIndentBuild.interpolate({
    inputRange: [0, 0.24, 0.48, 0.74, 0.9, 1],
    outputRange: [0, 5, 7, 7, -1, 0],
    extrapolate: 'clamp',
  });
  const activeIndentOpacity = activeIndentBuild.interpolate({
    inputRange: [0, 0.36, 0.48, 0.74, 0.82, 1],
    outputRange: [1, 1, 0, 0, 1, 1],
    extrapolate: 'clamp',
  });
  const activeIndentLeftRotation = activeIndentBuild.interpolate({
    inputRange: [0, 0.24, 0.48, 0.74, 0.9, 1],
    outputRange: ['31deg', '20deg', '15deg', '15deg', '36deg', '31deg'],
    extrapolate: 'clamp',
  });
  const activeIndentRightRotation = activeIndentBuild.interpolate({
    inputRange: [0, 0.24, 0.48, 0.74, 0.9, 1],
    outputRange: ['-31deg', '-20deg', '-15deg', '-15deg', '-36deg', '-31deg'],
    extrapolate: 'clamp',
  });
  const activeIndentTipScale = activeIndentBuild.interpolate({
    inputRange: [0, 0.48, 0.74, 0.9, 1],
    outputRange: [1, 0.65, 0.65, 1.14, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    activeIconBuild.setValue(0);
    Animated.sequence([
      Animated.timing(activeIconBuild, {
        toValue: 0.62,
        duration: 135,
        easing: Easing.bezier(0.32, 0.72, 0, 1),
        useNativeDriver: true,
      }),
      Animated.spring(activeIconBuild, {
        toValue: 1,
        damping: 14,
        mass: 0.62,
        stiffness: 210,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIconBuild, activeTab]);

  useEffect(() => {
    if (navItemWidth <= 0) {
      return;
    }

    const nextIndicatorX =
      bottomNavHorizontalPadding +
      visibleActiveIndex * navItemWidth +
      navItemWidth / 2 -
      bottomNavDotSize / 2;

    if (!hasPositionedNavIndicator.current) {
      activeDotX.setValue(nextIndicatorX);
      activeIndentX.setValue(nextIndicatorX);
      activeDotJump.setValue(1);
      activeIndentBuild.setValue(1);
      hasPositionedNavIndicator.current = true;
      return;
    }

    activeDotJump.setValue(0);
    activeIndentBuild.setValue(0);

    Animated.parallel([
      Animated.spring(activeDotX, {
        toValue: nextIndicatorX,
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
      Animated.sequence([
        Animated.timing(activeIndentBuild, {
          toValue: 0.48,
          duration: 90,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(activeIndentX, {
            toValue: nextIndicatorX,
            duration: 80,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(activeIndentBuild, {
            toValue: 0.74,
            duration: 80,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(activeIndentBuild, {
          toValue: 1,
          damping: 10,
          mass: 0.48,
          stiffness: 260,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [
    activeDotJump,
    activeDotX,
    activeIndentBuild,
    activeIndentX,
    navItemWidth,
    visibleActiveIndex,
  ]);

  const handleNavLayout = (event: LayoutChangeEvent) => {
    setNavWidth(event.nativeEvent.layout.width);
  };

  return {
    navItemWidth,
    onNavLayout: handleNavLayout,
    activeIconScale,
    activeDotX,
    activeDotY,
    activeDotScale,
    activeIndentX,
    activeIndentY,
    activeIndentScaleX,
    activeIndentScaleY,
    activeIndentOpacity,
    activeIndentLeftRotation,
    activeIndentRightRotation,
    activeIndentTipScale,
  };
}
