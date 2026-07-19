import { useEffect, useRef } from 'react';
import { Animated, Platform, Text, View } from 'react-native';
import { accountStyles as styles } from './accountStyles';

type RegisterHeaderProps = {
  step: 1 | 2 | 3;
};

export function RegisterHeader({ step }: RegisterHeaderProps) {
  const progress = useRef(new Animated.Value(step)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: step,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [progress, step]);

  return (
    <View style={styles.registerHeaderBlock}>
      <View style={styles.registerHeaderRow}>
        <Text style={styles.registerHeaderTitle}>Crear cuenta</Text>
        <Text style={styles.registerStepCount}>Paso {step} de 3</Text>
      </View>
      <View accessibilityLabel={`Paso ${step} de 3`} accessibilityRole="progressbar" style={styles.registerProgress}>
        {[1, 2, 3].map((segment) => (
          <View key={segment} style={styles.registerProgressSegment}>
            <Animated.View
              style={[
                styles.registerProgressSegmentFill,
                {
                  opacity: progress.interpolate({
                    inputRange: [segment - 0.25, segment],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
