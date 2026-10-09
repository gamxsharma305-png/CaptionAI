// Dark pro theme for CaptionAI.
export const theme = {
  colors: {
    background: '#0B0B10',
    surface: '#13131B',
    card: '#1A1A26',
    border: '#2A2A38',
    text: '#FFFFFF',
    muted: '#9CA3AF',
    primary: '#E8FF47',
    secondary: '#8B5CF6',
    danger: '#FF5C5C',
    gold: '#FFC531',
    teal: '#2DD4BF',
    mint: '#34D399',
    sky: '#38BDF8',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    full: 999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
  },
} as const;

export type Theme = typeof theme;
