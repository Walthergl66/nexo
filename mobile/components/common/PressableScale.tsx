import { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  /** Scale applied while the element is held. Keep it subtle (0.95–0.98). */
  activeScale?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A Pressable with animated, spring-based press feedback. Swapping a `pressed`
 * style snaps the scale instantly; a spring interpolates and can be interrupted
 * mid-motion, so rapid taps feel smooth and the control feels responsive.
 */
export function PressableScale({
  activeScale = 0.96,
  style,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const spring = useCallback(
    (toValue: number) => {
      Animated.spring(scale, {
        toValue,
        useNativeDriver: true,
        speed: 45,
        bounciness: 0,
      }).start();
    },
    [scale],
  );

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      spring(activeScale);
      onPressIn?.(event);
    },
    [activeScale, onPressIn, spring],
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      spring(1);
      onPressOut?.(event);
    },
    [onPressOut, spring],
  );

  return (
    <AnimatedPressable
      style={[style, { transform: [{ scale }] }]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
