'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 'mint' | 'warm-espresso' | 'warm-copper' | 'warm-olive' | 'warm-ivory';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  subtitle: string;
  badge: string;
  bgHex: string;
  surfaceHex: string;
  accentHex: string;
  borderHex: string;
  isLight?: boolean;
}

export const THEMES: ThemeOption[] = [
  {
    id: 'warm-espresso',
    name: 'Ámbar & Café Ejecutivo',
    subtitle: 'Warm Espresso & Gold • Descanso visual y solidez',
    badge: 'Cálido Pro',
    bgHex: '#14110E',
    surfaceHex: '#1D1814',
    accentHex: '#F59E0B',
    borderHex: '#3C3229',
  },
  {
    id: 'warm-copper',
    name: 'Cobre & Nogal Real',
    subtitle: 'Warm Copper & Terracotta • Lujo y distinción',
    badge: 'Cálido Cobre',
    bgHex: '#161312',
    surfaceHex: '#221C1A',
    accentHex: '#EA580C',
    borderHex: '#463833',
  },
  {
    id: 'warm-olive',
    name: 'Champagne & Bosque Cálido',
    subtitle: 'Warm Forest & Champagne • Estilo banca patrimonial',
    badge: 'Prestigio',
    bgHex: '#121412',
    surfaceHex: '#1A1E1A',
    accentHex: '#EAB308',
    borderHex: '#3B443B',
  },
  {
    id: 'warm-ivory',
    name: 'Marfil & Cuero Pergamino',
    subtitle: 'Executive Warm Ivory • Modo claro relajante para el día',
    badge: 'Modo Día',
    bgHex: '#F7F4EE',
    surfaceHex: '#FFFFFF',
    accentHex: '#B45309',
    borderHex: '#DDD6C8',
    isLight: true,
  },
  {
    id: 'mint',
    name: 'Family Mint (Original)',
    subtitle: 'Azul Noche Profundo & Menta Esmeralda',
    badge: 'Clásico',
    bgHex: '#0A1128',
    surfaceHex: '#101A36',
    accentHex: '#10B981',
    borderHex: '#1E2B4D',
  },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'warm-espresso',
  setTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('warm-espresso');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('hogariq_theme') as ThemeId) || 'warm-espresso';
    setThemeState(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem('hogariq_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
