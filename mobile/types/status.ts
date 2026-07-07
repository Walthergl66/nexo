export type StatusTone = 'success' | 'error' | 'info' | 'warning';

export type StatusMessage = {
  text: string;
  tone: StatusTone;
};

export type ConfirmActionRequest = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  title: string;
  tone?: 'default' | 'danger';
  onConfirm: () => Promise<void> | void;
};
