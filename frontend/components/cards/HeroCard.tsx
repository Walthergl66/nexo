import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../theme/colors';

export function HeroCard() {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.brand}>LANZAMIENTO NEXO</Text>
        <Text style={styles.title}>Sudadera con estampado</Text>
        <Text style={styles.price}>$90 / tallas disponibles</Text>
        <View style={styles.button}>
          <Text style={styles.buttonText}>Comprar ahora</Text>
        </View>
      </View>
      <View style={styles.figure}>
        <View style={styles.head} />
        <View style={styles.body} />
        <View style={styles.leftArm} />
        <View style={styles.rightArm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 230,
    backgroundColor: colors.primary,
    borderRadius: radii.medium,
    padding: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    zIndex: 2,
  },
  brand: {
    color: colors.surfaceSoft,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  title: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '900',
    maxWidth: 170,
  },
  price: {
    color: colors.surfaceSoft,
    fontSize: 12,
    marginTop: 8,
  },
  button: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    width: 92,
    height: 38,
    marginTop: 18,
  },
  buttonText: {
    color: colors.brandBlue,
    fontSize: 12,
    fontWeight: '800',
  },
  figure: {
    width: 128,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  head: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.silver,
    position: 'absolute',
    top: 6,
    zIndex: 3,
  },
  body: {
    width: 86,
    height: 120,
    borderRadius: 34,
    backgroundColor: colors.silverSoft,
    position: 'absolute',
    bottom: 0,
    zIndex: 2,
  },
  leftArm: {
    width: 38,
    height: 104,
    borderRadius: 22,
    backgroundColor: colors.accent,
    position: 'absolute',
    left: 5,
    bottom: 8,
    transform: [{ rotate: '10deg' }],
  },
  rightArm: {
    width: 38,
    height: 104,
    borderRadius: 22,
    backgroundColor: colors.accent,
    position: 'absolute',
    right: 5,
    bottom: 8,
    transform: [{ rotate: '-10deg' }],
  },
});
