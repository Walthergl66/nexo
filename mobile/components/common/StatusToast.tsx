import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { alertTones, type AlertTone } from '../../theme/alertTones';
import { colors, shadows } from '../../theme/colors';
import type { StatusMessage, StatusTone } from '../../types/status';

type StatusToastProps = {
  status: StatusMessage | null;
};

/** Los avisos flotantes comparten paleta e iconografia con AlertSheet. */
const toneToAlertTone: Record<StatusTone, AlertTone> = {
  success: 'success',
  error: 'danger',
  info: 'info',
  warning: 'warning',
};

export function StatusToast({ status }: StatusToastProps) {
  if (!status) {
    return null;
  }

  const palette = alertTones[toneToAlertTone[status.tone]];
  const hasActions = status.actions && status.actions.length > 0;

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <View style={styles.bar}>
        <View style={styles.barRow}>
          <View style={[styles.iconWrap, { backgroundColor: palette.badge }]}>
            <Ionicons color={palette.badgeInk} name={palette.icon} size={15} />
          </View>
          <Text numberOfLines={2} style={styles.barText}>{status.text}</Text>
        </View>
        {hasActions && (
          <View style={styles.actionsRow}>
            {status.actions!.map((action, i) => (
              <Pressable
                key={i}
                accessibilityLabel={action.label}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.actionBtn,
                  i === 0 && { backgroundColor: palette.primary },
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...shadows.floating,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 16,
  },
  actionBtnPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  actionLabelPrimary: {
    color: colors.surface,
  },
});
