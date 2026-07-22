import { useCallback, useRef, useState } from 'react';

/** Fallos seguidos tras los cuales se sugiere recuperar la contrasena. */
const FAILURES_BEFORE_HINT = 3;

/**
 * Cuenta intentos de login fallidos consecutivos para ofrecer la recuperacion
 * de contrasena a tiempo, en vez de dejar que la persona siga adivinando hasta
 * que Supabase la bloquee.
 *
 * A proposito NO bloquea ni guarda nada en el dispositivo. El bloqueo real lo
 * aplica Supabase, que es donde se verifica la contrasena; un contador guardado
 * aqui se saltaria reinstalando la app o llamando a Supabase directo con la
 * anon key (que viaja dentro del bundle), asi que no protegeria de nadie. Lo
 * unico que lograria es dejar fuera al usuario legitimo que acierta al sexto
 * intento.
 */
export function useLoginAttempts() {
  const [shouldSuggestRecovery, setShouldSuggestRecovery] = useState(false);
  const consecutiveFailures = useRef(0);

  const registerFailure = useCallback(() => {
    consecutiveFailures.current += 1;

    if (consecutiveFailures.current >= FAILURES_BEFORE_HINT) {
      setShouldSuggestRecovery(true);
    }
  }, []);

  const reset = useCallback(() => {
    consecutiveFailures.current = 0;
    setShouldSuggestRecovery(false);
  }, []);

  return { shouldSuggestRecovery, registerFailure, reset };
}
