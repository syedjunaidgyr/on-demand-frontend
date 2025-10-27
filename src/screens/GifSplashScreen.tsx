import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';
import { FontAwesomeIcon } from '../utils/icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing } from '../constants/spacing';

interface GifSplashScreenProps {
  onAnimationFinish: () => void;
}

const { width, height } = Dimensions.get('window');

const GifSplashScreen: React.FC<GifSplashScreenProps> = ({ onAnimationFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const skipButtonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    const startAnimations = () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Show skip button after 1 second
      setTimeout(() => {
        Animated.timing(skipButtonAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 1000);

      // Auto navigate after GIF duration (adjust based on your GIF length)
      setTimeout(() => {
        onAnimationFinish();
      }, 4000); // 4 seconds - adjust this based on your GIF duration
    };

    startAnimations();
  }, [fadeAnim, scaleAnim, skipButtonAnim, onAnimationFinish]);

  const handleSkip = () => {
    onAnimationFinish();
  };

  return (
    <View style={styles.container}>
      {/* GIF Background */}
      <Image
        source={require('../assets/gif/splashscreen.gif')}
        style={styles.gifBackground}
        resizeMode="cover"
      />

      {/* Overlay for better text visibility */}
      <View style={styles.overlay} />

      {/* Main Content */}
      <Animated.View
        style={[
          styles.mainContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* App Name */}
        <Text style={styles.appName}>Locum</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>On Demand Healthcare</Text>
        
        {/* Tagline */}
        <Text style={styles.tagline}>Clinical Professionals</Text>
      </Animated.View>

      {/* Skip Button */}
      <Animated.View
        style={[
          styles.skipButtonContainer,
          {
            opacity: skipButtonAnim,
            transform: [
              {
                translateY: skipButtonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <FontAwesomeIcon icon="times" size={16} color={Colors.white} />
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDot} />
        <View style={styles.loadingDot} />
        <View style={styles.loadingDot} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gifBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent overlay for better text visibility
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  appName: {
    fontSize: 48,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.95,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Spacing.xl,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  skipButtonContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 20,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  skipButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    zIndex: 10,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    opacity: 0.8,
  },
});

export default GifSplashScreen;
