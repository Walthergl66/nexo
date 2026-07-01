import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import type { CartItem } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';
import { cartStyles as styles } from './cartStyles';

type CartLineItemProps = {
  item: CartItem;
  index: number;
  onChangeQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
};

export function CartLineItem({ item, index, onChangeQuantity, onRemoveItem }: CartLineItemProps) {
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
