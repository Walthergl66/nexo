import type { AlertAction, AlertRequest } from '../../types/status';
import { AlertSheet, type AlertSheetAction } from './AlertSheet';

type AlertSheetHostProps = {
  alert: AlertRequest | null;
  onDismiss: () => void;
};

const DEFAULT_ACTIONS: AlertAction[] = [{ label: 'Aceptar' }];

/**
 * Conecta el estado de useAlertSheet con la hoja: la primera accion es la
 * principal y cualquier pulsacion cierra el aviso.
 */
export function AlertSheetHost({ alert, onDismiss }: AlertSheetHostProps) {
  const source = alert?.actions?.length ? alert.actions : DEFAULT_ACTIONS;

  const actions: AlertSheetAction[] = source.map((action, index) => ({
    icon: action.icon,
    label: action.label,
    variant: index === 0 ? 'primary' : 'secondary',
    onPress: () => {
      onDismiss();
      action.onPress?.();
    },
  }));

  return (
    <AlertSheet
      actions={actions}
      description={alert?.description}
      title={alert?.title ?? ''}
      tone={alert?.tone ?? 'info'}
      visible={alert !== null}
      onRequestClose={onDismiss}
    />
  );
}
