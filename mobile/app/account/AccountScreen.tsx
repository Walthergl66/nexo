import { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccountModeSwitch } from '../../components/account/AccountModeSwitch';
import { accountStyles as styles } from '../../components/account/accountStyles';
import { AccountUnavailablePanel, ProfileLoadingPanel, ProfileSyncErrorPanel } from '../../components/account/AccountStatusPanels';
import { AccountSettingsPanel, AuthenticatedAccountPanel } from '../../components/account/AuthenticatedAccountPanel';
import { LoginForm } from '../../components/account/LoginForm';
import { PasswordRecoveryForm } from '../../components/account/PasswordRecoveryForm';
import { RegisterForm } from '../../components/account/RegisterForm';
import { ResetPasswordForm } from '../../components/account/ResetPasswordForm';
import { SectionTitle } from '../../components/common/SectionTitle';
import {
  checkProfileAvailability,
  completeProfile,
  fetchMyProducts,
  lookupIdentity,
  type IdentityLookup,
  type ProfileResource,
} from '../../services/marketplaceApi';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { sendPasswordResetEmail, signInWithEmail, signOut, signUpWithEmail, updatePassword } from '../../services/authService';
import { deleteProfileAvatar, pickProfileAvatar, uploadProfileAvatar } from '../../services/profileAvatarService';
import { initialRegisterForm, type AccountMode, type RegisterForm as RegisterFormState } from '../../types/account';
import type { Product } from '../../types/marketplace';
import type { ConfirmActionRequest, StatusTone } from '../../types/status';
import { validatePassword, validateRegisterForm } from '../../utils/accountValidation';

