import type { RegisterValidationContext } from '../types/account';

type RegisterStepValidationContext = Omit<RegisterValidationContext, 'identity'> & {
  identityNationalId: string | null;
  step: 1 | 2 | 3;
};

export function validateRegisterStep({
  form,
  identityNationalId,
  passwordError,
  step,
}: RegisterStepValidationContext): string | null {
  if (step === 1) {
    if (!/^\d{10}$/.test(form.nationalId)) {
      return 'La cedula debe tener exactamente 10 digitos.';
    }

    if (identityNationalId !== form.nationalId) {
      return 'Valida la cedula antes de continuar.';
    }

    if (form.firstName.trim() === '' || form.lastName.trim() === '' || form.age.trim() === '') {
      return 'No pudimos completar los datos de identidad. Valida la cedula nuevamente.';
    }
  }

  if (step === 2) {
    if (form.gender.trim() === '') {
      return 'Selecciona tu genero.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return 'Ingresa un correo valido.';
    }

    if (form.email.trim().toLowerCase() !== form.confirmEmail.trim().toLowerCase()) {
      return 'Los correos no coinciden.';
    }

    if (form.password.length === 0) {
      return 'Ingresa una contraseña.';
    }

    if (passwordError !== null) {
      return passwordError;
    }

    if (form.password !== form.confirmPassword) {
      return 'Las contrasenas no coinciden.';
    }
  }

  if (step === 3) {
    if (form.address.trim().length < 5) {
      return 'Ingresa una direccion valida.';
    }

    if (!/^09\d{8}$/.test(form.phone)) {
      return 'Ingresa un telefono ecuatoriano de 10 digitos que empiece con 09.';
    }
  }

  return null;
}

export function validateRegisterForm({
  form,
  identity,
  passwordError,
}: RegisterValidationContext): string | null {
  if (!/^\d{10}$/.test(form.nationalId)) {
    return 'La cedula debe tener exactamente 10 digitos.';
  }

  if (identity === null || identity.national_id !== form.nationalId) {
    return 'Valida la cedula antes de crear la cuenta.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    return 'Ingresa un correo valido.';
  }

  if (form.email.trim().toLowerCase() !== form.confirmEmail.trim().toLowerCase()) {
    return 'Los correos no coinciden.';
  }

  if (form.gender.trim() === '') {
    return 'Selecciona tu genero.';
  }

  if (form.password.length === 0) {
    return 'Ingresa una contraseña.';
  }

  if (passwordError !== null) {
    return passwordError;
  }

  if (form.password !== form.confirmPassword) {
    return 'Las contrasenas no coinciden.';
  }

  if (form.address.trim().length < 5) {
    return 'Ingresa una direccion valida.';
  }

  if (!/^09\d{8}$/.test(form.phone)) {
    return 'Ingresa un telefono ecuatoriano de 10 digitos que empiece con 09.';
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length === 0) {
    return null;
  }

  if (password.length < 8) {
    return 'La contrasena debe tener minimo 8 caracteres.';
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Usa mayuscula, minuscula, numero y simbolo.';
  }

  return null;
}
