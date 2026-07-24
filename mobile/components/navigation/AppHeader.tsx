import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { navigationStyles as styles } from './navigationStyles';

type AppHeaderProps = {
  cartCount: number;
  cartPulse: Animated.Value;
  headerOpacity: Animated.Value;
  headerTranslateY: Animated.AnimatedInterpolation<number>;
  scrollY: Animated.Value;
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
  scrollY,
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

  const glassOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0.92, 0.95],
    extrapolate: 'clamp',
  });

  const shadowOpacity = scrollY.interpolate({
    inputRange: [0, 30],
    outputRange: [0.08, 0.14],
    extrapolate: 'clamp',
  });

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
      <Animated.View
        style={[
          styles.headerGlass,
          {
            opacity: glassOpacity,
          },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.headerShadow,
          {
            opacity: shadowOpacity,
          },
        ]}
        pointerEvents="none"
      />
      <Image
        source={require('../../assets/nexo-logo.png')}
        style={styles.headerLogo}
        resizeMode="contain"
        accessibilityLabel="Logo nexo"
      />
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
