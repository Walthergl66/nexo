import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SectionTitle } from '../../components/common/SectionTitle';
import { Tag } from '../../components/common/Tag';
import {
  checkProfileAvailability,
  completeProfile,
  fetchProfile,
  lookupIdentity,
  type IdentityLookup,
  type ProfileResource,
} from '../../services/marketplaceApi';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { signInWithEmail, signOut, signUpWithEmail } from '../../services/authService';
import { colors, radii } from '../../theme/colors';

type AccountScreenProps = {
  accessToken: string | null;
  onExplore: () => void;
};

type Mode = 'login' | 'register';

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

export function AccountScreen({ accessToken, onExplore }: AccountScreenProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [profile, setProfile] = useState<ProfileResource | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [identity, setIdentity] = useState<IdentityLookup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isGuest = accessToken === null;
  const passwordError = useMemo(() => validatePassword(registerForm.password), [registerForm.password]);

  useEffect(() => {
    let isMounted = true;

    fetchProfile(accessToken ?? undefined)
      .then((nextProfile) => {
        if (isMounted) {
          setProfile(nextProfile);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProfile(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const updateRegisterField = (key: keyof typeof initialRegisterForm, value: string) => {
    setRegisterForm((current) => ({ ...current, [key]: value }));
  };

  const handleLookupIdentity = async () => {
    setMessage(null);
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
        gender: data.gender ?? '',
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
      await signInWithEmail(loginEmail, loginPassword);
      setLoginPassword('');
      setMessage('Sesion iniciada.');
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
        setProfile(nextProfile);
        setMessage('Cuenta creada y perfil completado.');
      } else {
        setMessage('Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesion.');
      }

      setRegisterForm(initialRegisterForm);
      setIdentity(null);
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
      setProfile(null);
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
        <SectionTitle title="Cuenta" subtitle="Configura Supabase para autenticar usuarios." />
        <View style={styles.accountCard}>
          <Text style={styles.accountName}>Supabase no configurado</Text>
          <Text style={styles.accountEmail}>Define EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.</Text>
        </View>
      </>
    );
  }

  if (!isGuest && profile) {
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
              <Text style={styles.dataText}>Cedula: {profile.national_id}</Text>
              <Text style={styles.dataText}>Telefono: {profile.phone ?? 'No registrado'}</Text>
              <Text style={styles.dataText}>Direccion: {profile.address ?? 'No registrada'}</Text>
              <Text style={styles.dataText}>Edad: {profile.age ?? 'No registrada'}</Text>
              <Text style={styles.dataText}>Genero: {profile.gender ?? 'No registrado'}</Text>
            </View>
          )}
          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={handleLogout}>
            <Text style={styles.secondaryButtonText}>Cerrar sesion</Text>
          </Pressable>
        </View>
        {message && <Text style={styles.message}>{message}</Text>}
      </>
    );
  }

  return (
    <>
      <SectionTitle title="Cuenta" subtitle="Ingresa o crea una cuenta para comprar y vender." />
      <View style={styles.switchRow}>
        <Pressable style={[styles.switchButton, mode === 'login' && styles.switchButtonActive]} onPress={() => setMode('login')}>
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
          <TextInput
            placeholder="Contrasena"
            placeholderTextColor={colors.inkSoft}
            secureTextEntry
            style={styles.input}
            value={loginPassword}
            onChangeText={setLoginPassword}
          />
          <Pressable disabled={isLoading} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={handleLogin}>
            {isLoading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
          </Pressable>
          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={onExplore}>
            <Text style={styles.secondaryButtonText}>Seguir explorando</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.accountCard}>
          <View style={styles.inlineRow}>
            <TextInput
              keyboardType="number-pad"
              placeholder="Cedula"
              placeholderTextColor={colors.inkSoft}
              style={[styles.input, styles.inlineInput]}
              value={registerForm.nationalId}
              onChangeText={(value) => updateRegisterField('nationalId', value)}
            />
            <Pressable disabled={isLoading} style={({ pressed }) => [styles.lookupButton, pressed && styles.buttonPressed]} onPress={handleLookupIdentity}>
              <Text style={styles.lookupButtonText}>Validar</Text>
            </Pressable>
          </View>
          <TextInput
            editable={false}
            placeholder="Nombre"
            placeholderTextColor={colors.inkSoft}
            style={[styles.input, styles.inputDisabled]}
            value={registerForm.firstName}
          />
          <TextInput
            editable={false}
            placeholder="Apellido"
            placeholderTextColor={colors.inkSoft}
            style={[styles.input, styles.inputDisabled]}
            value={registerForm.lastName}
          />
          <View style={styles.inlineRow}>
            <TextInput editable={false} placeholder="Edad" placeholderTextColor={colors.inkSoft} style={[styles.input, styles.inputDisabled, styles.halfInput]} value={registerForm.age} />
            <TextInput editable={false} placeholder="Genero" placeholderTextColor={colors.inkSoft} style={[styles.input, styles.inputDisabled, styles.halfInput]} value={registerForm.gender} />
          </View>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Correo"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            value={registerForm.email}
            onChangeText={(value) => updateRegisterField('email', value)}
          />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Confirmar correo"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            value={registerForm.confirmEmail}
            onChangeText={(value) => updateRegisterField('confirmEmail', value)}
          />
          <TextInput
            placeholder="Contrasena segura"
            placeholderTextColor={colors.inkSoft}
            secureTextEntry
            style={styles.input}
            value={registerForm.password}
            onChangeText={(value) => updateRegisterField('password', value)}
          />
          {passwordError && <Text style={styles.validationText}>{passwordError}</Text>}
          <TextInput
            placeholder="Confirmar contrasena"
            placeholderTextColor={colors.inkSoft}
            secureTextEntry
            style={styles.input}
            value={registerForm.confirmPassword}
            onChangeText={(value) => updateRegisterField('confirmPassword', value)}
          />
          <TextInput
            placeholder="Direccion"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            value={registerForm.address}
            onChangeText={(value) => updateRegisterField('address', value)}
          />
          <TextInput
            keyboardType="phone-pad"
            placeholder="Telefono"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            value={registerForm.phone}
            onChangeText={(value) => updateRegisterField('phone', value)}
          />
          <Pressable disabled={isLoading} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={handleRegister}>
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
  if (identity === null || identity.national_id !== form.nationalId) {
    return 'Valida la cedula antes de crear la cuenta.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    return 'Ingresa un correo valido.';
  }

  if (form.email.trim().toLowerCase() !== form.confirmEmail.trim().toLowerCase()) {
    return 'Los correos no coinciden.';
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

  if (!/^[0-9+\-\s()]{7,30}$/.test(form.phone)) {
    return 'Ingresa un telefono valido.';
  }

  return null;
}

function validatePassword(password: string): string | null {
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

const styles = StyleSheet.create({
  accountCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.medium,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
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
  inputDisabled: {
    backgroundColor: colors.silverSoft,
    color: colors.inkMuted,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineInput: {
    flex: 1,
  },
  halfInput: {
    flex: 1,
  },
  lookupButton: {
    width: 88,
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
