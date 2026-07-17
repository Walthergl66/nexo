import type { ItemFulfillmentStatus } from '../types/marketplace';

/** The forward-only stages a paid item walks through, in order. */
export const FULFILLMENT_STEPS: ItemFulfillmentStatus[] = ['processing', 'packed', 'shipped', 'delivered'];

export const FULFILLMENT_LABELS: Record<ItemFulfillmentStatus, string> = {
  pending: 'Pendiente de pago',
  processing: 'Procesando',
  packed: 'Empacado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

/** Verb shown on the seller's "advance" button for the given next status. */
export const FULFILLMENT_ACTION_LABELS: Record<ItemFulfillmentStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesar',
  packed: 'Empacar',
  shipped: 'Enviar',
  delivered: 'Marcar entregado',
  cancelled: 'Cancelar',
};

/** Position of a status within FULFILLMENT_STEPS, or -1 when outside the flow. */
export function fulfillmentStepIndex(status: ItemFulfillmentStatus): number {
  return FULFILLMENT_STEPS.indexOf(status);
}
