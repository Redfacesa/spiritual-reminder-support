// Centralized design tokens so every screen shares a consistent, modern look.

export const colors = {
  // Brand
  primary: '#5B5BD6',
  primaryDark: '#3F3FB0',
  primaryLight: '#EEEEFB',
  accent: '#9370DB',

  // Surfaces
  background: '#F5F6FB',
  card: '#FFFFFF',
  cardAlt: '#FAFAFE',

  // Text
  text: '#16182B',
  textMuted: '#6B6E82',
  textFaint: '#9CA0B3',
  onPrimary: '#FFFFFF',

  // Lines
  border: '#ECEDF4',

  // Status
  success: '#22C55E',
  successSoft: '#E9FBF0',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerSoft: '#FDECEC',
  gold: '#E0A800',
  goldSoft: '#FFF6DB',
  streak: '#FF7A45',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textFaint },
};

export const shadow = {
  card: {
    shadowColor: '#1B1C3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  soft: {
    shadowColor: '#1B1C3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};
