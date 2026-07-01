import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { accountStyles as styles } from './accountStyles';

type ResetPasswordFormProps = {
  confirmPassword: string;
  isConfirmPasswordVisible: boolean;
  isLoading: boolean;
  isPasswordVisible: boolean;
  password: string;
  passwordError: string | null;
  onChangeConfirmPassword: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  onToggleConfirmPasswordVisibility: () => void;
  onTogglePasswordVisibility: () => void;
};

export function ResetPasswordForm({
  confirmPassword,
  isConfirmPasswordVisible,
  isLoading,
  isPasswordVisible,
  password,
  passwordError,
  onChangeConfirmPassword,
  onChangePassword,
  onSubmit,
  onToggleConfirmPasswordVisibility,
  onTogglePasswordVisibility,
}: ResetPasswordFormProps) {
  return (
    <View style={styles.accountCard}>
      <Text style={styles.accountName}>Crear nueva contrasena</Text>
      <Text style={styles.accountEmail}>Ingresa una contrasena segura para volver a acceder a tu cuenta.</Text>
      <PasswordField
        isVisible={isPasswordVisible}
        placeholder="Minimo 8 caracteres"
        value={password}
        onChangeText={onChangePassword}
        onToggleVisibility={onTogglePasswordVisibility}
      />
      {passwordError && <Text style={styles.validationText}>{passwordError}</Text>}
      <PasswordField
        isVisible={isConfirmPasswordVisible}
        placeholder="Repite tu contrasena"
        value={confirmPassword}
        onChangeText={onChangeConfirmPassword}
        onToggleVisibility={onToggleConfirmPasswordVisibility}
      />
      <Pressable
        disabled={isLoading}
        style={({ pressed }) => [styles.primaryButton, isLoading && styles.buttonDisabled, pressed && styles.buttonPressed]}
        onPress={onSubmit}
      >
        {isLoading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>Guardar contrasena</Text>}
      </Pressable>
    </View>
  );
}

function PasswordField({
  isVisible,
  placeholder,
  value,
  onChangeText,
  onToggleVisibility,
}: {
  isVisible: boolean;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  onToggleVisibility: () => void;
}) {
  return (
    <View style={styles.passwordInputWrap}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.inkSoft}
        secureTextEntry={!isVisible}
        style={[styles.input, styles.passwordInput]}
        value={value}
        onChangeText={onChangeText}
      />
      <Pressable
        accessibilityLabel={isVisible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
        style={({ pressed }) => [styles.passwordToggle, pressed && styles.buttonPressed]}
        onPress={onToggleVisibility}
      >
        <Ionicons name={isVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkMuted} />
      </Pressable>
    </View>
  );
}
