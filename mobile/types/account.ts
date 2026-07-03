import type { IdentityLookup } from '../services/marketplaceApi';

export type AccountMode = 'login' | 'register' | 'recovery' | 'reset';

export type RegisterForm = {
  nationalId: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  address: string;
  phone: string;
};

export const genderOptions = ['Femenino', 'Masculino', 'Otro', 'Prefiero no decir'] as const;

export const initialRegisterForm: RegisterForm = {
  nationalId: '',
  firstName: '',
  lastName: '',
  age: '',
  gender: '',
  email: '',
  confirmEmail: '',
  password: '',
  confirmPassword: '',
  address: '',
  phone: '',
};

export type RegisterValidationContext = {
  form: RegisterForm;
  identity: IdentityLookup | null;
  passwordError: string | null;
};
