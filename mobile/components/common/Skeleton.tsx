import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

type SkeletonProps = {
  style?: StyleProp<ViewStyle>;
};

/**
 * A single shimmering placeholder block. A quiet skeleton reads as broken; a
 * subtle looping pulse makes loading feel alive and, by the perceived-speed
 * effect, faster. Uses the native driver (opacity only) so it stays smooth even
 * while the catalog request is settling. Reduced-motion holds it at rest.
 */
export function Skeleton({ style }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled || reduceMotion) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0.5,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    });

    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [pulse]);

  return <Animated.View style={[{ backgroundColor: colors.surfaceSoft, opacity: pulse }, style]} />;
}
