import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '../utils/icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, BorderRadius } from '../constants/spacing';

interface SplashScreenProps {
  onAnimationFinish: () => void;
}

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationFinish }) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  
  // Floating icons animations
  const icon1Anim = useRef(new Animated.Value(0)).current;
  const icon2Anim = useRef(new Animated.Value(0)).current;
  const icon3Anim = useRef(new Animated.Value(0)).current;
  const icon4Anim = useRef(new Animated.Value(0)).current;
  const icon5Anim = useRef(new Animated.Value(0)).current;
  const icon6Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start all animations
    const startAnimations = () => {
      // Main content animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Floating icons animations (staggered)
      const iconAnimations = [
        { anim: icon1Anim, delay: 200, fromX: -100, fromY: -100 },
        { anim: icon2Anim, delay: 400, fromX: 100, fromY: -100 },
        { anim: icon3Anim, delay: 600, fromX: -100, fromY: 100 },
        { anim: icon4Anim, delay: 800, fromX: 100, fromY: 100 },
        { anim: icon5Anim, delay: 1000, fromX: -150, fromY: 0 },
        { anim: icon6Anim, delay: 1200, fromX: 150, fromY: 0 },
      ];

      iconAnimations.forEach(({ anim, delay, fromX, fromY }) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          delay,
          useNativeDriver: true,
        }).start();
      });

      // Navigate after animations complete
      setTimeout(() => {
        onAnimationFinish();
      }, 3000);
    };

    startAnimations();
  }, [fadeAnim, scaleAnim, slideUpAnim, icon1Anim, icon2Anim, icon3Anim, icon4Anim, icon5Anim, icon6Anim, onAnimationFinish]);

  const FloatingIcon = ({ 
    icon, 
    color, 
    size, 
    style, 
    animValue, 
    fromX, 
    fromY 
  }: {
    icon: string;
    color: string;
    size: number;
    style: any;
    animValue: Animated.Value;
    fromX: number;
    fromY: number;
  }) => (
    <Animated.View
      style={[
        style,
        {
          opacity: animValue,
          transform: [
            {
              translateX: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [fromX, 0],
              }),
            },
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [fromY, 0],
              }),
            },
            {
              scale: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.floatingIconContainer, { backgroundColor: color + '20' }]}>
        <FontAwesomeIcon icon={icon} size={size} color={color} />
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primary, '#1a365d']}
        style={styles.gradient}
      >
        {/* Floating Icons */}
        <FloatingIcon
          icon="user-md"
          color={Colors.white}
          size={24}
          style={[styles.floatingIcon, styles.topLeft]}
          animValue={icon1Anim}
          fromX={-100}
          fromY={-100}
        />
        <FloatingIcon
          icon="stethoscope"
          color={Colors.success}
          size={20}
          style={[styles.floatingIcon, styles.topRight]}
          animValue={icon2Anim}
          fromX={100}
          fromY={-100}
        />
        <FloatingIcon
          icon="heartbeat"
          color={Colors.error}
          size={22}
          style={[styles.floatingIcon, styles.bottomLeft]}
          animValue={icon3Anim}
          fromX={-100}
          fromY={100}
        />
        <FloatingIcon
          icon="pills"
          color={Colors.warning}
          size={18}
          style={[styles.floatingIcon, styles.bottomRight]}
          animValue={icon4Anim}
          fromX={100}
          fromY={100}
        />
        <FloatingIcon
          icon="ambulance"
          color={Colors.info}
          size={20}
          style={[styles.floatingIcon, styles.leftCenter]}
          animValue={icon5Anim}
          fromX={-150}
          fromY={0}
        />
        <FloatingIcon
          icon="syringe"
          color={Colors.white}
          size={16}
          style={[styles.floatingIcon, styles.rightCenter]}
          animValue={icon6Anim}
          fromX={150}
          fromY={0}
        />

        {/* Main Content */}
        <Animated.View
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideUpAnim },
              ],
            },
          ]}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* App Name */}
          <Text style={styles.appName}>On Demand</Text>
          
          {/* Tagline */}
          <Text style={styles.tagline}>Clinical Professionals</Text>

          {/* Loading Indicator */}
          <View style={styles.loadingContainer}>
            <View style={styles.loadingDot} />
            <View style={styles.loadingDot} />
            <View style={styles.loadingDot} />
          </View>
        </Animated.View>

        {/* Bottom Decoration */}
        <View style={styles.bottomDecoration}>
          <View style={styles.wave} />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  floatingIcon: {
    position: 'absolute',
  },
  floatingIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  topLeft: {
    top: height * 0.15,
    left: width * 0.1,
  },
  topRight: {
    top: height * 0.2,
    right: width * 0.15,
  },
  bottomLeft: {
    bottom: height * 0.25,
    left: width * 0.12,
  },
  bottomRight: {
    bottom: height * 0.2,
    right: width * 0.1,
  },
  leftCenter: {
    top: height * 0.4,
    left: width * 0.05,
  },
  rightCenter: {
    top: height * 0.35,
    right: width * 0.08,
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  appName: {
    fontSize: 42,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Spacing.xl,
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    opacity: 0.7,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
});

export default SplashScreen;
