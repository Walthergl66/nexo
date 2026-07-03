import { Platform, StyleSheet, View } from 'react-native';
import { colors, shadows } from '../../theme/colors';

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
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
});
