import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { PressableScale } from '../common/PressableScale';
import { RemoteImage } from '../common/RemoteImage';
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
  const [hasImageError, setHasImageError] = useState(false);
  const showRealImage = Boolean(item.product.imageUrl) && !hasImageError;

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
        {showRealImage ? (
          <RemoteImage
            accessibilityLabel={`Imagen de ${item.product.title}`}
            uri={item.product.imageUrl as string}
            width={120}
            style={styles.itemImage}
            onFinalError={() => setHasImageError(true)}
          />
        ) : (
          <Ionicons name="bag-handle" size={26} color={colors.brandBlue} />
        )}
      </View>
      <View style={styles.itemContent}>
        <Text numberOfLines={2} style={styles.itemTitle}>
          {item.product.title}
        </Text>
        <Text style={styles.itemMeta}>
          {item.product.category} / {item.product.seller}
        </Text>
        <Text style={styles.itemPrice}>{formatPrice(item.product.price)}</Text>
      </View>
      <View style={styles.itemActions}>
        <PressableScale
          accessibilityLabel={`Quitar una unidad de ${item.product.title}`}
          activeScale={0.88}
          style={styles.quantityButton}
          onPress={() => onChangeQuantity(item.product.id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={14} color={colors.brandBlue} />
        </PressableScale>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <PressableScale
          accessibilityLabel={`Agregar una unidad de ${item.product.title}`}
          activeScale={0.88}
          style={styles.quantityButton}
          onPress={() => onChangeQuantity(item.product.id, item.quantity + 1)}
        >
          <Ionicons name="add" size={14} color={colors.brandBlue} />
        </PressableScale>
        <PressableScale
          accessibilityLabel={`Eliminar ${item.product.title}`}
          activeScale={0.88}
          style={styles.removeButton}
          onPress={() => onRemoveItem(item.product.id)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.inkMuted} />
        </PressableScale>
      </View>
    </Animated.View>
  );
}
