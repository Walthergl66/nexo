import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { InfoRow } from '../../components/common/InfoRow';
import { colors, radii } from '../../theme/colors';
import type { CartItem } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';

type CartScreenProps = {
  items: CartItem[];
  shipping: number;
  onBackToCatalog: () => void;
  onChangeQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
};

type CartLineItemProps = {
  item: CartItem;
  index: number;
  onChangeQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
};

function CartLineItem({ item, index, onChangeQuantity, onRemoveItem }: CartLineItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 210,
        delay: index * 35,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 210,
        delay: index * 35,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, item.product.id, opacity, translateY]);

  return (
    <Animated.View style={[styles.itemCard, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.itemIcon}>
        <Ionicons name="bag-handle" size={26} color={colors.brandBlue} />
      </View>
      <View style={styles.itemContent}>
        <Text numberOfLines={2} style={styles.itemTitle}>
          {item.product.title}
        </Text>
        <Text style={styles.itemMeta}>
          {item.product.condition} / {item.product.seller}
        </Text>
        <Text style={styles.itemPrice}>{formatPrice(item.product.price)}</Text>
      </View>
      <View style={styles.itemActions}>
        <Pressable
          accessibilityLabel={`Quitar una unidad de ${item.product.title}`}
          style={({ pressed }) => [styles.quantityButton, pressed && styles.quantityButtonPressed]}
          onPress={() => onChangeQuantity(item.product.id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={14} color={colors.brandBlue} />
        </Pressable>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <Pressable
          accessibilityLabel={`Agregar una unidad de ${item.product.title}`}
          style={({ pressed }) => [styles.quantityButton, pressed && styles.quantityButtonPressed]}
          onPress={() => onChangeQuantity(item.product.id, item.quantity + 1)}
        >
          <Ionicons name="add" size={14} color={colors.brandBlue} />
        </Pressable>
        <Pressable
          accessibilityLabel={`Eliminar ${item.product.title}`}
          style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
          onPress={() => onRemoveItem(item.product.id)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.inkMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function CartScreen({
  items,
  shipping,
  onBackToCatalog,
  onChangeQuantity,
  onRemoveItem,
}: CartScreenProps) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = subtotal + (items.length > 0 ? shipping : 0);

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cart-outline" size={42} color={colors.brandBlue} />
        </View>
        <Text style={styles.emptyTitle}>Tu carrito esta vacio</Text>
        <Text style={styles.emptyText}>Agrega productos desde el catalogo para verlos aqui.</Text>
        <Pressable style={styles.primaryButton} onPress={onBackToCatalog}>
          <Text style={styles.primaryButtonText}>Explorar productos</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable accessibilityLabel="Volver al catalogo" style={styles.backButton} onPress={onBackToCatalog}>
          <Ionicons name="chevron-back" size={20} color={colors.brandBlue} />
        </Pressable>
        <View>
          <Text style={styles.title}>Carrito</Text>
          <Text style={styles.subtitle}>{items.length} productos agregados</Text>
        </View>
      </View>

      <View style={styles.list}>
        {items.map((item, index) => (
          <CartLineItem
            key={item.product.id}
            item={item}
            index={index}
            onChangeQuantity={onChangeQuantity}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Resumen</Text>
        <InfoRow label="Subtotal" value={formatPrice(subtotal)} />
        <InfoRow label="Envio" value={formatPrice(shipping)} />
        <InfoRow label="Proteccion" value="Incluida" />
        <View style={styles.divider} />
        <InfoRow label="Total" value={formatPrice(total)} emphasize />
      </View>

      <Pressable style={({ pressed }) => [styles.checkoutButton, pressed && styles.checkoutButtonPressed]}>
        <Ionicons name="lock-closed" size={16} color={colors.surface} />
        <Text style={styles.checkoutText}>Continuar compra</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  list: {
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 12,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  itemMeta: {
    color: colors.inkMuted,
    fontSize: 11,
    marginTop: 3,
  },
  itemPrice: {
    color: colors.brandBlue,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 6,
  },
  itemActions: {
    alignItems: 'center',
    gap: 6,
  },
  quantityButton: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  quantityButtonPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: colors.brandBlueSoft,
  },
  quantity: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  removeButton: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: colors.silverSoft,
  },
  summary: {
    gap: 10,
    padding: 14,
    borderRadius: radii.medium,
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
  },
  summaryTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
  checkoutButton: {
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  checkoutButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  checkoutText: {
    color: colors.surface,
    fontWeight: '900',
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 12,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
    backgroundColor: colors.surface,
  },
  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: colors.brandBlue,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '900',
  },
});
