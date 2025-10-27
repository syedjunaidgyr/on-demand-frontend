import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  Text,
  Animated,
} from 'react-native';

interface SimpleSplashScreenProps {
  onAnimationFinish: () => void;
}

const { width, height } = Dimensions.get('window');

const SimpleSplashScreen: React.FC<SimpleSplashScreenProps> = ({ onAnimationFinish }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Auto navigate after 3 seconds
    const timer = setTimeout(() => {
      onAnimationFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onAnimationFinish, fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo */}
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        {/* App Name */}
        <Text style={styles.appName}>Locum Healthcare</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>Connecting Healthcare Professionals</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C2A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.4,
    height: height * 0.2,
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '400',
  },
});

export default SimpleSplashScreen;
