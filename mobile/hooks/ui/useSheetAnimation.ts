import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

const SLIDE_DISTANCE = 320;

/**
 * Lo que tarda la hoja en desmontarse al cerrarse. Se exporta porque quien
 * encadena una hoja tras otra debe esperar este tiempo: en iOS, presentar un
 * Modal mientras otro se esta cerrando puede dejar el segundo sin aparecer.
 */
export const SHEET_EXIT_DURATION = 170;

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
      duration: SHEET_EXIT_DURATION,
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
