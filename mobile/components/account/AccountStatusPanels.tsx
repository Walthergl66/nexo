import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { accountStyles as styles } from './accountStyles';

export function AccountUnavailablePanel() {
  return (
    <View style={styles.accountCard}>
      <Text style={styles.accountName}>Cuenta no disponible</Text>
      <Text style={styles.accountEmail}>Estamos preparando el acceso a cuentas. Intenta nuevamente mas tarde.</Text>
    </View>
  );
}

export function ProfileLoadingPanel() {
  return (
    <View style={styles.accountCard}>
      <ActivityIndicator color={colors.brandBlue} />
      <Text style={styles.accountEmail}>Cargando tus datos de cuenta.</Text>
    </View>
  );
}

type ProfileSyncErrorPanelProps = {
  error: string;
  isLoading: boolean;
  onLogout: () => void;
  onRetry: () => void;
};

export function ProfileSyncErrorPanel({
  error,
  isLoading,
  onLogout,
  onRetry,
}: ProfileSyncErrorPanelProps) {
  return (
    <View style={styles.accountCard}>
      <Text style={styles.accountName}>No pudimos cargar tu cuenta</Text>
      <Text style={styles.accountEmail}>
        Tu sesion esta activa, pero necesitamos volver a cargar tus datos antes de continuar.
      </Text>
      <Text style={styles.errorText}>{error}</Text>
      <Pressable
        disabled={isLoading}
        style={({ pressed }) => [styles.primaryButton, isLoading && styles.buttonDisabled, pressed && styles.buttonPressed]}
        onPress={onRetry}
      >
        <Ionicons name="refresh" size={17} color={colors.surface} />
        <Text style={styles.primaryButtonText}>Volver a intentar</Text>
      </Pressable>
      <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={onLogout}>
        <Text style={styles.secondaryButtonText}>Cerrar sesion</Text>
      </Pressable>
    </View>
  );
}
