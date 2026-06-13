import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SectionTitle } from '../../components/common/SectionTitle';
import { Tag } from '../../components/common/Tag';
import { fetchProfile } from '../../services/marketplaceApi';
import { colors, radii } from '../../theme/colors';

type AccountScreenProps = {
  onExplore: () => void;
};

export function AccountScreen({ onExplore }: AccountScreenProps) {
  const [profile, setProfile] = useState<{
    display_name: string | null;
    email: string | null;
    role: string;
    verification_status: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchProfile()
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
  }, []);

  const isGuest = profile === null;
  const displayName = profile?.display_name ?? 'Invitado';
  const accountLabel = profile?.email ?? 'Explora el catalogo sin iniciar sesion.';

  return (
    <>
      <SectionTitle title="Perfil del usuario" subtitle="Datos, seguridad y personalizacion." />
      <View style={styles.accountCard}>
        <Text style={styles.accountName}>{displayName}</Text>
        <Text style={styles.accountEmail}>{accountLabel}</Text>
        <View style={styles.accountTags}>
          <Tag text={profile?.role ?? 'visitante'} tone="default" />
          <Tag text={profile?.verification_status ?? 'sin sesion'} tone={profile?.verification_status === 'approved' ? 'success' : 'warning'} />
          <Tag text={isGuest ? 'Catalogo publico' : 'Supabase Auth'} tone="success" />
        </View>
        {isGuest && (
          <View style={styles.guestPanel}>
            <Text style={styles.guestTitle}>Modo invitado</Text>
            <Text style={styles.guestText}>
              Puedes explorar productos y tiendas. Para agregar al carrito, comprar, vender o revisar pedidos se requiere iniciar sesion.
            </Text>
            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]} onPress={onExplore}>
              <Text style={styles.primaryButtonText}>Explorar catalogo</Text>
            </Pressable>
          </View>
        )}
      </View>

      {!isGuest && (
        <>
          <SectionTitle title="Permisos" subtitle="Datos devueltos por Laravel." />
          <View style={styles.accountCard}>
            <Text style={styles.accountName}>{profile.role}</Text>
            <Text style={styles.accountEmail}>Verificacion: {profile.verification_status}</Text>
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.medium,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  accountEmail: {
    marginTop: 6,
    fontSize: 13,
    color: colors.inkMuted,
  },
  accountTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  guestPanel: {
    marginTop: 16,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  guestTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  guestText: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  primaryButton: {
    height: 42,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlue,
    marginTop: 12,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '900',
  },
});
