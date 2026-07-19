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

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <View style={[styles.toast, toneStyles[status.tone]]}>
        <Text style={styles.toastText}>{status.text}</Text>
        {status.actions && status.actions.length > 0 && (
          <View style={styles.actionsRow}>
            {status.actions.map((action, i) => (
              <Pressable
                key={i}
                accessibilityLabel={action.label}
                style={({ pressed }) => [
                  styles.actionButton,
                  i === 0 && styles.actionButtonPrimary,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={action.onPress}
              >
                <Text
                  style={[
                    styles.actionText,
                    i === 0 && styles.actionTextPrimary,
                  ]}
                >
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

const toneStyles: Record<StatusTone, object> = {
  success: {
    backgroundColor: '#ecfdf3',
    borderColor: '#86efac',
  },
  error: {
    backgroundColor: '#fff1f2',
    borderColor: '#fda4af',
  },
  info: {
    backgroundColor: colors.brandBlueSoft,
    borderColor: colors.brandBlueLine,
  },
  warning: {
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
    minWidth: 220,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 12,
  },
  toastText: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionButtonPrimary: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
  },
  actionTextPrimary: {
    color: colors.surface,
  },
});
