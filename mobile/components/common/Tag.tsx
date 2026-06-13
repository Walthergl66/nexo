import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../theme/colors';
import type { Tone } from '../../types/marketplace';

type TagProps = {
  text: string;
  tone: Tone;
};

export function Tag({ text, tone }: TagProps) {
  const toneStyle =
    tone === 'success' ? styles.tagSuccess : tone === 'warning' ? styles.tagWarning : styles.tagDefault;

  const textStyle =
    tone === 'success'
      ? styles.tagTextSuccess
      : tone === 'warning'
        ? styles.tagTextWarning
        : styles.tagTextDefault;

  return (
    <View style={[styles.tag, toneStyle]}>
      <Text style={[styles.text, textStyle]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagDefault: {
    backgroundColor: colors.surfaceSoft,
  },
  tagSuccess: {
    backgroundColor: colors.success,
  },
  tagWarning: {
    backgroundColor: colors.warning,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
  tagTextDefault: {
    color: colors.ink,
  },
  tagTextSuccess: {
    color: colors.brandBlue,
  },
  tagTextWarning: {
    color: colors.inkMuted,
  },
});
