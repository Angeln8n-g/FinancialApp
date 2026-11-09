// Family Mint Design Tokens (conforme a DESIGN.md)

export const FamilyMint = {
  // Fondos y Superficies
  background: '#0A1128',
  surface: '#101A36',
  surfaceElevated: '#162347',
  surfaceActive: '#1D2D5A',
  
  // Bordes
  border: '#1E2B4D',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  
  // Acentos y Acciones
  primary: '#10B981',
  primaryHover: '#059669',
  primaryMuted: 'rgba(16, 185, 129, 0.15)',
  accentSaving: '#F59E0B',
  accentSavingMuted: 'rgba(245, 158, 11, 0.15)',
  
  // Estados Financieros
  income: '#10B981',
  incomeBg: 'rgba(16, 185, 129, 0.12)',
  expense: '#F43F5E',
  expenseBg: 'rgba(244, 63, 94, 0.12)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.12)',
  info: '#38BDF8',
  infoBg: 'rgba(56, 189, 248, 0.12)',
  
  // Textos y Contraste
  foreground: '#F8FAFC',
  foregroundMuted: '#94A3B8',
  foregroundSubtle: '#64748B',
};

export default {
  light: {
    text: FamilyMint.foreground,
    background: FamilyMint.background,
    tint: FamilyMint.primary,
    tabIconDefault: FamilyMint.foregroundSubtle,
    tabIconSelected: FamilyMint.primary,
  },
  dark: {
    text: FamilyMint.foreground,
    background: FamilyMint.background,
    tint: FamilyMint.primary,
    tabIconDefault: FamilyMint.foregroundSubtle,
    tabIconSelected: FamilyMint.primary,
  },
};
