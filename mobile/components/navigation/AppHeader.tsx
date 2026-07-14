import { Ionicons } from '@expo/vector-icons';
import { Animated, Pressable, Text, View } from 'react-native';
import { BrandLogo } from '../common/BrandLogo';
import { colors } from '../../theme/colors';
import { navigationStyles as styles } from './navigationStyles';

type AppHeaderProps = {
  cartCount: number;
  cartPulse: Animated.Value;
  headerOpacity: Animated.Value;
  headerTranslateY: Animated.AnimatedInterpolation<number>;
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
  showCart,
  onOpenCart,
  showNotifications = false,
  unreadCount = 0,
  onOpenNotifications,
}: AppHeaderProps) {
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
      <View style={styles.headerBrand}>
        <BrandLogo />
        <View>
          <Text style={styles.headerTitle}>NEXO</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        {showNotifications && onOpenNotifications && (
          <Pressable
            accessibilityLabel="Abrir notificaciones"
            style={({ pressed }) => [styles.cartBadge, pressed && styles.cartBadgePressed]}
            onPress={onOpenNotifications}
          >
            <Ionicons name="notifications-outline" size={19} color={colors.surface} />
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
              <Ionicons name="bag-handle-outline" size={19} color={colors.surface} />
              {cartCount > 0 && (
                <View style={styles.cartCountBubble}>
                  <Text style={styles.cartCountText}>{cartCount}</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}
