import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SectionTitle } from '../../components/common/SectionTitle';
import { Tag } from '../../components/common/Tag';
import {
  checkProfileAvailability,
  completeProfile,
  lookupIdentity,
  type IdentityLookup,
  type ProfileResource,
} from '../../services/marketplaceApi';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { signInWithEmail, signOut, signUpWithEmail } from '../../services/authService';
import { colors, radii } from '../../theme/colors';

type AccountScreenProps = {
  accessToken: string | null;
  profile: ProfileResource | null;
  isProfileLoading: boolean;
  onExplore: () => void;
  onProfileChange: (profile: ProfileResource | null) => void;
  onSell: () => void;
};

type Mode = 'login' | 'register';

const genderOptions = ['Femenino', 'Masculino', 'Otro', 'Prefiero no decir'] as const;

const initialRegisterForm = {
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

export function AccountScreen({
  accessToken,
  profile,
  isProfileLoading,
  onExplore,
  onProfileChange,
  onSell,
}: AccountScreenProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [identity, setIdentity] = useState<IdentityLookup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false);
  const [isRegisterPasswordVisible, setIsRegisterPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isGuest = accessToken === null;
  const passwordError = useMemo(() => validatePassword(registerForm.password), [registerForm.password]);

  const updateRegisterField = (key: keyof typeof initialRegisterForm, value: string) => {
    setRegisterForm((current) => ({ ...current, [key]: value }));
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
      setMessage('Cédula validada.');
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
      await signInWithEmail(loginEmail, loginPassword);
      setLoginPassword('');
      setMessage('Sesión iniciada.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setMessage(null);
    const validationMessage = validateRegisterForm(registerForm, passwordError, identity);

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
      setMessage('Sesión cerrada.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cerrar sesion.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <>
        <SectionTitle title="Cuenta" subtitle="Configura Supabase para autenticar usuarios." />
        <View style={styles.accountCard}>
          <Text style={styles.accountName}>Supabase no configurado</Text>
          <Text style={styles.accountEmail}>Define EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.</Text>
        </View>
      </>
    );
  }

  if (!isGuest && profile) {
    const canRequestSellerVerification = profile.role === 'buyer' && profile.verification_status !== 'suspended';

    return (
      <>
        <SectionTitle title="Cuenta" subtitle="Datos sincronizados desde Laravel." />
        <View style={styles.accountCard}>
          <Text style={styles.accountName}>{profile.display_name ?? profile.email ?? 'Usuario NEXO'}</Text>
          <Text style={styles.accountEmail}>{profile.email}</Text>
          <View style={styles.accountTags}>
            <Tag text={profile.role} tone="default" />
            <Tag text={profile.verification_status} tone={profile.verification_status === 'approved' ? 'success' : 'warning'} />
          </View>
          {profile.national_id && (
            <View style={styles.dataGrid}>
              <Text style={styles.dataText}>Cédula: {profile.national_id}</Text>
              <Text style={styles.dataText}>Teléfono: {profile.phone ?? 'No registrado'}</Text>
              <Text style={styles.dataText}>Dirección: {profile.address ?? 'No registrada'}</Text>
              <Text style={styles.dataText}>Edad: {profile.age ?? 'No registrada'}</Text>
              <Text style={styles.dataText}>Genero: {profile.gender ?? 'No registrado'}</Text>
            </View>
          )}
          {canRequestSellerVerification && (
            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={onSell}>
              <Ionicons name="shield-checkmark" size={17} color={colors.surface} />
              <Text style={styles.primaryButtonText}>Solicitar validacion para vender</Text>
            </Pressable>
          )}
          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={handleLogout}>
            <Text style={styles.secondaryButtonText}>Cerrar sesion</Text>
          </Pressable>
        </View>
        {message && <Text style={styles.message}>{message}</Text>}
      </>
    );
  }

  if (!isGuest && isProfileLoading) {
    return (
      <>
        <SectionTitle title="Cuenta" subtitle="Sincronizando perfil interno." />
        <View style={styles.accountCard}>
          <ActivityIndicator color={colors.brandBlue} />
          <Text style={styles.accountEmail}>Cargando datos de cuenta desde Laravel.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <SectionTitle title="Cuenta" subtitle="Ingresa o crea una cuenta para comprar y vender." />
      <View style={styles.switchRow}>
        <Pressable
          style={[styles.switchButton, mode === 'login' && styles.switchButtonActive]}
          onPress={() => {
            setIsGenderOpen(false);
            setMode('login');
          }}
        >
          <Text style={[styles.switchText, mode === 'login' && styles.switchTextActive]}>Iniciar sesion</Text>
        </Pressable>
        <Pressable style={[styles.switchButton, mode === 'register' && styles.switchButtonActive]} onPress={() => setMode('register')}>
          <Text style={[styles.switchText, mode === 'register' && styles.switchTextActive]}>Crear cuenta</Text>
        </Pressable>
      </View>

      {mode === 'login' ? (
        <View style={styles.accountCard}>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Correo"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            value={loginEmail}
            onChangeText={setLoginEmail}
          />
          <View style={styles.passwordInputWrap}>
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor={colors.inkSoft}
              secureTextEntry={!isLoginPasswordVisible}
              style={[styles.input, styles.passwordInput]}
              value={loginPassword}
              onChangeText={setLoginPassword}
            />
            <Pressable
              accessibilityLabel={isLoginPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              style={({ pressed }) => [styles.passwordToggle, pressed && styles.buttonPressed]}
              onPress={() => setIsLoginPasswordVisible((current) => !current)}
            >
              <Ionicons name={isLoginPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkMuted} />
            </Pressable>
          </View>
          <Pressable disabled={isLoading} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={handleLogin}>
            {isLoading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
          </Pressable>
          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={onExplore}>
            <Text style={styles.secondaryButtonText}>Seguir explorando</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.accountCard, styles.registerCard]}>
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionKicker}>Identidad</Text>
              <Text style={styles.sectionHint}>Validación por cédula</Text>
            </View>
            <View style={styles.inlineRow}>
              <View style={styles.fieldWrap}>
                <Text style={styles.inputLabel}>Cédula</Text>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholder="10 digitos"
                  placeholderTextColor={colors.inkSoft}
                  style={styles.input}
                  value={registerForm.nationalId}
                  onChangeText={(value) => updateRegisterField('nationalId', value.replace(/\D+/g, '').slice(0, 10))}
                />
              </View>
              <Pressable
                disabled={isLoading}
                style={({ pressed }) => [styles.lookupButton, isLoading && styles.buttonDisabled, pressed && styles.buttonPressed]}
                onPress={handleLookupIdentity}
              >
                <Text style={styles.lookupButtonText}>Validar</Text>
              </Pressable>
            </View>
            <View style={styles.inlineRow}>
              <View style={styles.fieldWrap}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  editable={false}
                  placeholder="Se completa al validar"
                  placeholderTextColor={colors.inkSoft}
                  style={[styles.input, styles.inputDisabled]}
                  value={registerForm.firstName}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={styles.inputLabel}>Apellido</Text>
                <TextInput
                  editable={false}
                  placeholder="Se completa al validar"
                  placeholderTextColor={colors.inkSoft}
                  style={[styles.input, styles.inputDisabled]}
                  value={registerForm.lastName}
                />
              </View>
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.inputLabel}>Edad</Text>
              <TextInput
                editable={false}
                placeholder="Se calcula al validar"
                placeholderTextColor={colors.inkSoft}
                style={[styles.input, styles.inputDisabled]}
                value={registerForm.age}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionKicker}>Datos de cuenta</Text>
              <Text style={styles.sectionHint}>Correo y seguridad</Text>
            </View>
            <View style={[styles.fieldWrap, isGenderOpen && styles.genderFieldOpen]}>
              <Text style={styles.inputLabel}>Genero</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Seleccionar genero"
                style={({ pressed }) => [styles.selectTrigger, pressed && styles.selectTriggerPressed]}
                onPress={() => setIsGenderOpen((current) => !current)}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.selectValue, registerForm.gender === '' && styles.selectPlaceholder]}
                >
                  {registerForm.gender || 'Selecciona una opcion'}
                </Text>
                <Ionicons
                  name={isGenderOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.inkMuted}
                />
              </Pressable>
              {isGenderOpen && (
                <View style={styles.selectOptions}>
                  {genderOptions.map((option) => {
                    const isSelected = registerForm.gender === option;

                    return (
                      <Pressable
                        key={option}
                        style={({ pressed }) => [
                          styles.selectOption,
                          isSelected && styles.selectOptionActive,
                          pressed && styles.selectOptionPressed,
                        ]}
                        onPress={() => {
                          updateRegisterField('gender', option);
                          setIsGenderOpen(false);
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          style={[styles.selectOptionText, isSelected && styles.selectOptionTextActive]}
                        >
                          {option}
                        </Text>
                        {isSelected && <Ionicons name="checkmark" size={17} color={colors.brandBlue} />}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.inputLabel}>Correo</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.inkSoft}
                style={styles.input}
                value={registerForm.email}
                onChangeText={(value) => updateRegisterField('email', value)}
              />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.inputLabel}>Confirmar correo</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Repite tu correo"
                placeholderTextColor={colors.inkSoft}
                style={styles.input}
                value={registerForm.confirmEmail}
                onChangeText={(value) => updateRegisterField('confirmEmail', value)}
              />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={styles.passwordInputWrap}>
                <TextInput
                  placeholder="Minimo 8 caracteres"
                  placeholderTextColor={colors.inkSoft}
                  secureTextEntry={!isRegisterPasswordVisible}
                  style={[styles.input, styles.passwordInput]}
                  value={registerForm.password}
                  onChangeText={(value) => updateRegisterField('password', value)}
                />
                <Pressable
                  accessibilityLabel={isRegisterPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={({ pressed }) => [styles.passwordToggle, pressed && styles.buttonPressed]}
                  onPress={() => setIsRegisterPasswordVisible((current) => !current)}
                >
                  <Ionicons name={isRegisterPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkMuted} />
                </Pressable>
              </View>
              {passwordError && <Text style={styles.validationText}>{passwordError}</Text>}
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.inputLabel}>Confirmar contraseña</Text>
              <View style={styles.passwordInputWrap}>
                <TextInput
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={colors.inkSoft}
                  secureTextEntry={!isConfirmPasswordVisible}
                  style={[styles.input, styles.passwordInput]}
                  value={registerForm.confirmPassword}
                  onChangeText={(value) => updateRegisterField('confirmPassword', value)}
                />
                <Pressable
                  accessibilityLabel={isConfirmPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={({ pressed }) => [styles.passwordToggle, pressed && styles.buttonPressed]}
                  onPress={() => setIsConfirmPasswordVisible((current) => !current)}
                >
                  <Ionicons name={isConfirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkMuted} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionKicker}>Contacto</Text>
              <Text style={styles.sectionHint}>Para entregas y soporte</Text>
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.inputLabel}>Dirección</Text>
              <TextInput
                placeholder="Calle, numero, referencia"
                placeholderTextColor={colors.inkSoft}
                style={styles.input}
                value={registerForm.address}
                onChangeText={(value) => updateRegisterField('address', value)}
              />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="0991234567"
                placeholderTextColor={colors.inkSoft}
                style={styles.input}
                value={registerForm.phone}
                onChangeText={(value) => updateRegisterField('phone', value.replace(/\D+/g, '').slice(0, 10))}
              />
            </View>
          </View>

          <Pressable
            disabled={isLoading}
            style={({ pressed }) => [styles.primaryButton, isLoading && styles.buttonDisabled, pressed && styles.buttonPressed]}
            onPress={handleRegister}
          >
            {isLoading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>Crear cuenta</Text>}
          </Pressable>
        </View>
      )}

      {message && <Text style={styles.message}>{message}</Text>}
    </>
  );
}

function validateRegisterForm(
  form: typeof initialRegisterForm,
  passwordError: string | null,
  identity: IdentityLookup | null,
): string | null {
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
    return 'Las contraseñas no coinciden.';
  }

  if (form.address.trim().length < 5) {
    return 'Ingresa una direccion valida.';
  }

  if (!/^09\d{8}$/.test(form.phone)) {
    return 'Ingresa un telefono ecuatoriano de 10 digitos que empiece con 09.';
  }

  return null;
}

function validatePassword(password: string): string | null {
  if (password.length === 0) {
    return null;
  }

  if (password.length < 8) {
    return 'La contraseña debe tener mínimo 8 caracteres.';
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Usa mayuscula, minuscula, numero y simbolo.';
  }

  return null;
}

const styles = StyleSheet.create({
  accountCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.medium,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  registerCard: {
    gap: 14,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  accountEmail: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  accountTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  dataGrid: {
    gap: 5,
    marginTop: 8,
  },
  dataText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 4,
    marginBottom: 12,
  },
  switchButton: {
    flex: 1,
    height: 38,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButtonActive: {
    backgroundColor: colors.brandBlue,
  },
  switchText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  switchTextActive: {
    color: colors.surface,
  },
  input: {
    minHeight: 44,
    borderRadius: radii.small,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  passwordInputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 46,
  },
  passwordToggle: {
    position: 'absolute',
    right: 2,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
  },
  inputDisabled: {
    backgroundColor: colors.silverSoft,
    color: colors.inkMuted,
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-end',
  },
  fieldWrap: {
    flex: 1,
    minWidth: 132,
    gap: 6,
  },
  genderFieldOpen: {
    minHeight: 238,
  },
  formSection: {
    backgroundColor: colors.surface,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  sectionKicker: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  sectionHint: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  selectTrigger: {
    minHeight: 44,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectTriggerPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  selectValue: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  selectPlaceholder: {
    color: colors.inkSoft,
    fontWeight: '700',
  },
  selectOptions: {
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  selectOption: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectOptionActive: {
    backgroundColor: colors.brandBlueSoft,
  },
  selectOptionPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  selectOptionText: {
    flex: 1,
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  selectOptionTextActive: {
    color: colors.brandBlue,
  },
  lookupButton: {
    width: 88,
    height: 44,
    borderRadius: radii.small,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlue,
  },
  lookupButtonText: {
    color: colors.surface,
    fontWeight: '900',
    fontSize: 12,
  },
  primaryButton: {
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.brandBlue,
    marginTop: 4,
  },
  secondaryButton: {
    height: 42,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    marginTop: 4,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '900',
  },
  secondaryButtonText: {
    color: colors.brandBlue,
    fontWeight: '900',
  },
  message: {
    color: colors.inkMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  validationText: {
    color: '#9f1239',
    fontSize: 11,
    fontWeight: '700',
  },
});
