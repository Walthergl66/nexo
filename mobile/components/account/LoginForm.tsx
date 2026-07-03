import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { accountStyles as styles } from './accountStyles';

type LoginFormProps = {
  email: string;
  isLoading: boolean;
  isPasswordVisible: boolean;
  password: string;
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
  onChangeEmail,
  onChangePassword,
  onExplore,
  onRecoverPassword,
  onSubmit,
  onTogglePasswordVisibility,
}: LoginFormProps) {
  return (
    <View style={styles.accountCard}>
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
      <Pressable disabled={isLoading} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={onSubmit}>
        {isLoading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
      </Pressable>
      <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={onRecoverPassword}>
        <Text style={styles.secondaryButtonText}>Recuperar contraseña</Text>
      </Pressable>
    </View>
  );
}
