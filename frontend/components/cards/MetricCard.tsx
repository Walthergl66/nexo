import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../theme/colors';

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.medium,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  label: {
    fontSize: 12,
    color: colors.inkMuted,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    marginVertical: 8,
  },
  detail: {
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 18,
  },
});
