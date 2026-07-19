import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { alertTones, type AlertTone } from '../../theme/alertTones';

const BADGE_SIZE = 86;
const LOBES = 12;

/**
 * Dibuja el roseton (circulo festoneado tipo "verificado") uniendo puntos de
 * una circunferencia con arcos que sobresalen hacia afuera.
 */
function buildRosettePath(size: number, lobes: number): string {
  // Margen para que los arcos no se recorten contra el borde del viewBox.
  const bulge = 1.16;
  const center = size / 2;
  const radius = center / bulge;
  const arcRadius = radius * 0.3;
  const step = (Math.PI * 2) / lobes;

  const pointAt = (index: number) => {
    const angle = -Math.PI / 2 + index * step;
    return `${(center + radius * Math.cos(angle)).toFixed(2)} ${(center + radius * Math.sin(angle)).toFixed(2)}`;
  };

  let path = `M ${pointAt(0)}`;
  for (let i = 1; i <= lobes; i += 1) {
    path += ` A ${arcRadius.toFixed(2)} ${arcRadius.toFixed(2)} 0 0 1 ${pointAt(i % lobes)}`;
  }

  return `${path} Z`;
}

const rosettePath = buildRosettePath(BADGE_SIZE, LOBES);

type AlertBadgeProps = {
  tone: AlertTone;
};

export function AlertBadge({ tone }: AlertBadgeProps) {
  const palette = alertTones[tone];

  return (
    <View style={styles.wrap}>
      <Svg height={BADGE_SIZE} width={BADGE_SIZE}>
        <Path d={rosettePath} fill={palette.badge} />
      </Svg>
      <View pointerEvents="none" style={styles.iconLayer}>
        <Ionicons color={palette.badgeInk} name={palette.icon} size={38} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
