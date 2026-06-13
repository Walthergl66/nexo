import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LogicCard } from '../../components/cards/LogicCard';
import { InfoRow } from '../../components/common/InfoRow';
import { SectionTitle } from '../../components/common/SectionTitle';
import { fetchMyStore, fetchProfile } from '../../services/marketplaceApi';
import { colors, radii } from '../../theme/colors';

type SellScreenProps = {
  accessToken: string | null;
};

export function SellScreen({ accessToken }: SellScreenProps) {
  const [profile, setProfile] = useState<{
    role: string;
    verification_status: string;
  } | null>(null);
  const [store, setStore] = useState<{
    name: string;
    status: string;
  } | null>(null);
  const isAuthenticated = accessToken !== null;

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      setStore(null);
      return;
    }

    let isMounted = true;

    Promise.all([
      fetchProfile(accessToken ?? undefined).catch(() => null),
      fetchMyStore(accessToken ?? undefined).catch(() => null),
    ]).then(([nextProfile, nextStore]) => {
      if (isMounted) {
        setProfile(nextProfile);
        setStore(nextStore);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <>
        <SectionTitle title="Centro de ventas" subtitle="Ventas protegidas por verificacion." />
        <View style={styles.logicList}>
          <LogicCard
            title="Inicia sesion"
            description="Para vender necesitas una cuenta, solicitar verificacion y tener una tienda activa."
          />
          <LogicCard
            title="Catalogo publico"
            description="Puedes seguir explorando productos como visitante mientras decides registrarte."
          />
        </View>
      </>
    );
  }

  return (
    <>
      <SectionTitle title="Centro de ventas" subtitle="Publicacion, comision, inventario y despacho." />
      <View style={styles.panel}>
        <InfoRow label="Rol" value={profile?.role ?? 'buyer'} />
        <InfoRow label="Verificacion" value={profile?.verification_status ?? 'sin sesion'} />
        <InfoRow label="Tienda" value={store?.name ?? 'Sin tienda activa'} />
        <InfoRow label="Estado tienda" value={store?.status ?? 'No disponible'} />
      </View>
      {store === null && (
        <View style={styles.logicList}>
          <LogicCard
            title="Sin tienda"
            description="Cuando Laravel devuelva una tienda propia, su informacion aparecera aqui."
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.medium,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  logicList: {
    gap: 12,
  },
});
