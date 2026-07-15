import { Ionicons } from '@expo/vector-icons';
import { Animated, LayoutChangeEvent, Pressable, View } from 'react-native';
import { colors } from '../../theme/colors';
import type { TabKey } from '../../types/marketplace';
import { navigationStyles as styles } from './navigationStyles';

type NavIconName = keyof typeof Ionicons.glyphMap;

const navIcons: Record<TabKey, { active: NavIconName; inactive: NavIconName }> = {
  Inicio: { active: 'home', inactive: 'home-outline' },
  Vender: { active: 'flame', inactive: 'flame-outline' },
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
                  <Ionicons name={navIcons[tab].active} size={24} color={colors.brandBlue} style={styles.bottomNavIconGlyph} />
                  <View pointerEvents="none" style={styles.bottomNavSelectionShadow} />
                </Animated.View>
              ) : (
                <Ionicons name={navIcons[tab].inactive} size={24} color={colors.inkSoft} style={styles.bottomNavIconGlyph} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
