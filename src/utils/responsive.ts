import { scale, moderateScale, verticalScale, moderateVerticalScale } from 'react-native-size-matters';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Dimensions } from 'react-native';

/**
 * Global Responsive Utility
 * 
 * Provides consistent responsive scaling across all devices (Android & iOS)
 * Use this instead of hardcoded values for better cross-device compatibility
 * 
 * Usage Examples:
 * - Responsive.scale(16) - Scales for width
 * - Responsive.verticalScale(50) - Scales for height
 * - Responsive.moderateScale(20) - Scales with moderation factor
 * - Responsive.wp('50%') - Width percentage
 * - Responsive.hp('25%') - Height percentage
 */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard design dimensions (reference device - iPhone X/11)
const STANDARD_WIDTH = 375;
const STANDARD_HEIGHT = 812;

export const Responsive = {
  /**
   * Scale function - Scales based on width
   * Best for: widths, horizontal spacing, font sizes
   * @param size - The size to scale
   * @returns Scaled size
   */
  scale: (size: number): number => scale(size),

  /**
   * Vertical Scale function - Scales based on height
   * Best for: heights, vertical spacing
   * @param size - The size to scale
   * @returns Scaled size
   */
  verticalScale: (size: number): number => verticalScale(size),

  /**
   * Moderate Scale - Scales with moderation factor (recommended for fonts)
   * Reduces the scaling factor to prevent overly large text on tablets
   * Best for: font sizes, icon sizes
   * @param size - The size to scale
   * @param factor - Moderation factor (default: 0.5)
   * @returns Scaled size
   */
  moderateScale: (size: number, factor: number = 0.5): number => moderateScale(size, factor),

  /**
   * Moderate Vertical Scale - Scales height with moderation factor
   * Best for: vertical spacing that shouldn't scale too much
   * @param size - The size to scale
   * @param factor - Moderation factor (default: 0.5)
   * @returns Scaled size
   */
  moderateVerticalScale: (size: number, factor: number = 0.5): number => moderateVerticalScale(size, factor),

  /**
   * Width Percentage - Converts percentage to width pixels
   * Best for: responsive widths, margins, padding
   * @param percent - Percentage as string (e.g., '50%') or number (e.g., 50)
   * @returns Pixel value
   */
  wp: (percent: string | number): number => {
    if (typeof percent === 'string') {
      return wp(percent);
    }
    return wp(`${percent}%`);
  },

  /**
   * Height Percentage - Converts percentage to height pixels
   * Best for: responsive heights, vertical spacing
   * @param percent - Percentage as string (e.g., '25%') or number (e.g., 25)
   * @returns Pixel value
   */
  hp: (percent: string | number): number => {
    if (typeof percent === 'string') {
      return hp(percent);
    }
    return hp(`${percent}%`);
  },

  /**
   * Get current screen width
   */
  getScreenWidth: (): number => SCREEN_WIDTH,

  /**
   * Get current screen height
   */
  getScreenHeight: (): number => SCREEN_HEIGHT,

  /**
   * Check if device is small screen
   */
  isSmallScreen: (): boolean => SCREEN_HEIGHT < 700,

  /**
   * Check if device is large screen (tablet)
   */
  isLargeScreen: (): boolean => SCREEN_WIDTH > 768,

  /**
   * Check if device is tablet
   */
  isTablet: (): boolean => SCREEN_WIDTH >= 768,

  /**
   * Get responsive font size
   * Applies moderate scaling to prevent oversized text
   */
  fontSize: (size: number): number => moderateScale(size, 0.3),

  /**
   * Get responsive spacing
   * Uses standard scale for consistent spacing
   */
  spacing: (size: number): number => scale(size),

  /**
   * Get responsive icon size
   * Uses moderate scale for icons
   */
  iconSize: (size: number): number => moderateScale(size, 0.5),
};

// Export common responsive values
export const ResponsiveValues = {
  // Common font sizes
  fontSize: {
    xs: Responsive.moderateScale(12, 0.3),
    sm: Responsive.moderateScale(14, 0.3),
    base: Responsive.moderateScale(16, 0.3),
    lg: Responsive.moderateScale(18, 0.3),
    xl: Responsive.moderateScale(20, 0.3),
    '2xl': Responsive.moderateScale(24, 0.3),
    '3xl': Responsive.moderateScale(28, 0.3),
    '4xl': Responsive.moderateScale(32, 0.3),
    '5xl': Responsive.moderateScale(36, 0.3),
  },

  // Common spacing values
  spacing: {
    xs: Responsive.scale(4),
    sm: Responsive.scale(8),
    md: Responsive.scale(16),
    lg: Responsive.scale(24),
    xl: Responsive.scale(32),
    '2xl': Responsive.scale(40),
    '3xl': Responsive.scale(48),
    '4xl': Responsive.scale(64),
    '5xl': Responsive.scale(80),
  },

  // Common icon sizes
  iconSize: {
    xs: Responsive.moderateScale(12, 0.5),
    sm: Responsive.moderateScale(16, 0.5),
    md: Responsive.moderateScale(20, 0.5),
    lg: Responsive.moderateScale(24, 0.5),
    xl: Responsive.moderateScale(28, 0.5),
    '2xl': Responsive.moderateScale(32, 0.5),
  },
};

export default Responsive;

