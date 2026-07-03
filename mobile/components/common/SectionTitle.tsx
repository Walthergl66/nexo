import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type SectionTitleProps = {
  title: string;
  subtitle: string;
};

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 20,
  },
});
