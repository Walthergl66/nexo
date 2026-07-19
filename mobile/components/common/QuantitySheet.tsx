import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii } from '../../theme/colors';
import type { QuantityRequest } from '../../hooks/app/useQuantityPrompt';
import { formatPrice } from '../../utils/format';
import { AlertSheet } from './AlertSheet';

type QuantitySheetProps = {
  request: QuantityRequest | null;
  onCancel: () => void;
  onConfirm: (quantity: number) => void;
};

/** Solo digitos: evita signos, decimales y notacion cientifica desde el teclado. */
function sanitize(raw: string): string {
  return raw.replace(/[^0-9]/g, '').slice(0, 4);
}

export function QuantitySheet({ request, onCancel, onConfirm }: QuantitySheetProps) {
  const [value, setValue] = useState('1');
  const [error, setError] = useState<string | null>(null);

  const product = request?.product;
  const max = request?.maxQuantity ?? 1;

  // Cada producto abre la hoja en 1: no arrastramos la cantidad del anterior.
  useEffect(() => {
    if (request) {
      setValue('1');
      setError(null);
    }
  }, [request]);

  const parsed = Number.parseInt(value, 10);
  const quantity = Number.isNaN(parsed) ? 0 : parsed;
  const isValid = quantity >= 1 && quantity <= max;

  const step = (delta: number) => {
    const next = Math.min(max, Math.max(1, quantity + delta));
    setValue(String(next));
    setError(null);
  };

  const handleChange = (raw: string) => {
    const clean = sanitize(raw);
    setValue(clean);

    if (clean.length === 0) {
      setError(null);
      return;
    }

    const next = Number.parseInt(clean, 10);

    if (next > max) {
      setError(`Solo puedes agregar ${max} ${max === 1 ? 'unidad' : 'unidades'}.`);
      return;
    }

    // Sin esto el boton se deshabilita al escribir "0" sin explicar por que.
    if (next < 1) {
      setError('Ingresa al menos 1 unidad.');
      return;
    }

    setError(null);
  };

  const handleConfirm = () => {
    if (quantity < 1) {
      setError('Ingresa al menos 1 unidad.');
      return;
    }

    if (quantity > max) {
      setError(`Solo puedes agregar ${max} ${max === 1 ? 'unidad' : 'unidades'}.`);
      return;
    }

    onConfirm(quantity);
  };

  return (
    <AlertSheet
      actions={[
        { label: 'Agregar al carrito', icon: 'cart-outline', disabled: !isValid, onPress: handleConfirm },
        { label: 'Cancelar', variant: 'secondary', onPress: onCancel },
      ]}
      description={product?.title}
      title="Elige la cantidad"
      tone="question"
      visible={request !== null}
      onRequestClose={onCancel}
    >
      <View style={styles.stepperRow}>
        <StepButton
          disabled={quantity <= 1}
          icon="remove"
          label="Quitar una unidad"
          onPress={() => step(-1)}
        />
        <TextInput
          accessibilityLabel="Cantidad"
          inputMode="numeric"
          keyboardType="number-pad"
          maxLength={4}
          selectTextOnFocus
          style={[styles.input, error && styles.inputError]}
          value={value}
          onChangeText={handleChange}
        />
        <StepButton
          disabled={quantity >= max}
          icon="add"
          label="Agregar una unidad"
          onPress={() => step(1)}
        />
      </View>

      <Text style={styles.stockHint}>
        {max === 1 ? 'Queda 1 unidad disponible' : `Hay ${max} unidades disponibles`}
      </Text>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        product && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(product.price * Math.max(quantity, 0))}</Text>
          </View>
        )
      )}
    </AlertSheet>
  );
}

function StepButton({
  disabled,
  icon,
  label,
  onPress,
}: {
  disabled: boolean;
  icon: 'add' | 'remove';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={({ pressed }) => [styles.stepButton, pressed && styles.stepPressed, disabled && styles.stepDisabled]}
      onPress={onPress}
    >
      <Ionicons color={disabled ? colors.inkSoft : colors.ink} name={icon} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  stepButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  stepPressed: {
    opacity: 0.7,
  },
  stepDisabled: {
    opacity: 0.45,
  },
  input: {
    minWidth: 84,
    height: 52,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: '#FCA5A5',
  },
  stockHint: {
    marginTop: 10,
    color: colors.inkSoft,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  error: {
    marginTop: 10,
    color: '#9F1239',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  totalRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.small,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalLabel: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  totalValue: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '700',
  },
});
