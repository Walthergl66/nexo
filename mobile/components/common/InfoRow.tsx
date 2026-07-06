import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type InfoRowProps = {
  label: string;
  value: string;
  emphasize?: boolean;
  inverted?: boolean;
};

export function InfoRow({ label, value, emphasize = false, inverted = false }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, inverted && styles.labelInverted]}>{label}</Text>
      <Text
        style={[
          styles.value,
          inverted && styles.valueInverted,
          emphasize && styles.valueStrong,
          inverted && emphasize && styles.valueStrongInverted,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.inkMuted,
    fontSize: 13,
  },
  labelInverted: {
    color: colors.brandBlueMuted,
  },
  value: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  valueInverted: {
    color: colors.surfaceSoft,
  },
  valueStrong: {
    fontSize: 16,
    fontWeight: '600',
  },
  valueStrongInverted: {
    color: colors.surface,
  },
});
