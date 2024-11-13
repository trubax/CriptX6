import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeColor = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  divide: string;
  name: string;
};

export const themeColors: Record<string, ThemeColor> = {
  dark: {
    primary: '#1F2937',
    secondary: '#374151',
    accent: '#3B82F6',
    background: '#111827',
    text: '#FFFFFF',
    divide: '#374151',
    name: 'Scuro'
  },
  light: {
    primary: '#FFFFFF',
    secondary: '#F3F4F6',
    accent: '#3B82F6',
    background: '#F9FAFB',
    text: '#111827',
    divide: '#E5E7EB',
    name: 'Chiaro'
  },
  cyberpunk: {
    primary: '#0D0221',
    secondary: '#190535',
    accent: '#FF00FF',
    background: '#0A0118',
    text: '#00FF9F',
    divide: '#190535',
    name: 'Cyberpunk'
  },
  neonBlue: {
    primary: '#001B3D',
    secondary: '#002952',
    accent: '#00FFFF',
    background: '#001429',
    text: '#7DF9FF',
    divide: '#002952',
    name: 'Neon Blu'
  },
  synthwave: {
    primary: '#2B0F54',
    secondary: '#3B1B63',
    accent: '#FF00BB',
    background: '#1A0B33',
    text: '#FF71CE',
    divide: '#3B1B63',
    name: 'Synthwave'
  },
  matrix: {
    primary: '#0C1F0C',
    secondary: '#143814',
    accent: '#00FF41',
    background: '#0A1A0A',
    text: '#3CFF4B',
    divide: '#143814',
    name: 'Matrix'
  },
  neonPurple: {
    primary: '#1A0B2E',
    secondary: '#261447',
    accent: '#B400FF',
    background: '#130821',
    text: '#E100FF',
    divide: '#261447',
    name: 'Neon Viola'
  },
  retrowave: {
    primary: '#1F1135',
    secondary: '#2D1B47',
    accent: '#FF2A6D',
    background: '#160D26',
    text: '#05FFA1',
    divide: '#2D1B47',
    name: 'Retrowave'
  },
  neonOrange: {
    primary: '#2A1B0A',
    secondary: '#3D2914',
    accent: '#FF6B00',
    background: '#1F1408',
    text: '#FFB847',
    divide: '#3D2914',
    name: 'Neon Arancio'
  },
  futureGreen: {
    primary: '#0A2A1B',
    secondary: '#143D29',
    accent: '#00FF9D',
    background: '#081F14',
    text: '#47FFB8',
    divide: '#143D29',
    name: 'Future Green'
  }
};

type Theme = keyof typeof themeColors;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeColors: Record<string, ThemeColor>;
  currentTheme: ThemeColor;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve essere utilizzato all\'interno di un ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    // Applica le variabili CSS del tema
    const root = document.documentElement;
    const colors = themeColors[theme];
    
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--text', colors.text);
    root.style.setProperty('--divide', colors.divide);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      themeColors,
      currentTheme: themeColors[theme]
    }}>
      <div className="theme-transition theme-bg theme-text min-h-screen">
        {children}
      </div>
    </ThemeContext.Provider>
  );
};