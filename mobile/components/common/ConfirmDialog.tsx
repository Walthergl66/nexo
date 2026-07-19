import type { ConfirmActionRequest } from '../../types/status';
import { AlertSheet } from './AlertSheet';

type ConfirmDialogProps = {
  action: ConfirmActionRequest | null;
  isResolving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ action, isResolving, onCancel, onConfirm }: ConfirmDialogProps) {
  const isDanger = action?.tone === 'danger';

  return (
    <AlertSheet
      actions={[
        {
          label: action?.confirmLabel ?? 'Aceptar',
          loading: isResolving,
          onPress: onConfirm,
        },
        {
          disabled: isResolving,
          label: action?.cancelLabel ?? 'Cancelar',
          variant: 'secondary',
          onPress: onCancel,
        },
      ]}
      description={action?.description}
      dismissible={!isResolving}
      title={action?.title ?? ''}
      tone={isDanger ? 'danger' : 'question'}
      visible={action !== null}
      onRequestClose={onCancel}
    />
  );
}
