// Modern design system for Tech Support App — supports dark + light mode

// ─── Shared design tokens ────────────────────────────────────
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, full: 999,
};

// ─── Light palette ───────────────────────────────────────────
const lightColors = {
  mode: 'light',

  // Primary brand
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',

  // Gradients [start, end]
  gradientPrimary: ['#3B82F6', '#2563EB'],
  gradientHeader: ['#2563EB', '#1E40AF'],
  gradientDanger: ['#F87171', '#EF4444'],
  gradientWarning: ['#FBBF24', '#F59E0B'],
  gradientSuccess: ['#34D399', '#10B981'],
  gradientInfo: ['#60A5FA', '#3B82F6'],
  gradientPurple: ['#A78BFA', '#8B5CF6'],

  // Role accents
  support: '#2563EB',
  manager: '#7C3AED',
  fse: '#059669',

  // Neutrals
  bg: '#F8FAFC',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  onGradient: '#FFFFFF',

  // Status
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  info: '#3B82F6',
  infoBg: '#DBEAFE',
  purple: '#8B5CF6',
  purpleBg: '#EDE9FE',
};

// ─── Dark palette (matches reference design) ─────────────────
const darkColors = {
  mode: 'dark',

  // Primary brand
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#1E293B',

  // Gradients [start, end]
  gradientPrimary: ['#3B82F6', '#1D4ED8'],
  gradientHeader: ['#1E3A8A', '#0F172A'],
  gradientDanger: ['#EF4444', '#B91C1C'],
  gradientWarning: ['#F59E0B', '#B45309'],
  gradientSuccess: ['#10B981', '#047857'],
  gradientInfo: ['#3B82F6', '#1D4ED8'],
  gradientPurple: ['#8B5CF6', '#6D28D9'],

  // Role accents
  support: '#3B82F6',
  manager: '#A78BFA',
  fse: '#34D399',

  // Neutrals
  bg: '#0A0E1A',
  bgElevated: '#111827',
  surface: '#151C2C',
  surfaceAlt: '#1E2740',
  border: '#243049',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textLight: '#64748B',
  onGradient: '#FFFFFF',

  // Status
  success: '#34D399',
  successBg: '#0C3D30',
  warning: '#FBBF24',
  warningBg: '#3D2E0C',
  danger: '#F87171',
  dangerBg: '#3D1414',
  info: '#60A5FA',
  infoBg: '#12294D',
  purple: '#A78BFA',
  purpleBg: '#2A1E4D',
};

// Shadows depend on mode (glow for dark, soft for light)
const makeShadow = (isDark) => {
  const shadowColor = isDark ? '#000000' : '#0F172A';
  return {
    sm: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.4 : 0.06,
      shadowRadius: isDark ? 6 : 3,
      elevation: 2,
    },
    md: {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.5 : 0.08,
      shadowRadius: isDark ? 16 : 12,
      elevation: 4,
    },
    lg: {
      shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.6 : 0.12,
      shadowRadius: isDark ? 28 : 24,
      elevation: 8,
    },
    // Colored glow for accent elements
    glow: (color) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isDark ? 0.55 : 0.35,
      shadowRadius: isDark ? 16 : 10,
      elevation: 6,
    }),
  };
};

export const palettes = {
  light: lightColors,
  dark: darkColors,
};

export const shadows = {
  light: makeShadow(false),
  dark: makeShadow(true),
};

// ─── Backwards-compatible default exports (light) ────────────
// Existing screens import { colors, shadow } directly. Keep them working
// by defaulting to the light palette until they migrate to useTheme().
export const colors = lightColors;
export const shadow = makeShadow(false);
