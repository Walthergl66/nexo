import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

const dots = Array.from({ length: 12 }, (_, index) => index);

export function AmbientBackground() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.topGlow} />
      <View style={styles.topRing} />
      <View style={styles.topRingInner} />
      <View style={styles.connector}>
        <View style={styles.connectorLine} />
        <View style={[styles.connectorNode, styles.connectorNodeStart]} />
        <View style={[styles.connectorNode, styles.connectorNodeEnd]} />
      </View>
      <View style={styles.dotField}>
        {dots.map((dot) => <View key={dot} style={styles.dot} />)}
      </View>
      <View style={styles.bottomGlow} />
      <View style={styles.bottomRing} />
      <View style={styles.bottomAccent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    right: -150,
    top: 40,
    backgroundColor: colors.accentSoft,
    opacity: 0.72,
  },
  topRing: {
    position: 'absolute',
    width: 174,
    height: 174,
    borderRadius: 87,
    right: -76,
    top: 92,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    opacity: 0.7,
  },
  topRingInner: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    right: -45,
    top: 123,
    borderWidth: 1,
    borderColor: colors.surface,
    opacity: 0.9,
  },
  connector: {
    position: 'absolute',
    width: 146,
    height: 34,
    left: -54,
    top: 355,
    transform: [{ rotate: '-22deg' }],
  },
  connectorLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 16,
    height: 1,
    backgroundColor: colors.brandBlueLine,
  },
  connectorNode: {
    position: 'absolute',
    top: 11,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  connectorNodeStart: {
    left: 0,
  },
  connectorNodeEnd: {
    right: 0,
  },
  dotField: {
    position: 'absolute',
    right: 22,
    top: 510,
    width: 72,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    opacity: 0.48,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.brandBlueMuted,
  },
  bottomGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    left: -155,
    bottom: 35,
    backgroundColor: colors.brandBlueSoft,
    opacity: 0.78,
  },
  bottomRing: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    left: -68,
    bottom: 92,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
  },
  bottomAccent: {
    position: 'absolute',
    width: 64,
    height: 5,
    borderRadius: 3,
    right: 28,
    bottom: 132,
    backgroundColor: colors.brandAccent,
    opacity: 0.16,
    transform: [{ rotate: '-38deg' }],
  },
});
