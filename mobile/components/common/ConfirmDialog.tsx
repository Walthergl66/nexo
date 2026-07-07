import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows } from '../../theme/colors';
import type { ConfirmActionRequest } from '../../types/status';

type ConfirmDialogProps = {
  action: ConfirmActionRequest | null;
  isResolving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ action, isResolving, onCancel, onConfirm }: ConfirmDialogProps) {
  const isDanger = action?.tone === 'danger';

  return (
    <Modal animationType="fade" transparent visible={action !== null} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={[styles.iconWrap, isDanger && styles.iconWrapDanger]}>
            <Ionicons
              name={isDanger ? 'alert-circle-outline' : 'help-circle-outline'}
              size={27}
              color={isDanger ? '#9f1239' : colors.brandBlue}
            />
          </View>
          <Text style={styles.title}>{action?.title}</Text>
          <Text style={styles.description}>{action?.description}</Text>
          <View style={styles.actions}>
            <Pressable
              disabled={isResolving}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed, isResolving && styles.disabled]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>{action?.cancelLabel ?? 'Cancelar'}</Text>
            </Pressable>
            <Pressable
              disabled={isResolving}
              style={({ pressed }) => [
                styles.confirmButton,
                isDanger && styles.confirmButtonDanger,
                pressed && styles.pressed,
                isResolving && styles.disabled,
              ]}
              onPress={onConfirm}
            >
              {isResolving ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.confirmText}>{action?.confirmLabel ?? 'Aceptar'}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 21, 39, 0.38)',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    ...shadows.card,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
  },
  iconWrapDanger: {
    backgroundColor: '#fff1f2',
    borderColor: '#fda4af',
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 25,
  },
  description: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  confirmButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  confirmButtonDanger: {
    backgroundColor: '#9f1239',
  },
  cancelText: {
    color: colors.brandBlue,
    fontSize: 14,
    fontWeight: '800',
  },
  confirmText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.72,
  },
});
