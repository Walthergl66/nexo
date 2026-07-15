import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { navigationStyles as styles } from './navigationStyles';

type AppHeaderProps = {
  cartCount: number;
  cartPulse: Animated.Value;
  headerOpacity: Animated.Value;
  headerTranslateY: Animated.AnimatedInterpolation<number>;
  userName?: string | null;
  showCart: boolean;
  onOpenCart: () => void;
  showNotifications?: boolean;
  unreadCount?: number;
  onOpenNotifications?: () => void;
};

export function AppHeader({
  cartCount,
  cartPulse,
  headerOpacity,
  headerTranslateY,
  userName,
  showCart,
  onOpenCart,
  showNotifications = false,
  unreadCount = 0,
  onOpenNotifications,
}: AppHeaderProps) {
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCount.current) {
      bubbleScale.setValue(0.6);
      Animated.spring(bubbleScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 14,
      }).start();
    }
    prevCount.current = cartCount;
  }, [bubbleScale, cartCount]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.header,
        {
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
        },
      ]}
    >
      <View style={styles.headerGreeting}>
        <Text style={styles.headerGreetingLabel}>{userName ? 'Bienvenido de nuevo,' : 'Hola,'}</Text>
        <Text numberOfLines={1} style={styles.headerGreetingName}>
          {userName ? userName.toLowerCase() : 'bienvenido a nexo'}
        </Text>
      </View>
      <View style={styles.headerActions}>
        {showNotifications && onOpenNotifications && (
          <Pressable
            accessibilityLabel="Abrir notificaciones"
            style={({ pressed }) => [styles.cartBadge, pressed && styles.cartBadgePressed]}
            onPress={onOpenNotifications}
          >
            <Ionicons name="notifications-outline" size={19} color={colors.ink} />
            {unreadCount > 0 && (
              <View style={styles.cartCountBubble}>
                <Text style={styles.cartCountText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        )}
        {showCart && (
          <Animated.View style={{ transform: [{ scale: cartPulse }] }}>
            <Pressable
              accessibilityLabel="Abrir carrito"
              style={({ pressed }) => [styles.cartBadge, pressed && styles.cartBadgePressed]}
              onPress={onOpenCart}
            >
              <Ionicons name="bag-handle-outline" size={19} color={colors.ink} />
              {cartCount > 0 && (
                <Animated.View style={[styles.cartCountBubble, { transform: [{ scale: bubbleScale }] }]}>
                  <Text style={styles.cartCountText}>{cartCount}</Text>
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}
