import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export default function useShimmer(duration = 1500, width = 500) {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: width * 1.5,
        duration,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => {
      animation.stop();
      translateX.setValue(-width);
    };
  }, [duration, width]);

  return translateX;
}

