import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { AuthBrandHeader } from './AuthBrandHeader';
import { accountStyles as styles } from './accountStyles';

type LoginFormProps = {
  email: string;
  isLoading: boolean;
  isPasswordVisible: boolean;
  password: string;
  /** Tras varios fallos seguidos, encamina hacia la recuperacion de contrasena. */
  showRecoveryHint?: boolean;
  /** Segundos restantes de espera tras un 429; 0 cuando no hay bloqueo. */
  cooldownSeconds?: number;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onExplore: () => void;
  onRecoverPassword: () => void;
  onSubmit: () => void;
  onTogglePasswordVisibility: () => void;
};

export function LoginForm({
  email,
  isLoading,
  isPasswordVisible,
  password,
  showRecoveryHint = false,
  cooldownSeconds = 0,
  onChangeEmail,
  onChangePassword,
  onExplore,
  onRecoverPassword,
  onSubmit,
  onTogglePasswordVisibility,
}: LoginFormProps) {
  const isCoolingDown = cooldownSeconds > 0;
  const isSubmitDisabled = isLoading || isCoolingDown;
  return (
    <View style={styles.accountCard}>
      <AuthBrandHeader
        title="Acceso seguro"
        subtitle="Ingresa a tu cuenta para comprar, vender y gestionar tus pedidos."
      />
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Correo"
        placeholderTextColor={colors.inkSoft}
        style={styles.input}
        value={email}
        onChangeText={onChangeEmail}
      />
      <View style={styles.passwordInputWrap}>
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor={colors.inkSoft}
          secureTextEntry={!isPasswordVisible}
          style={[styles.input, styles.passwordInput]}
          value={password}
          onChangeText={onChangePassword}
        />
        <Pressable
          accessibilityLabel={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={({ pressed }) => [styles.passwordToggle, pressed && styles.buttonPressed]}
          onPress={onTogglePasswordVisibility}
        >
          <Ionicons name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkMuted} />
        </Pressable>
      </View>
      <Pressable
        disabled={isSubmitDisabled}
        style={({ pressed }) => [styles.primaryButton, isSubmitDisabled && styles.buttonDisabled, pressed && styles.buttonPressed]}
        onPress={onSubmit}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.primaryButtonText}>
            {isCoolingDown ? `Reintenta en ${cooldownSeconds}s` : 'Entrar'}
          </Text>
        )}
      </Pressable>
      {showRecoveryHint && (
        <Text style={styles.recoveryHintText}>
          ¿No recuerdas tu contraseña? Puedes restablecerla en vez de seguir intentando.
        </Text>
      )}
      <Pressable style={({ pressed }) => [styles.recoveryLink, pressed && styles.recoveryLinkPressed]} onPress={onRecoverPassword}>
        <Text style={styles.recoveryLinkText}>Recuperar contraseña</Text>
      </Pressable>
    </View>
  );
}
