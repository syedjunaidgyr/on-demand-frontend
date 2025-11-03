import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HospitalAdminApi from '../services/hospitalAdminApi';

export type AppTheme = {
  name?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentTextColor: string;
};

const DEFAULT_THEME: AppTheme = {
  name: 'Default',
  primaryColor: '#1C2A3A',
  secondaryColor: '#3B82F6',
  backgroundColor: '#F3F9FF',
  textColor: '#111827',
  accentTextColor: '#FFFFFF',
};

type ThemeContextType = {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  loadAndApplyDefaultTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(DEFAULT_THEME);

  useEffect(() => {
    (async () => {
      const cached = await AsyncStorage.getItem('hospital_theme');
      if (cached) setThemeState(JSON.parse(cached));
    })();
  }, []);

  const setTheme = useCallback(async (t: AppTheme) => {
    setThemeState(t);
    await AsyncStorage.setItem('hospital_theme', JSON.stringify(t));
  }, []);

  const loadAndApplyDefaultTheme = useCallback(async () => {
    try {
      const res = await HospitalAdminApi.getThemes();
      // Expected formats: { themes: [...], current: {id:..} } OR array
      const themes = res?.themes || res || [];
      const current = res?.current;
      const currentObj = current
        ? themes.find((x: any) => x.id === current.id || x.name === current)
        : null;
      if (currentObj) {
        const applied: AppTheme = {
          name: currentObj.name,
          primaryColor: currentObj.primaryColor,
          secondaryColor: currentObj.secondaryColor,
          backgroundColor: currentObj.backgroundColor,
          textColor: currentObj.textColor,
          accentTextColor: currentObj.accentTextColor,
        };
        await setTheme(applied);
      }
    } catch {
      // ignore, keep default
    }
  }, [setTheme]);

  const value = useMemo(() => ({ theme, setTheme, loadAndApplyDefaultTheme }), [theme, setTheme, loadAndApplyDefaultTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};


