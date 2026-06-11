import { Platform, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

export function BrandLogo() {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <img
        src="/nexo-logo-simbolo.svg"
        alt="Nexo"
        style={styles.image as unknown as React.CSSProperties}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 7,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
});
