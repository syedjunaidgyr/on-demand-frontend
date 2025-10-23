import { Platform } from 'react-native';

export const Typography = {
  // Font families - Updated with DM Sans with fallbacks
  fontFamily: {
    regular: Platform.select({
      ios: 'DMSans-Regular',
      android: 'DMSans-Regular',
    }),
    medium: Platform.select({
      ios: 'DMSans-Medium',
      android: 'DMSans-Medium',
    }),
    bold: Platform.select({
      ios: 'DMSans-Bold',
      android: 'DMSans-Bold',
    }),
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },

  // Line heights
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 40,
    '4xl': 44,
    '5xl': 48,
  },

  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Predefined text styles for consistency (optional but recommended)
  textStyles: {
    header: {
      fontFamily: Platform.select({
        ios: 'DMSans-Bold',
        android: 'DMSans-Bold',
      }),
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700' as const,
    },
    title: {
      fontFamily: Platform.select({
        ios: 'DMSans-Medium',
        android: 'DMSans-Medium',
      }),
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '500' as const,
    },
    subtitle: {
      fontFamily: Platform.select({
        ios: 'DMSans-Regular',
        android: 'DMSans-Regular',
      }),
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    body: {
      fontFamily: Platform.select({
        ios: 'DMSans-Regular',
        android: 'DMSans-Regular',
      }),
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    button: {
      fontFamily: Platform.select({
        ios: 'DMSans-Medium',
        android: 'DMSans-Medium',
      }),
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500' as const,
    },
    caption: {
      fontFamily: Platform.select({
        ios: 'DMSans-Regular',
        android: 'DMSans-Regular',
      }),
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
  },
};