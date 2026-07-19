import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors } from './colors';

export type AlertTone = 'success' | 'danger' | 'warning' | 'info' | 'question';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type TonePalette = {
  /** Relleno del roseton que corona la hoja. */
  badge: string;
  /** Color del icono dentro del roseton. */
  badgeInk: string;
  icon: IoniconName;
  /** Fondo del boton principal: casi negro salvo en acciones destructivas. */
  primary: string;
};

export const alertTones: Record<AlertTone, TonePalette> = {
  success: { badge: '#C9F169', badgeInk: '#14350B', icon: 'checkmark', primary: colors.ink },
  danger: { badge: '#FFD9DE', badgeInk: '#9F1239', icon: 'alert', primary: '#9F1239' },
  warning: { badge: '#FFE2A8', badgeInk: '#7A4E00', icon: 'warning', primary: colors.ink },
  info: { badge: colors.accentSoft, badgeInk: colors.brandBlue, icon: 'information', primary: colors.ink },
  question: { badge: colors.brandBlueSoft, badgeInk: colors.brandBlue, icon: 'help', primary: colors.ink },
};
