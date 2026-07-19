import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSheetAnimation } from '../../hooks/ui/useSheetAnimation';
import { alertTones } from '../../theme/alertTones';
import { colors, spacing } from '../../theme/colors';
import type { AlertTone, IoniconName } from '../../types/status';
import { AlertBadge } from './AlertBadge';

export type AlertSheetAction = {
  disabled?: boolean;
  icon?: IoniconName;
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
};

type AlertSheetProps = {
  actions: AlertSheetAction[];
  description?: string;
  /** Permite cerrar tocando el fondo. Desactivar en acciones que exigen respuesta. */
  dismissible?: boolean;
  title: string;
  tone?: AlertTone;
  visible: boolean;
  onRequestClose: () => void;
};

/**
 * Hoja inferior unica para confirmaciones y avisos: roseton, titulo, detalle y
 * botones apilados a ancho completo.
 */
export function AlertSheet({
  actions,
  description,
  dismissible = true,
  title,
  tone = 'info',
  visible,
  onRequestClose,
}: AlertSheetProps) {
  const insets = useSafeAreaInsets();
  const sheet = useSheetAnimation(visible);

  // Quien invoca suele limpiar su estado al cerrar; conservamos el ultimo
  // contenido para que la hoja no se vacie mientras se desliza hacia abajo.
  const lastContent = useRef({ actions, description, title, tone });
  if (visible) {
    lastContent.current = { actions, description, title, tone };
  }
  const content = lastContent.current;

  if (!sheet.mounted) {
    return null;
  }

  return (
    <Modal animationType="none" statusBarTranslucent transparent visible onRequestClose={onRequestClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: sheet.opacity }]}>
          <Pressable
            accessibilityLabel="Cerrar"
            disabled={!dismissible}
            style={StyleSheet.absoluteFill}
            onPress={onRequestClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, spacing.xl),
              opacity: sheet.opacity,
              transform: [{ translateY: sheet.translateY }],
            },
          ]}
        >
          <AlertBadge tone={content.tone} />
          <Text style={styles.title}>{content.title}</Text>
          {content.description ? <Text style={styles.description}>{content.description}</Text> : null}

          <View style={styles.actions}>
            {content.actions.map((action) => (
              <SheetButton key={action.label} action={action} tone={content.tone} />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function SheetButton({ action, tone }: { action: AlertSheetAction; tone: AlertTone }) {
  const isPrimary = action.variant !== 'secondary';
  const isBlocked = Boolean(action.disabled || action.loading);
  const labelColor = isPrimary ? colors.surface : colors.ink;

  return (
    <Pressable
      accessibilityLabel={action.label}
      accessibilityRole="button"
      disabled={isBlocked}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? { backgroundColor: alertTones[tone].primary } : styles.buttonSecondary,
        pressed && styles.buttonPressed,
        isBlocked && styles.buttonBlocked,
      ]}
      onPress={action.onPress}
    >
      {action.loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <>
          {action.icon ? <Ionicons color={labelColor} name={action.icon} size={17} /> : null}
          <Text style={[styles.buttonLabel, { color: labelColor }]}>{action.label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(5, 21, 39, 0.45)',
  },
  sheet: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 520,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  title: {
    marginTop: 20,
    color: colors.ink,
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 31,
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    maxWidth: 300,
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    marginTop: 26,
    gap: 10,
  },
  button: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceSoft,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  buttonBlocked: {
    opacity: 0.7,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});
