import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../theme/colors';
import { formatPrice } from '../../utils/format';
import { InfoRow } from '../common/InfoRow';

type CheckoutSummaryProps = {
  subtotal: number;
  shipping: number;
};

export function CheckoutSummary({ subtotal, shipping }: CheckoutSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen de compra</Text>
      <InfoRow label="Subtotal" value={formatPrice(subtotal)} inverted />
      <InfoRow label="Envio" value={formatPrice(shipping)} inverted />
      <InfoRow label="Proteccion del comprador" value="Incluida" inverted />
      <View style={styles.divider} />
      <InfoRow label="Total estimado" value={formatPrice(subtotal + shipping)} emphasize inverted />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderRadius: radii.medium,
    padding: 18,
    gap: 12,
  },
  title: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.primarySoft,
  },
});
