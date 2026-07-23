const assert = require('node:assert/strict');
const test = require('node:test');
const {
  DEFAULT_AUTH_COOLDOWN_SECONDS,
  GENERIC_AUTH_ERROR,
  buildAuthError,
  toPublicAuthMessage,
} = require('../utils/authErrors.ts');

function supabaseError(message, extra = {}) {
  return Object.assign(new Error(message), extra);
}

test('un 429 de Supabase deja de caer en el mensaje generico', () => {
  const message = toPublicAuthMessage(supabaseError('Request rate limit reached', { status: 429 }));

  assert.notEqual(message, GENERIC_AUTH_ERROR);
  assert.match(message, /Demasiados intentos/);
  assert.match(message, /Recuperar contrasena/);
});

test('reconoce el limite por el codigo de error', () => {
  const message = toPublicAuthMessage(supabaseError('Whatever', { code: 'over_request_rate_limit' }));

  assert.match(message, /Demasiados intentos/);
});

test('muestra la espera en segundos cuando Supabase la informa', () => {
  const message = toPublicAuthMessage(
    supabaseError('For security purposes, you can only request this after 43 seconds.'),
  );

  assert.match(message, /43 segundos/);
});

test('convierte esperas largas a minutos', () => {
  const message = toPublicAuthMessage(
    supabaseError('For security purposes, you can only request this after 900 seconds.'),
  );

  assert.match(message, /15 minutos/);
});

test('la credencial incorrecta no revela si el correo existe', () => {
  const message = toPublicAuthMessage(supabaseError('Invalid login credentials'));

  assert.equal(message, 'Correo o contrasena incorrectos.');
});

test('traduce el correo sin confirmar y el correo ya registrado', () => {
  assert.equal(
    toPublicAuthMessage(supabaseError('Email not confirmed')),
    'Confirma tu correo antes de iniciar sesion.',
  );
  assert.equal(
    toPublicAuthMessage(supabaseError('User already registered')),
    'Ese correo ya esta registrado.',
  );
});

test('cualquier otro error cae en el mensaje generico', () => {
  assert.equal(toPublicAuthMessage(supabaseError('boom')), GENERIC_AUTH_ERROR);
});

test('buildAuthError marca el limite y usa los segundos informados como cooldown', () => {
  const authError = buildAuthError(
    supabaseError('For security purposes, you can only request this after 43 seconds.'),
  );

  assert.equal(authError.isRateLimit, true);
  assert.equal(authError.retryAfterSeconds, 43);
  assert.equal(authError.cooldownSeconds, 43);
  assert.match(authError.message, /43 segundos/);
});

test('buildAuthError cae al cooldown por defecto cuando Supabase no da segundos', () => {
  const authError = buildAuthError(supabaseError('Request rate limit reached', { status: 429 }));

  assert.equal(authError.isRateLimit, true);
  assert.equal(authError.retryAfterSeconds, null);
  assert.equal(authError.cooldownSeconds, DEFAULT_AUTH_COOLDOWN_SECONDS);
});

test('buildAuthError no impone cooldown a una credencial incorrecta', () => {
  const authError = buildAuthError(supabaseError('Invalid login credentials'));

  assert.equal(authError.isRateLimit, false);
  assert.equal(authError.cooldownSeconds, 0);
  assert.equal(authError.message, 'Correo o contrasena incorrectos.');
});

test('AuthError sigue siendo un Error normal', () => {
  const authError = buildAuthError(supabaseError('boom'));

  assert.ok(authError instanceof Error);
  assert.equal(authError.message, GENERIC_AUTH_ERROR);
});
