import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import type { StatusMessage, StatusTone } from '../../types/status';

type StatusToastProps = {
  status: StatusMessage | null;
};

export function StatusToast({ status }: StatusToastProps) {
  if (!status) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.layer}>
      <Text style={[styles.toast, toneStyles[status.tone]]}>
        {status.text}
      </Text>
    </View>
  );
}

const toneStyles: Record<StatusTone, object> = {
  success: {
    color: '#166534',
    backgroundColor: '#ecfdf3',
    borderColor: '#86efac',
  },
  error: {
    color: '#9f1239',
    backgroundColor: '#fff1f2',
    borderColor: '#fda4af',
  },
  info: {
    color: colors.brandBlue,
    backgroundColor: colors.brandBlueSoft,
    borderColor: colors.brandBlueLine,
  },
  warning: {
    color: '#92400e',
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
  },
};

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 14,
    left: 12,
    right: 12,
    zIndex: 50,
    elevation: 20,
    alignItems: 'flex-end',
  },
  toast: {
    maxWidth: '92%',
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 12,
  },
});
