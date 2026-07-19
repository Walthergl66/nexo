import { useCallback, useState } from 'react';
import type { AlertRequest } from '../../types/status';

/**
 * Estado de la hoja de avisos. Sustituye a los toasts en mensajes que piden
 * una decision del usuario (ir al carrito, reintentar, etc.).
 */
export function useAlertSheet() {
  const [alert, setAlert] = useState<AlertRequest | null>(null);

  const showAlert = useCallback((request: AlertRequest) => {
    setAlert(request);
  }, []);

  const dismissAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return { alert, dismissAlert, showAlert };
}
