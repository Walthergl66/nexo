import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '../common/PressableScale';
import { Tag } from '../common/Tag';
import {
  FULFILLMENT_ACTION_LABELS,
  FULFILLMENT_LABELS,
  FULFILLMENT_STEPS,
  fulfillmentStepIndex,
} from '../../constants/fulfillment';
import { colors, radii } from '../../theme/colors';
import type { Sale } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';
import { styles as sellStyles } from './sellStyles';

type SellerSalesListProps = {
  sales: Sale[];
  isLoading?: boolean;
  advancingId: string | null;
  onAdvance: (sale: Sale) => void;
};

function StatusSteps({ currentIndex }: { currentIndex: number }) {
  return (
    <View style={styles.steps}>
      {FULFILLMENT_STEPS.map((step, index) => {
        const reached = currentIndex >= index;
        return (
          <View key={step} style={styles.stepItem}>
            {index > 0 && <View style={[styles.stepBar, reached && styles.stepBarReached]} />}
            <View style={[styles.stepDot, reached && styles.stepDotReached]} />
          </View>
        );
      })}
    </View>
  );
}

export function SellerSalesList({ sales, isLoading = false, advancingId, onAdvance }: SellerSalesListProps) {
  if (sales.length === 0) {
    if (isLoading) {
      return (
        <View style={sellStyles.productList}>
          <View style={sellStyles.productLoadingRow}>
            <ActivityIndicator color={colors.brandBlue} />
            <Text style={sellStyles.productMeta}>Cargando tus ventas…</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={sellStyles.productList}>
        <View style={sellStyles.productListHeader}>
          <Text style={sellStyles.formTitle}>Tus ventas</Text>
        </View>
        <Text style={sellStyles.productMeta}>Aún no tienes ventas pagadas por gestionar.</Text>
      </View>
    );
  }

  return (
    <View style={sellStyles.productList}>
      <View style={sellStyles.productListHeader}>
        <Text style={sellStyles.formTitle}>Tus ventas</Text>
        <Tag text={`${sales.length} por gestionar`} tone="default" />
      </View>

      <View style={styles.list}>
        {sales.map((sale) => {
          const stepIndex = fulfillmentStepIndex(sale.fulfillmentStatus);
          const isDelivered = sale.fulfillmentStatus === 'delivered';
          const isAdvancing = advancingId === sale.id;

          return (
            <View key={sale.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text numberOfLines={1} style={styles.product}>
                  {sale.productName}
                </Text>
                <Text style={styles.price}>{formatPrice(sale.subtotal)}</Text>
              </View>

              <Text style={styles.meta}>
                {sale.buyerName ? `${sale.buyerName} · ` : ''}x{sale.quantity} · {sale.orderNumber}
              </Text>

              <StatusSteps currentIndex={stepIndex} />

              <View style={styles.footer}>
                <View style={styles.statusChip}>
                  <View style={[styles.statusDot, isDelivered && styles.statusDotDone]} />
                  <Text style={styles.statusText}>{FULFILLMENT_LABELS[sale.fulfillmentStatus]}</Text>
                </View>

                {sale.nextStatus ? (
                  <PressableScale
                    accessibilityLabel={`${FULFILLMENT_ACTION_LABELS[sale.nextStatus]} ${sale.productName}`}
                    disabled={isAdvancing}
                    style={[styles.advanceButton, isAdvancing && styles.advanceButtonBusy]}
                    onPress={() => onAdvance(sale)}
                  >
                    {isAdvancing ? (
                      <ActivityIndicator color={colors.surface} size="small" />
                    ) : (
                      <>
                        <Ionicons name="arrow-forward" size={14} color={colors.surface} />
                        <Text style={styles.advanceText}>{FULFILLMENT_ACTION_LABELS[sale.nextStatus]}</Text>
                      </>
                    )}
                  </PressableScale>
                ) : (
                  <View style={styles.doneChip}>
                    <Ionicons name="checkmark-circle" size={15} color={colors.brandBlue} />
                    <Text style={styles.doneText}>Entregado</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    marginTop: 10,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  product: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  price: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepBar: {
    flex: 1,
    height: 2,
    backgroundColor: colors.line,
  },
  stepBarReached: {
    backgroundColor: colors.brandBlue,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.line,
  },
  stepDotReached: {
    backgroundColor: colors.brandBlue,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.brandAccent,
  },
  statusDotDone: {
    backgroundColor: colors.brandBlue,
  },
  statusText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  advanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 120,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    paddingHorizontal: 14,
  },
  advanceButtonBusy: {
    opacity: 0.7,
  },
  advanceText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  doneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  doneText: {
    color: colors.brandBlue,
    fontSize: 12,
    fontWeight: '700',
  },
});
