import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, shadows, spacing, radius } from '../theme';

const STORAGE_KEY = '@techsupport_theme_mode';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('dark'); // default to dark (matches design)
  const [hydrated, setHydrated] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') setMode(saved);
      } catch (e) {
        // ignore, fall back to default
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const setThemeMode = async (next) => {
    setMode(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      // ignore persistence failure
    }
  };

  const toggleTheme = () => setThemeMode(mode === 'dark' ? 'light' : 'dark');

  const value = useMemo(() => {
    const isDark = mode === 'dark';
    return {
      mode,
      isDark,
      colors: palettes[mode],
      shadow: shadows[mode],
      spacing,
      radius,
      toggleTheme,
      setThemeMode,
      hydrated,
    };
  }, [mode, hydrated]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
