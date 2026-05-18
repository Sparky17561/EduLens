export const theme = {
  colors: {
    primary:   '#6366f1',
    primaryDim:'rgba(99,102,241,0.15)',
    accent:    '#8b5cf6',
    success:   '#22c55e',
    successDim:'rgba(34,197,94,0.1)',
    warning:   '#f59e0b',
    danger:    '#ef4444',
    dangerDim: 'rgba(239,68,68,0.1)',
    bg:        '#ffffff',
    surface:   '#f8fafc',
    card:      '#ffffff',
    border:    '#e2e8f0',
    text:      '#0f172a',
    textSub:   '#475569',
    textMuted: '#94a3b8',
    white:     '#ffffff'
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32
  },
  radius: {
    sm: 8, md: 12, lg: 16, xl: 24, full: 9999
  },
  font: {
    xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, xxl: 32
  },
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 8 }
  }
}

export type Theme = typeof theme
