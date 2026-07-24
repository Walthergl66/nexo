import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '../common/PressableScale';
import { colors, radii } from '../../theme/colors';
import type { SellerSection } from '../../types/sell';

type TabDef = {
  key: SellerSection;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const TABS: TabDef[] = [
  { key: 'publish', label: 'Publicar', icon: 'cloud-upload-outline' },
  { key: 'catalog', label: 'Mis productos', icon: 'cube-outline' },
  { key: 'sales', label: 'Ventas', icon: 'receipt-outline' },
];

type SellerSectionTabsProps = {
  active: SellerSection;
  onChange: (section: SellerSection) => void;
  /** Ventas pendientes de gestionar, para el badge de la pestaña Ventas. */
  salesCount?: number;
};

export function SellerSectionTabs({ active, onChange, salesCount = 0 }: SellerSectionTabsProps) {
  return (
    <View style={styles.row}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const showBadge = tab.key === 'sales' && salesCount > 0;

        return (
          <PressableScale
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={isActive ? colors.surface : colors.inkMuted}
            />
            <Text numberOfLines={1} style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            {showBadge && (
              <View style={[styles.badge, isActive && styles.badgeActive]}>
                <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>{salesCount}</Text>
              </View>
            )}
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 40,
    borderRadius: radii.pill,
    paddingHorizontal: 6,
  },
  tabActive: {
    backgroundColor: colors.ink,
  },
  label: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  labelActive: {
    color: colors.surface,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: radii.pill,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlue,
  },
  badgeActive: {
    backgroundColor: colors.surface,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextActive: {
    color: colors.ink,
  },
});
