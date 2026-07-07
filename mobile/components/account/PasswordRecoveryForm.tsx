import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { AuthBrandHeader } from './AuthBrandHeader';
import { accountStyles as styles } from './accountStyles';

type PasswordRecoveryFormProps = {
  email: string;
  isLoading: boolean;
  onBackToLogin: () => void;
  onChangeEmail: (value: string) => void;
  onSubmit: () => void;
};

export function PasswordRecoveryForm({
  email,
  isLoading,
  onBackToLogin,
  onChangeEmail,
  onSubmit,
}: PasswordRecoveryFormProps) {
  return (
    <View style={styles.accountCard}>
      <AuthBrandHeader
        variant="recovery"
        title="Recuperar contraseña"
        subtitle="Te enviaremos un enlace al correo registrado para restablecer el acceso."
      />
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="correo@ejemplo.com"
        placeholderTextColor={colors.inkSoft}
        style={styles.input}
        value={email}
        onChangeText={onChangeEmail}
      />
      <Pressable disabled={isLoading} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={onSubmit}>
        {isLoading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>Enviar enlace</Text>}
      </Pressable>
      <Pressable style={({ pressed }) => [styles.recoveryLink, pressed && styles.recoveryLinkPressed]} onPress={onBackToLogin}>
        <Text style={styles.recoveryLinkText}>Volver a iniciar sesión</Text>
      </Pressable>
    </View>
  );
}
