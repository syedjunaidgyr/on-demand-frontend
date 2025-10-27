import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Video from 'react-native-video';

interface VideoSplashScreenProps {
  onAnimationFinish: () => void;
}

const { width, height } = Dimensions.get('window');

const VideoSplashScreen: React.FC<VideoSplashScreenProps> = ({ onAnimationFinish }) => {
  useEffect(() => {
    // Auto navigate after video duration
    const timer = setTimeout(() => {
      onAnimationFinish();
    }, 4000); // 4 seconds

    return () => clearTimeout(timer);
  }, [onAnimationFinish]);

  return (
    <View style={styles.container}>
      {/* Video Background - ONLY the video */}
      <Video
        source={require('../assets/gif/splashscreen.mp4')} // Convert your GIF to MP4
        style={styles.videoBackground}
        resizeMode="cover"
        repeat={true}
        muted={true}
        paused={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoBackground: {
    width: width,
    height: height,
  },
});

export default VideoSplashScreen;
