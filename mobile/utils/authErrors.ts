/**
 * Traduce los errores de Supabase Auth a mensajes que el usuario pueda leer.
 *
 * Vive aparte de services/authService.ts a proposito: aqui no hay ninguna
 * dependencia de React Native ni del cliente de Supabase, asi que se puede
 * probar con `node --test` sin montar el entorno del movil.
 */

export const GENERIC_AUTH_ERROR = 'No pudimos completar la accion. Intenta nuevamente.';

/**
 * Cuando Supabase corta por exceso de intentos pero no dice cuantos segundos
 * faltan, se aplica esta espera. Es un valor de UX, no el bloqueo real: solo
 * mantiene el boton deshabilitado un rato razonable para que la persona no siga
 * apretando contra un 429.
 */
export const DEFAULT_AUTH_COOLDOWN_SECONDS = 30;

/**
 * Error de autenticacion ya traducido, con la informacion de limite que la UI
 * necesita para el cooldown. Es un Error normal, asi que los `error.message` y
 * los `error instanceof Error` de siempre siguen funcionando.
 */
export class AuthError extends Error {
  readonly isRateLimit: boolean;

  /** Segundos a esperar, si Supabase los informa; null si no. */
  readonly retryAfterSeconds: number | null;

  // Campos declarados aparte del constructor a proposito: el modo strip-only con
  // que Node ejecuta los tests no soporta "parameter properties" (readonly en la
  // firma del constructor).
  constructor(message: string, isRateLimit = false, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = 'AuthError';
    this.isRateLimit = isRateLimit;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  /** Cuanto deshabilitar el boton: lo que diga Supabase o el default. */
  get cooldownSeconds(): number {
    if (!this.isRateLimit) {
      return 0;
    }

    return this.retryAfterSeconds ?? DEFAULT_AUTH_COOLDOWN_SECONDS;
  }
}

/**
 * Traduce un error crudo de Supabase a un AuthError listo para mostrar.
 */
export function buildAuthError(error: Error): AuthError {
  const isRateLimit = isRateLimitError(error, error.message.toLowerCase());

  return new AuthError(
    toPublicAuthMessage(error),
    isRateLimit,
    isRateLimit ? extractRetrySeconds(error.message) : null,
  );
}

export function toPublicAuthMessage(error: Error): string {
  const message = error.message.toLowerCase();

  // Va primero porque es el caso que mas confunde: sin esta rama el usuario
  // bloqueado veia el generico "intenta nuevamente", que lo invita a reintentar
  // de inmediato y alarga su propio bloqueo. El limite lo aplica Supabase, no
  // nuestra API: el login va del telefono directo a Supabase Auth.
  if (isRateLimitError(error, message)) {
    return rateLimitMessage(error.message);
  }

  // Mismo mensaje exista o no la cuenta: si dijeramos "ese correo no esta
  // registrado", el login serviria para averiguar quien tiene cuenta en nexo.
  if (message.includes('invalid login credentials')) {
    return 'Correo o contrasena incorrectos.';
  }

  if (message.includes('email not confirmed')) {
    return 'Confirma tu correo antes de iniciar sesion.';
  }

  if (message.includes('already registered') || message.includes('user already registered')) {
    return 'Ese correo ya esta registrado.';
  }

  return GENERIC_AUTH_ERROR;
}

function isRateLimitError(error: Error, lowerCaseMessage: string): boolean {
  const { status, code } = error as { status?: unknown; code?: unknown };

  if (status === 429) {
    return true;
  }

  if (typeof code === 'string' && code.includes('rate_limit')) {
    return true;
  }

  return lowerCaseMessage.includes('rate limit')
    || lowerCaseMessage.includes('too many requests')
    // "For security purposes, you can only request this after N seconds."
    || lowerCaseMessage.includes('for security purposes');
}

/**
 * Supabase a veces dice cuantos segundos faltan; cuando lo hace se muestra el
 * dato en vez de un vago "espera un momento".
 */
function rateLimitMessage(originalMessage: string): string {
  const seconds = extractRetrySeconds(originalMessage);

  if (seconds === null) {
    return 'Demasiados intentos seguidos. Espera unos minutos antes de volver a intentar, o usa "Recuperar contrasena".';
  }

  const wait = seconds < 60
    ? `${seconds} segundos`
    : `${Math.ceil(seconds / 60)} minutos`;

  return `Demasiados intentos seguidos. Puedes volver a intentar en ${wait}, o usa "Recuperar contrasena".`;
}

function extractRetrySeconds(message: string): number | null {
  const match = /after (\d+) seconds?/i.exec(message);

  if (!match) {
    return null;
  }

  const seconds = Number.parseInt(match[1], 10);

  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}
