import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

const SLIDE_DISTANCE = 320;
const EXIT_DURATION = 170;

/**
 * Controla la entrada/salida de una hoja inferior. Mantiene el contenido
 * montado mientras dura la animacion de cierre para que no desaparezca de golpe.
 */
export function useSheetAnimation(visible: boolean) {
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(progress, {
        toValue: 1,
        damping: 22,
        stiffness: 240,
        mass: 0.9,
        useNativeDriver: true,
      }).start();
      return;
    }

    const exit = Animated.timing(progress, {
      toValue: 0,
      duration: EXIT_DURATION,
      useNativeDriver: true,
    });

    exit.start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });

    return () => exit.stop();
  }, [progress, visible]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SLIDE_DISTANCE, 0],
  });

  return { mounted, opacity: progress, translateY };
}
