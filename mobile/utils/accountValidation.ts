import type { RegisterValidationContext } from '../types/account';

export type PasswordRequirement = {
  label: string;
  met: boolean;
};

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: 'Minimo 8 caracteres', met: password.length >= 8 },
    { label: 'Una letra mayuscula', met: /[A-Z]/.test(password) },
    { label: 'Una letra minuscula', met: /[a-z]/.test(password) },
    { label: 'Un numero', met: /\d/.test(password) },
    { label: 'Un simbolo', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function isRegisterAccountStepValid(form: RegisterValidationContext['form'], passwordError: string | null): boolean {
  const email = form.email.trim().toLowerCase();
  const confirmEmail = form.confirmEmail.trim().toLowerCase();

  return (
    form.gender.trim() !== ''
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && confirmEmail !== ''
    && email === confirmEmail
    && form.password.length > 0
    && passwordError === null
    && form.confirmPassword.length > 0
    && form.password === form.confirmPassword
  );
}

export function isRegisterContactStepValid(form: RegisterValidationContext['form']): boolean {
  return form.address.trim().length >= 5 && /^09\d{8}$/.test(form.phone);
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

  const requirements = getPasswordRequirements(password);

  if (!requirements[0].met) {
    return 'La contrasena debe tener minimo 8 caracteres.';
  }

  if (requirements.some((requirement) => !requirement.met)) {
    return 'Usa mayuscula, minuscula, numero y simbolo.';
  }

  return null;
}
