import { StyleSheet, Text, View } from 'react-native';
import { LogicCard } from '../components/cards/LogicCard';
import { SectionTitle } from '../components/common/SectionTitle';
import { Tag } from '../components/common/Tag';
import { colors, radii } from '../theme/colors';

export function AccountScreen() {
  return (
    <>
      <SectionTitle title="Perfil del usuario" subtitle="Datos, seguridad y personalizacion." />
      <View style={styles.accountCard}>
        <Text style={styles.accountName}>Walter · Comprador/Vendedor</Text>
        <Text style={styles.accountEmail}>walter@nexo.app</Text>
        <View style={styles.accountTags}>
          <Tag text="2FA pendiente" tone="warning" />
          <Tag text="3 direcciones guardadas" tone="default" />
          <Tag text="Nivel Plata" tone="success" />
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
