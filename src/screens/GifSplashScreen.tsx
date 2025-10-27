import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';

interface GifSplashScreenProps {
  onAnimationFinish: () => void;
}

const { width, height } = Dimensions.get('window');

const GifSplashScreen: React.FC<GifSplashScreenProps> = ({ onAnimationFinish }) => {
  useEffect(() => {
    // Simple timer - GIF plays once and navigates
    const timer = setTimeout(() => {
      onAnimationFinish();
    }, 8000); // 8 seconds - enough for GIF to play once

    return () => clearTimeout(timer);
  }, [onAnimationFinish]);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      {/* ONLY the GIF - simple and working */}
      <Image
        source={require('../assets/gif/splashscreen.gif')}
        style={styles.gifBackground}
        resizeMode="contain"
        fadeDuration={0}
        onError={(error) => {
          console.log('GIF Error:', error);
          onAnimationFinish();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gifBackground: {
    width: width,
    height: height,
    position: 'absolute',
  },
});

export default GifSplashScreen;
