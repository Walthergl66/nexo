import { StyleSheet, View } from 'react-native';
import { LogicCard } from '../../components/cards/LogicCard';
import { InfoRow } from '../../components/common/InfoRow';
import { SectionTitle } from '../../components/common/SectionTitle';
import { colors, radii } from '../../theme/colors';

export function SellScreen() {
  return (
    <>
      <SectionTitle title="Centro de ventas" subtitle="Publicacion, comision, inventario y despacho." />
      <View style={styles.panel}>
        <InfoRow label="Estado de cuenta" value="Verificada" />
        <InfoRow label="Comision sugerida" value="8% + envio" />
        <InfoRow label="Tiempo de aprobacion" value="< 24 horas" />
        <InfoRow label="Inventario critico" value="2 productos por reponer" />
      </View>

      <SectionTitle title="Reglas operativas" subtitle="Base para RF del lado vendedor." />
      <View style={styles.logicList}>
        <LogicCard
          title="Publicacion"
          description="Titulo, fotos, categoria, precio, inventario, condicion y politicas."
        />
        <LogicCard
          title="Reputacion"
          description="Impacta el ordenamiento, campanas y acceso a promociones."
        />
        <LogicCard
          title="Despacho"
          description="Plazo configurable por ciudad, mensajeria o entrega coordinada."
        />
      </View>
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
