import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Tag } from '../common/Tag';
import type { ProfileResource } from '../../services/marketplaceApi';
import { colors } from '../../theme/colors';
import { accountStyles as styles } from './accountStyles';

type AuthenticatedAccountPanelProps = {
  message: string | null;
  profile: ProfileResource;
  onLogout: () => void;
  onSell: () => void;
};

export function AuthenticatedAccountPanel({
  message,
  profile,
  onLogout,
  onSell,
}: AuthenticatedAccountPanelProps) {
  const canRequestSellerVerification = profile.role === 'buyer' && profile.verification_status !== 'suspended';

  return (
    <>
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
        {canRequestSellerVerification && (
          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={onSell}>
            <Ionicons name="shield-checkmark" size={17} color={colors.surface} />
            <Text style={styles.primaryButtonText}>Solicitar validacion para vender</Text>
          </Pressable>
        )}
        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={onLogout}>
          <Text style={styles.secondaryButtonText}>Cerrar sesion</Text>
        </Pressable>
      </View>
      {message && <Text style={styles.message}>{message}</Text>}
    </>
  );
}