type AccountScreenProps = {
  accessToken: string | null;
  profile: ProfileResource | null;
  profileError: string | null;
  isProfileLoading: boolean;
  catalogProducts: Product[];
  isAuthenticated: boolean;
  ordersFocusSignal: number;
  onClearStatusMessage?: () => void;
  onConfirmAction?: (action: ConfirmActionRequest) => void;
  onStatusMessage?: (message: string, tone: StatusTone) => void;
  onExplore: () => void;
  onAddToCart: (product: Product) => void | Promise<boolean>;
  onOpenProduct: (product: Product) => void;
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
  catalogProducts,
  isAuthenticated,
  ordersFocusSignal,
  onClearStatusMessage,
  onConfirmAction,
  onStatusMessage,
  onExplore,
  onAddToCart,
  onOpenProduct,
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
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false);
  const [isRegisterPasswordVisible, setIsRegisterPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);
  const [isResetConfirmPasswordVisible, setIsResetConfirmPasswordVisible] = useState(false);
  const [accountView, setAccountView] = useState<'profile' | 'settings'>('profile');
  const [profileProducts, setProfileProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const hasLoadedProfileProducts = useRef(false);

  const isGuest = accessToken === null;
  const passwordError = useMemo(() => validatePassword(registerForm.password), [registerForm.password]);
  const resetPasswordError = useMemo(() => validatePassword(resetPassword), [resetPassword]);

  const showMessage = (text: string, tone: StatusTone) => {
    onStatusMessage?.(text, tone);
  };

  const clearMessage = () => {
    onClearStatusMessage?.();
  };

  useEffect(() => {
    if (passwordResetKey > 0) {
      clearMessage();
      setMode('reset');
    }
  }, [passwordResetKey]);

  useEffect(() => {
    let isMounted = true;

    if (!accessToken || !profile || profile.role !== 'seller') {
      hasLoadedProfileProducts.current = false;
      setProfileProducts([]);
      setIsLoadingProducts(false);
      return () => {
        isMounted = false;
      };
    }

    const cacheKey = `nexo.profile.products.${profile.id}.v1`;
    hasLoadedProfileProducts.current = false;
    setIsLoadingProducts(true);

    // Pintado instantáneo desde caché mientras la red revalida (stale-while-revalidate).
    AsyncStorage.getItem(cacheKey)
      .then((raw) => {
        if (!isMounted || !raw || hasLoadedProfileProducts.current) {
          return;
        }
        try {
          const cached = JSON.parse(raw) as Product[];
          if (Array.isArray(cached) && cached.length > 0) {
            setProfileProducts(cached);
          }
        } catch {
          // Caché corrupta: se ignora.
        }
      })
      .catch(() => {});

    fetchMyProducts(accessToken)
      .then((products) => {
        if (!isMounted) {
          return;
        }
        setProfileProducts(products);
        hasLoadedProfileProducts.current = true;
        AsyncStorage.setItem(cacheKey, JSON.stringify(products)).catch(() => {});
      })
      .catch(() => {
        // Un fallo puntual no borra lo ya cargado (o lo hidratado de caché).
        if (isMounted && !hasLoadedProfileProducts.current) {
          setProfileProducts([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, profile]);

  const updateRegisterField = (key: keyof RegisterFormState, value: string) => {
    setRegistrationError(null);

    if (key === 'nationalId') {
      setIdentity(null);
      setIdentityError(null);
      setRegisterForm((current) => ({
        ...current,
        nationalId: value,
        firstName: '',
        lastName: '',
        age: '',
      }));
      return;
    }

    setRegisterForm((current) => ({ ...current, [key]: value }));

    if (key === 'gender') {
      setIsGenderOpen(false);
    }
  };

  const handleChangeMode = (nextMode: AccountMode) => {
    setIsGenderOpen(false);
    setIdentityError(null);
    setRegistrationError(null);
    clearMessage();
    setMode(nextMode);
  };

  const handleOpenPasswordRecovery = () => {
    setRecoveryEmail((current) => current || loginEmail);
    clearMessage();
    setMode('recovery');
  };

  const handleLookupIdentity = async () => {
    clearMessage();
    setIdentityError(null);

    if (!/^\d{10}$/.test(registerForm.nationalId)) {
      setIdentity(null);
      setIdentityError('La cedula debe contener 10 digitos.');
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
    } catch (error) {
      setIdentity(null);
      setIdentityError(toIdentityErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    clearMessage();
    setIsLoading(true);

    try {
      const session = await signInWithEmail(loginEmail, loginPassword);
      setLoginPassword('');
      showMessage(
        session?.access_token
          ? 'Sesion iniciada. Cargando tu cuenta...'
          : 'Credenciales aceptadas. Revisa tu correo si necesitas confirmar tu cuenta.',
        'success',
      );
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    clearMessage();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
      showMessage('Ingresa un correo valido.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(recoveryEmail);
      showMessage('Te enviamos un enlace para recuperar tu contraseña.', 'success');
      setMode('login');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'No se pudo enviar el enlace de recuperacion.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    clearMessage();

    if (resetPassword.length === 0) {
      showMessage('Ingresa una nueva contraseña.', 'error');
      return;
    }

    if (resetPasswordError !== null) {
      showMessage(resetPasswordError, 'error');
      return;
    }

    if (resetPassword !== resetPasswordConfirmation) {
      showMessage('Las contraseñas no coinciden.', 'error');
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
      showMessage('Tu contraseña fue actualizada. Ya puedes iniciar sesion.', 'success');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'No pudimos actualizar tu contraseña.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    clearMessage();
    setRegistrationError(null);
    const validationMessage = validateRegisterForm({ form: registerForm, passwordError, identity });

    if (validationMessage !== null) {
      setRegistrationError(validationMessage);
      return;
    }

    setIsLoading(true);

    try {
      const availability = await checkProfileAvailability(registerForm.email, registerForm.nationalId);

      if (!availability.email_available) {
        setRegistrationError('El correo ya se encuentra registrado.');
        return;
      }

      if (!availability.national_id_available) {
        setRegistrationError('La cedula ya se encuentra registrada.');
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
        showMessage('Cuenta creada y perfil completado.', 'success');
      } else {
        showMessage('Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesion.', 'success');
      }

      setRegisterForm(initialRegisterForm);
      setIdentity(null);
      setIdentityError(null);
      setRegistrationError(null);
      setIsGenderOpen(false);
      setMode('login');
    } catch (error) {
      setRegistrationError(toRegistrationErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (onConfirmAction) {
      onConfirmAction({
        title: 'Cerrar sesion',
        description: 'Quieres cerrar tu sesion en nexo?',
        confirmLabel: 'Cerrar sesion',
        cancelLabel: 'Cancelar',
        tone: 'danger',
        onConfirm: performLogout,
      });
      return;
    }

    await performLogout();
  };

  const performLogout = async () => {
    setIsLoading(true);
    clearMessage();

    try {
      await signOut();
      onProfileChange(null);
      showMessage('Sesion cerrada.', 'success');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'No se pudo cerrar sesion.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const persistProfile = async (payload: { address: string; phone: string; avatar_url?: string | null }) => {
    if (!accessToken || !profile) {
      return null;
    }

    const nextProfile = await completeProfile(accessToken, {
      national_id: profile.national_id ?? '',
      first_name: profile.first_name ?? '',
      last_name: profile.last_name ?? '',
      age: profile.age,
      gender: profile.gender,
      address: payload.address,
      phone: payload.phone,
      avatar_url: payload.avatar_url === undefined ? profile.avatar_url : payload.avatar_url,
    });

    onProfileChange(nextProfile);

    return nextProfile;
  };

  const handleUpdateProfile = async ({ address, phone }: { address: string; phone: string }) => {
    setIsSavingProfile(true);
    clearMessage();

    try {
      await persistProfile({ address, phone });
      showMessage('Perfil actualizado.', 'success');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'No pudimos actualizar tu perfil.', 'error');
      throw error;
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangeAvatar = async () => {
    if (!profile) {
      return;
    }

    setIsSavingProfile(true);
    clearMessage();

    try {
      const asset = await pickProfileAvatar();

      if (!asset) {
        return;
      }

      const previousAvatarUrl = profile.avatar_url;
      const avatarUrl = await uploadProfileAvatar(profile.id, asset);
      const nextProfile = await persistProfile({
        address: profile.address ?? '',
        phone: profile.phone ?? '',
        avatar_url: avatarUrl,
      });

      if (nextProfile && previousAvatarUrl && previousAvatarUrl !== avatarUrl) {
        await deleteProfileAvatar(previousAvatarUrl);
      }

      showMessage('Foto de perfil actualizada.', 'success');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'No pudimos actualizar tu foto.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile?.avatar_url) {
      return;
    }

    if (onConfirmAction) {
      onConfirmAction({
        title: 'Eliminar foto',
        description: 'Quieres eliminar tu foto de perfil?',
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar',
        tone: 'danger',
        onConfirm: performDeleteAvatar,
      });
      return;
    }

    await performDeleteAvatar();
  };

  const performDeleteAvatar = async () => {
    if (!profile?.avatar_url) {
      return;
    }

    setIsSavingProfile(true);
    clearMessage();

    try {
      const previousAvatarUrl = profile.avatar_url;
      await persistProfile({
        address: profile.address ?? '',
        phone: profile.phone ?? '',
        avatar_url: null,
      });
      await deleteProfileAvatar(previousAvatarUrl);
      showMessage('Foto de perfil eliminada.', 'success');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'No pudimos eliminar tu foto.', 'error');
    } finally {
      setIsSavingProfile(false);
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
      </>
    );
  }

  if (!isGuest && profile) {
    // ── Usuario autenticado (buyer, seller y admin comparten este flujo) ─────
    if (accountView === 'settings') {
      return (
        <>
          <AccountSettingsPanel
            isSavingProfile={isSavingProfile}
            profile={profile}
            onBack={() => setAccountView('profile')}
            onChangeAvatar={handleChangeAvatar}
            onDeleteAvatar={handleDeleteAvatar}
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
          />
        </>
      );
    }

    return (
      <>
        <AuthenticatedAccountPanel
          isLoggingOut={isLoading}
          products={profileProducts}
          isLoadingProducts={isLoadingProducts}
          profile={profile}
          catalogProducts={catalogProducts}
          isAuthenticated={isAuthenticated}
          ordersFocusSignal={ordersFocusSignal}
          accessToken={accessToken}
          onAddToCart={onAddToCart}
          onOpenProduct={onOpenProduct}
          onStatusMessage={onStatusMessage}
          onLogout={handleLogout}
          onOpenSettings={() => setAccountView('settings')}
          onSell={onSell}
        />
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
      {(mode === 'login' || mode === 'register') && <AccountModeSwitch mode={mode} onChangeMode={handleChangeMode} />}
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
          identity={identity}
          identityError={identityError}
          registrationError={registrationError}
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
          onBackToLogin={() => handleChangeMode('login')}
          onSubmit={handlePasswordRecovery}
        />
      )}
    </>
  );
}

function toIdentityErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('no se encontraron datos')) {
    return 'No se encontraron datos para esta cedula.';
  }

  if (message.includes('no es valida') || message.includes('10 digitos')) {
    return 'Ingresa una cedula valida.';
  }

  return 'No fue posible validar la cedula. Intentalo nuevamente.';
}

function toRegistrationErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('correo') && (message.includes('registrado') || message.includes('registered'))) {
    return 'El correo ya se encuentra registrado.';
  }

  return 'No fue posible crear la cuenta. Revisa los datos e intentalo nuevamente.';
}
