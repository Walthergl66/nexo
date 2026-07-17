export const colors = {
  background: '#F3F6F9',
  surface: '#FFFFFF',
  surfaceMuted: '#F6F9FB',
  surfaceSoft: '#EDF2F7',
  ink: '#0B2239',
  inkMuted: '#5A7085',
  inkSoft: '#93A3B2',
  // Bordes muy tenues: en un estilo minimalista casi no se perciben.
  line: '#E9EEF3',
  lineStrong: '#D7E0E8',
  primary: '#064F9E',
  primarySoft: '#0B3766',
  brandBlue: '#064F9E',
  brandAccent: '#00AEEF',
  brandBlueSoft: '#E9F3FB',
  brandBlueMuted: '#557A9D',
  brandBlueLine: '#CBE4F5',
  silver: '#BBC9D5',
  silverSoft: '#EDF3F7',
  accent: '#63BEE8',
  accentSoft: '#DDF3FD',
  popCoral: '#FF6B6B',
  popYellow: '#FFD166',
  popMint: '#57D6C7',
  popLavender: '#A78BFA',
  success: '#E8F5F2',
  warning: '#FFF4DD',
};

export const radii = {
  small: 12,
  medium: 16,
  large: 22,
  pill: 999,
};

/**
 * Escala de espaciado (múltiplos de 4). Usar estos tokens en vez de números
 * sueltos mantiene el ritmo vertical y los márgenes consistentes.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

/**
 * Escala tipográfica. La jerarquía se construye con tamaño + peso + color,
 * no con bordes ni fondos: base de un estilo limpio y minimalista.
 */
export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const },
  subtitle: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
  micro: { fontSize: 10, lineHeight: 13, fontWeight: '700' as const },
};

export const shadows = {
  // Sombra apenas perceptible para inputs y chips sobre fondo claro.
  subtle: {
    shadowColor: '#0B3766',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  card: {
    shadowColor: '#0B3766',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  floating: {
    shadowColor: '#0B3766',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
};
