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
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 18,
  },
});
