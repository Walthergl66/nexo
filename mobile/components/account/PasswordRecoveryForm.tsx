import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { accountStyles as styles } from './accountStyles';

type PasswordRecoveryFormProps = {
  email: string;
  isLoading: boolean;
  onChangeEmail: (value: string) => void;
  onSubmit: () => void;
};

export function PasswordRecoveryForm({
  email,
  isLoading,
  onChangeEmail,
  onSubmit,
}: PasswordRecoveryFormProps) {
  return (
    <View style={styles.accountCard}>
      <Text style={styles.accountName}>Recuperar contraseña</Text>
      <Text style={styles.accountEmail}>Te enviaremos un enlace de recuperacion al correo registrado.</Text>
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
    </View>
  );
}
