import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LogicCard } from '../../components/cards/LogicCard';
import { SectionTitle } from '../../components/common/SectionTitle';
import { Tag } from '../../components/common/Tag';
import { fetchProfile } from '../../services/marketplaceApi';
import { colors, radii } from '../../theme/colors';

export function AccountScreen() {
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

  const displayName = profile?.display_name ?? 'Usuario NEXO';
  const email = profile?.email ?? 'Configura EXPO_PUBLIC_SUPABASE_ACCESS_TOKEN';

  return (
    <>
      <SectionTitle title="Perfil del usuario" subtitle="Datos, seguridad y personalizacion." />
      <View style={styles.accountCard}>
        <Text style={styles.accountName}>{displayName}</Text>
        <Text style={styles.accountEmail}>{email}</Text>
        <View style={styles.accountTags}>
          <Tag text={profile?.role ?? 'buyer'} tone="default" />
          <Tag text={profile?.verification_status ?? 'sin sesion'} tone={profile?.verification_status === 'approved' ? 'success' : 'warning'} />
          <Tag text="Supabase Auth" tone="success" />
        </View>
      </View>

      <SectionTitle
        title="RNF visibles en la experiencia"
        subtitle="Lo que la interfaz ya sugiere desde el prototipo."
      />
      <View style={styles.logicList}>
        <LogicCard
          title="Seguridad"
          description="Autenticacion, pagos protegidos, trazabilidad y permisos."
        />
        <LogicCard
          title="Rendimiento"
          description="Carga rapida de catalogo, scroll fluido y busqueda reactiva."
        />
        <LogicCard
          title="Escalabilidad"
          description="Modelo pensado para multiples categorias, ciudades y vendedores."
        />
      </View>
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
  logicList: {
    gap: 12,
  },
});
