import { Ionicons } from '@expo/vector-icons';
import { Animated, LayoutChangeEvent, Pressable, View } from 'react-native';
import { colors } from '../../theme/colors';
import type { TabKey } from '../../types/marketplace';
import { navigationStyles as styles } from './navigationStyles';

type NavIconName = keyof typeof Ionicons.glyphMap;

const navIcons: Record<TabKey, { active: NavIconName; inactive: NavIconName }> = {
  Inicio: { active: 'home', inactive: 'home-outline' },
  Vender: { active: 'flame', inactive: 'flame-outline' },
  Pedidos: { active: 'bag-handle', inactive: 'bag-handle-outline' },
  Cuenta: { active: 'person', inactive: 'person-outline' },
};

type BottomNavProps = {
  activeDotScale: Animated.AnimatedInterpolation<number>;
  activeDotX: Animated.Value;
  activeDotY: Animated.AnimatedInterpolation<number>;
  activeIconScale: Animated.AnimatedInterpolation<number>;
  activeIndentLeftRotation: Animated.AnimatedInterpolation<string>;
  activeIndentOpacity: Animated.AnimatedInterpolation<number>;
  activeIndentRightRotation: Animated.AnimatedInterpolation<string>;
  activeIndentScaleX: Animated.AnimatedInterpolation<number>;
  activeIndentScaleY: Animated.AnimatedInterpolation<number>;
  activeIndentTipScale: Animated.AnimatedInterpolation<number>;
  activeIndentX: Animated.Value;
  activeIndentY: Animated.AnimatedInterpolation<number>;
  activeTab: TabKey;
  navItemWidth: number;
  tabs: TabKey[];
  onLayout: (event: LayoutChangeEvent) => void;
  onSelectTab: (tab: TabKey) => void;
};

export function BottomNav({
  activeDotScale,
  activeDotX,
  activeDotY,
  activeIconScale,
  activeIndentLeftRotation,
  activeIndentOpacity,
  activeIndentRightRotation,
  activeIndentScaleX,
  activeIndentScaleY,
  activeIndentTipScale,
  activeIndentX,
  activeIndentY,
  activeTab,
  navItemWidth,
  tabs,
  onLayout,
  onSelectTab,
}: BottomNavProps) {
  return (
    <View style={styles.bottomNav}>
      <View style={styles.bottomNavTrack} onLayout={onLayout}>
        {navItemWidth > 0 && (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.bottomNavIndent,
                {
                  transform: [
                    { translateX: activeIndentX },
                    { translateY: activeIndentY },
                    { scaleX: activeIndentScaleX },
                    { scaleY: activeIndentScaleY },
                  ],
                  opacity: activeIndentOpacity,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.bottomNavIndentArm,
                  styles.bottomNavIndentArmLeft,
                  { transform: [{ rotate: activeIndentLeftRotation }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.bottomNavIndentArm,
                  styles.bottomNavIndentArmRight,
                  { transform: [{ rotate: activeIndentRightRotation }] },
                ]}
              />
              <Animated.View style={[styles.bottomNavIndentTip, { transform: [{ scale: activeIndentTipScale }] }]} />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.bottomNavMovingDot,
                {
                  transform: [
                    { translateX: activeDotX },
                    { translateY: activeDotY },
                    { scale: activeDotScale },
                  ],
                },
              ]}
            />
          </>
        )}
        {tabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <Pressable
              key={tab}
              accessibilityLabel={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [styles.bottomNavItem, pressed && styles.bottomNavItemPressed]}
              onPress={() => onSelectTab(tab)}
            >
              {isActive ? (
                <Animated.View key={tab} style={[styles.bottomNavActiveIcon, { transform: [{ scale: activeIconScale }] }]}>
                  <Ionicons name={navIcons[tab].active} size={24} color={colors.brandBlue} />
                  <View pointerEvents="none" style={styles.bottomNavSelectionShadow} />
                </Animated.View>
              ) : (
                <Ionicons name={navIcons[tab].inactive} size={24} color={colors.inkSoft} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
