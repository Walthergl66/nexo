import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type StatusTone = 'success' | 'error' | 'info' | 'warning';

export type AlertTone = 'success' | 'danger' | 'warning' | 'info' | 'question';

export type AlertAction = {
  icon?: IoniconName;
  label: string;
  /** Opcional: la hoja se cierra sola al pulsar cualquier accion. */
  onPress?: () => void;
};

export type AlertRequest = {
  /** Si se omite, se muestra un unico boton "Aceptar". */
  actions?: AlertAction[];
  description?: string;
  title: string;
  tone?: AlertTone;
};

export type StatusAction = {
  label: string;
  onPress: () => void;
};

export type StatusMessage = {
  text: string;
  tone: StatusTone;
  actions?: StatusAction[];
};

export type ConfirmActionRequest = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  title: string;
  tone?: 'default' | 'danger';
  onConfirm: () => Promise<void> | void;
};
