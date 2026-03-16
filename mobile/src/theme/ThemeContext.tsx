import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as darkColors } from './colors';
import { lightColors } from './lightColors';

export type ThemeType = 'dark' | 'light';

type ThemeContextType = {
  theme: ThemeType;
  colors: typeof darkColors;
  setTheme: (t: ThemeType) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: darkColors,
  setTheme: () => {},
});

const STORAGE_KEY = 'app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved);
      }
    });
  }, []);

  const setTheme = (t: ThemeType) => {
    setThemeState(t);
    AsyncStorage.setItem(STORAGE_KEY, t);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
