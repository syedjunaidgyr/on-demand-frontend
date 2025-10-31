import { Colors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';

export const useAppColors = () => {
  const { theme } = useTheme();
  // Merge: fallback to existing Colors, override with theme if provided
  const merged = {
    primary: theme?.primaryColor || (Colors as any).primary,
    secondary: theme?.secondaryColor || (Colors as any).secondary || (Colors as any).primary,
    background: theme?.backgroundColor || (Colors as any).background,
    textPrimary: theme?.textColor || (Colors as any).textPrimary,
    accentText: theme?.accentTextColor || (Colors as any).white,
    // pass-through commonly used constants to avoid breakage
    white: (Colors as any).white,
    border: (Colors as any).border,
    textSecondary: (Colors as any).textSecondary,
  };
  return merged as typeof Colors & {
    primary: string;
    secondary: string;
    background: string;
    textPrimary: string;
    textSecondary: string;
    white: string;
    border: string;
    accentText: string;
  };
};


