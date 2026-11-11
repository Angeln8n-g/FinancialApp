'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 'mint' | 'warm-espresso' | 'warm-copper' | 'warm-olive' | 'warm-ivory';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  bgHex: string;
  surfaceHex: string;
  accentHex: string;
  accentHoverHex: string;
  borderHex: string;
  isLight?: boolean;
}

export const THEMES: ThemeOption[] = [
  {
    id: 'warm-espresso',
    name: 'Ámbar & Café Ejecutivo',
    subtitle: 'Warm Espresso & Gold • Descanso visual y solidez',
    badge: 'Cálido Pro',
    description: 'Tonos espresso y oro cálido. Ideal para sesiones prolongadas y confort visual nocturno.',
    bgHex: '#120F0D',
    surfaceHex: '#1A1613',
    accentHex: '#F59E0B',
    accentHoverHex: '#D97706',
    borderHex: '#362C24',
  },
  {
    id: 'warm-copper',
    name: 'Cobre & Nogal Real',
    subtitle: 'Warm Copper & Terracotta • Lujo y distinción artesanal',
    badge: 'Cálido Cobre',
    description: 'Inspirado en terracota toscana, cobre cepillado y nogal ahumado. Estética cálida y distinguida.',
    bgHex: '#14100F',
    surfaceHex: '#1E1816',
    accentHex: '#EA580C',
    accentHoverHex: '#C2410C',
    borderHex: '#42322E',
  },
  {
    id: 'warm-olive',
    name: 'Champagne & Bosque Cálido',
    subtitle: 'Warm Forest & Champagne • Estilo banca patrimonial',
    badge: 'Prestigio',
    description: 'Verde bosque alpino profundo con acentos champagne metálico. Serenidad y alta gestión patrimonial.',
    bgHex: '#0F120F',
    surfaceHex: '#171B17',
    accentHex: '#EAB308',
    accentHoverHex: '#CA8A04',
    borderHex: '#353F35',
  },
  {
    id: 'warm-ivory',
    name: 'Marfil & Cuero Pergamino',
    subtitle: 'Executive Warm Ivory • Papel pergamino satinado',
    badge: 'Modo Día',
    description: 'Modo claro ejecutivo en tonos marfil, lino y cuero ámbar. Cero reflejos agresivos con máxima legibilidad.',
    bgHex: '#F6F3EC',
    surfaceHex: '#FFFFFF',
    accentHex: '#B45309',
    accentHoverHex: '#92400E',
    borderHex: '#DCD3C3',
    isLight: true,
  },
  {
    id: 'mint',
    name: 'Family Mint (Original)',
    subtitle: 'Azul Noche Profundo & Menta Esmeralda',
    badge: 'Clásico',
    description: 'La estética emblemática de HogarIQ. Azul noche profundo de alta fidelidad con acentos esmeralda nítidos.',
    bgHex: '#0A1128',
    surfaceHex: '#101A36',
    accentHex: '#10B981',
    accentHoverHex: '#059669',
    borderHex: '#1E2B4D',
  },
];

interface ThemeContextType {
  theme: ThemeId;
  currentTheme: ThemeOption;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeOption[];
}

const defaultThemeOption = THEMES[0]; // warm-espresso

const ThemeContext = createContext<ThemeContextType>({
  theme: 'warm-espresso',
  currentTheme: defaultThemeOption,
  setTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('warm-espresso');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('hogariq_theme') as ThemeId) || 'warm-espresso';
    const validTheme = THEMES.some(t => t.id === savedTheme) ? savedTheme : 'warm-espresso';
    setThemeState(validTheme);
    document.documentElement.setAttribute('data-theme', validTheme);
  }, []);

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem('hogariq_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const currentTheme = THEMES.find((t) => t.id === theme) || defaultThemeOption;

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
