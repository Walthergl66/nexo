import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import type { StatusMessage, StatusTone } from '../../types/status';

type StatusToastProps = {
  status: StatusMessage | null;
};

export function StatusToast({ status }: StatusToastProps) {
  if (!status) {
    return null;
  }

  const hasActions = status.actions && status.actions.length > 0;

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <View style={[styles.bar, toneStyles[status.tone]]}>
        <View style={styles.barRow}>
          <View style={[styles.dot, { backgroundColor: toneDot[status.tone] }]} />
          <Text numberOfLines={2} style={styles.barText}>{status.text}</Text>
        </View>
        {hasActions && (
          <View style={styles.actionsRow}>
            {status.actions!.map((action, i) => (
              <Pressable
                key={i}
                accessibilityLabel={action.label}
                style={({ pressed }) => [
                  styles.actionBtn,
                  i === 0 && styles.actionBtnPrimary,
                  pressed && styles.actionBtnPressed,
                ]}
                onPress={action.onPress}
              >
                <Text style={[styles.actionLabel, i === 0 && styles.actionLabelPrimary]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const toneDot: Record<StatusTone, string> = {
  success: '#22c55e',
  error: '#ef4444',
  info: colors.brandBlue,
  warning: '#f59e0b',
};

const toneStyles: Record<StatusTone, object> = {
  success: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  error: { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  info: { backgroundColor: colors.brandBlueSoft, borderColor: colors.brandBlueLine },
  warning: { backgroundColor: '#fffbeb', borderColor: '#fcd34d' },
};

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    bottom: 104,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 30,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bar: {
    width: '100%',
    flexDirection: 'column',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  barText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  actionBtnPrimary: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue,
  },
  actionBtnPressed: {
    opacity: 0.6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  actionLabelPrimary: {
    color: colors.surface,
  },
});
