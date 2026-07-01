import { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { AccountModeSwitch } from '../../components/account/AccountModeSwitch';
import { accountStyles as styles } from '../../components/account/accountStyles';
import { AccountUnavailablePanel, ProfileLoadingPanel, ProfileSyncErrorPanel } from '../../components/account/AccountStatusPanels';
import { AuthenticatedAccountPanel } from '../../components/account/AuthenticatedAccountPanel';
import { LoginForm } from '../../components/account/LoginForm';
import { PasswordRecoveryForm } from '../../components/account/PasswordRecoveryForm';
import { RegisterForm } from '../../components/account/RegisterForm';
import { ResetPasswordForm } from '../../components/account/ResetPasswordForm';
import { SectionTitle } from '../../components/common/SectionTitle';
import {
  checkProfileAvailability,
  completeProfile,
  lookupIdentity,
  type IdentityLookup,
  type ProfileResource,
} from '../../services/marketplaceApi';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { sendPasswordResetEmail, signInWithEmail, signOut, signUpWithEmail, updatePassword } from '../../services/authService';
import { initialRegisterForm, type AccountMode, type RegisterForm as RegisterFormState } from '../../types/account';
import { validatePassword, validateRegisterForm } from '../../utils/accountValidation';

type AccountScreenProps = {
  accessToken: string | null;
  profile: ProfileResource | null;
  profileError: string | null;
  isProfileLoading: boolean;
  onExplore: () => void;
  onProfileChange: (profile: ProfileResource | null) => void;
  passwordResetKey: number;
  onRetryProfile: () => void;
  onSell: () => void;
};

export function AccountScreen({
  accessToken,
  profile,
  profileError,
  isProfileLoading,
  onExplore,
  onProfileChange,
  passwordResetKey,
  onRetryProfile,
  onSell,
}: AccountScreenProps) {
  const [mode, setMode] = useState<AccountMode>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirmation, setResetPasswordConfirmation] = useState('');
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [identity, setIdentity] = useState<IdentityLookup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false);
  const [isRegisterPasswordVisible, setIsRegisterPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);
  const [isResetConfirmPasswordVisible, setIsResetConfirmPasswordVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isGuest = accessToken === null;
  const passwordError = useMemo(() => validatePassword(registerForm.password), [registerForm.password]);
  const resetPasswordError = useMemo(() => validatePassword(resetPassword), [resetPassword]);

  useEffect(() => {
    if (passwordResetKey > 0) {
      setMessage(null);
      setMode('reset');
    }
  }, [passwordResetKey]);

  const updateRegisterField = (key: keyof RegisterFormState, value: string) => {
    setRegisterForm((current) => ({ ...current, [key]: value }));

    if (key === 'gender') {
      setIsGenderOpen(false);
    }
  };

  const handleChangeMode = (nextMode: AccountMode) => {
    setIsGenderOpen(false);
    setMessage(null);
    setMode(nextMode);
  };

  const handleOpenPasswordRecovery = () => {
    setRecoveryEmail((current) => current || loginEmail);
    setMessage(null);
    setMode('recovery');
  };

  const handleLookupIdentity = async () => {
    setMessage(null);

    if (!/^\d{10}$/.test(registerForm.nationalId)) {
      setIdentity(null);
      setMessage('La cedula debe tener exactamente 10 digitos.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await lookupIdentity(registerForm.nationalId);
      setIdentity(data);
      setRegisterForm((current) => ({
        ...current,
        nationalId: data.national_id,
        firstName: data.first_name ?? '',
        lastName: data.last_name ?? '',
        age: data.age === null ? '' : String(data.age),
      }));
      setMessage('Cedula validada.');
    } catch (error) {
      setIdentity(null);
      setMessage(error instanceof Error ? error.message : 'No se pudo validar la cedula.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setMessage(null);
    setIsLoading(true);

    try {
      const session = await signInWithEmail(loginEmail, loginPassword);
      setLoginPassword('');
      setMessage(
        session?.access_token
          ? 'Sesion iniciada. Cargando tu cuenta...'
          : 'Credenciales aceptadas. Revisa tu correo si necesitas confirmar tu cuenta.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    setMessage(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
      setMessage('Ingresa un correo valido.');
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(recoveryEmail);
      setMessage('Te enviamos un enlace para recuperar tu contraseña.');
      setMode('login');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo enviar el enlace de recuperacion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setMessage(null);

    if (resetPassword.length === 0) {
      setMessage('Ingresa una nueva contraseña.');
      return;
    }

    if (resetPasswordError !== null) {
      setMessage(resetPasswordError);
      return;
    }

    if (resetPassword !== resetPasswordConfirmation) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(resetPassword);
      await signOut();
      setResetPassword('');
      setResetPasswordConfirmation('');
      onProfileChange(null);
      setMode('login');
      setMessage('Tu contraseña fue actualizada. Ya puedes iniciar sesion.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos actualizar tu contraseña  .');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setMessage(null);
    const validationMessage = validateRegisterForm({ form: registerForm, passwordError, identity });

    if (validationMessage !== null) {
      setMessage(validationMessage);
      return;
    }

    setIsLoading(true);

    try {
      const availability = await checkProfileAvailability(registerForm.email, registerForm.nationalId);

      if (!availability.email_available) {
        setMessage('Ese correo ya esta registrado en nexo.');
        return;
      }

      if (!availability.national_id_available) {
        setMessage('Esa cedula ya esta registrada en nexo.');
        return;
      }

      const session = await signUpWithEmail(registerForm.email, registerForm.password, {
        nationalId: registerForm.nationalId,
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        age: registerForm.age,
        gender: registerForm.gender,
        address: registerForm.address,
        phone: registerForm.phone,
      });

      if (session?.access_token) {
        const nextProfile = await completeProfile(session.access_token, {
          national_id: registerForm.nationalId,
          first_name: registerForm.firstName,
          last_name: registerForm.lastName,
          age: registerForm.age === '' ? null : Number(registerForm.age),
          gender: registerForm.gender || null,
          address: registerForm.address,
          phone: registerForm.phone,
        });
        onProfileChange(nextProfile);
        setMessage('Cuenta creada y perfil completado.');
      } else {
        setMessage('Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesion.');
      }

      setRegisterForm(initialRegisterForm);
      setIdentity(null);
      setIsGenderOpen(false);
      setMode('login');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      await signOut();
      onProfileChange(null);
      setMessage('Sesion cerrada.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cerrar sesion.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <>
        <SectionTitle title="Cuenta" subtitle="Acceso seguro para comprar y vender." />
        <AccountUnavailablePanel />
      </>
    );
  }

  if (mode === 'reset') {
    return (
      <>
        <SectionTitle title="Cuenta" subtitle="Actualiza tu contraseña para volver a entrar." />
        <ResetPasswordForm
          confirmPassword={resetPasswordConfirmation}
          isConfirmPasswordVisible={isResetConfirmPasswordVisible}
          isLoading={isLoading}
          isPasswordVisible={isResetPasswordVisible}
          password={resetPassword}
          passwordError={resetPasswordError}
          onChangeConfirmPassword={setResetPasswordConfirmation}
          onChangePassword={setResetPassword}
          onSubmit={handleResetPassword}
          onToggleConfirmPasswordVisibility={() => setIsResetConfirmPasswordVisible((current) => !current)}
          onTogglePasswordVisibility={() => setIsResetPasswordVisible((current) => !current)}
        />
        {message && <Text style={styles.message}>{message}</Text>}
      </>
    );
  }

  if (!isGuest && profile) {
    return (
      <>
        <SectionTitle title="Cuenta" subtitle="Tus datos y permisos de nexo." />
        <AuthenticatedAccountPanel message={message} profile={profile} onLogout={handleLogout} onSell={onSell} />
      </>
    );
  }

  if (!isGuest && isProfileLoading) {
    return (
      <>
        <SectionTitle title="Cuenta" subtitle="Cargando tu informacion." />
        <ProfileLoadingPanel />
      </>
    );
  }

  if (!isGuest && profileError) {
    return (
      <>
        <SectionTitle title="Cuenta" subtitle="Necesitamos actualizar tus datos." />
        <ProfileSyncErrorPanel error={profileError} isLoading={isProfileLoading} onLogout={handleLogout} onRetry={onRetryProfile} />
      </>
    );
  }

  return (
    <>
      <SectionTitle title="Cuenta" subtitle="Ingresa o crea una cuenta para comprar y vender." />
      {mode !== 'recovery' && <AccountModeSwitch mode={mode} onChangeMode={handleChangeMode} />}
      {mode === 'login' && (
        <LoginForm
          email={loginEmail}
          isLoading={isLoading}
          isPasswordVisible={isLoginPasswordVisible}
          password={loginPassword}
          onChangeEmail={setLoginEmail}
          onChangePassword={setLoginPassword}
          onExplore={onExplore}
          onRecoverPassword={handleOpenPasswordRecovery}
          onSubmit={handleLogin}
          onTogglePasswordVisibility={() => setIsLoginPasswordVisible((current) => !current)}
        />
      )}
      {mode === 'register' && (
        <RegisterForm
          form={registerForm}
          isConfirmPasswordVisible={isConfirmPasswordVisible}
          isGenderOpen={isGenderOpen}
          isLoading={isLoading}
          isPasswordVisible={isRegisterPasswordVisible}
          passwordError={passwordError}
          onChangeField={updateRegisterField}
          onLookupIdentity={handleLookupIdentity}
          onSubmit={handleRegister}
          onToggleConfirmPasswordVisibility={() => setIsConfirmPasswordVisible((current) => !current)}
          onToggleGender={() => setIsGenderOpen((current) => !current)}
          onTogglePasswordVisibility={() => setIsRegisterPasswordVisible((current) => !current)}
        />
      )}
      {mode === 'recovery' && (
        <PasswordRecoveryForm
          email={recoveryEmail}
          isLoading={isLoading}
          onChangeEmail={setRecoveryEmail}
          onSubmit={handlePasswordRecovery}
        />
      )}
      {message && <Text style={styles.message}>{message}</Text>}
    </>
  );
}
