import { StyleSheet } from 'react-native';
import { useAppColors } from '../hooks/useAppColors';

export const useGlobalStyles = () => {
  const c = useAppColors();
  return StyleSheet.create({
    appBackground: { flex: 1, backgroundColor: c.background },
    textPrimary: { color: c.textPrimary },
    textSecondary: { color: c.textSecondary },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    primaryButton: {
      backgroundColor: c.primary,
      borderRadius: 10,
    },
    primaryButtonText: {
      color: c.accentText,
    },
  });
};


