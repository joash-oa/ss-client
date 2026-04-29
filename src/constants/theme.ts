// src/constants/theme.ts
export const colors = {
  bg:           '#0f0f1a',
  bgCard:       '#1a1a2e',
  primary:      '#4361EE',
  primaryLight: '#6d87f5',
  accent:       '#4CC9F0',
  purple:       '#7209B7',
  star:         '#FFD166',
  success:      '#06D6A0',
  error:        '#EF233C',
  textPrimary:  '#FFFFFF',
  textSecondary:'#a0a0c8',
  textMuted:    '#5a5a8a',
  border:       '#2d2d44',
} as const

export const fonts = {
  regular:   'Nunito_400Regular',
  semibold:  'Nunito_600SemiBold',
  bold:      'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black:     'Nunito_900Black',
} as const

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
} as const
