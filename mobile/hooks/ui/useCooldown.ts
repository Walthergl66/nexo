import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cuenta regresiva para deshabilitar una accion durante N segundos.
 *
 * Se usa para reflejar en la UI el rechazo del servidor: cuando Supabase o la
 * API responden 429, se llama a `start(segundos)` y el boton queda bloqueado con
 * una cuenta regresiva hasta que expira. NO inventa su propio bloqueo a partir
 * de intentos fallidos; solo espeja lo que el servidor ya esta rechazando, que
 * es lo unico que un cliente puede hacer con honestidad (ver useLoginAttempts).
 */
export function useCooldown() {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const deadline = useRef<number | null>(null);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }

    deadline.current = null;
    setRemainingSeconds(0);
  }, []);

  const start = useCallback((seconds: number) => {
    const whole = Math.ceil(seconds);

    if (whole <= 0) {
      clear();
      return;
    }

    deadline.current = Date.now() + whole * 1000;
    setRemainingSeconds(whole);

    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
    }

    intervalId.current = setInterval(() => {
      if (deadline.current === null) {
        return;
      }

      const left = Math.ceil((deadline.current - Date.now()) / 1000);

      if (left <= 0) {
        clear();
      } else {
        setRemainingSeconds(left);
      }
    }, 500);
  }, [clear]);

  // Cortar el intervalo si el componente se desmonta a mitad de la espera.
  useEffect(() => clear, [clear]);

  return {
    remainingSeconds,
    isActive: remainingSeconds > 0,
    start,
    clear,
  };
}
