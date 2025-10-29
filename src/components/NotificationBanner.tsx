import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { FontAwesomeIcon } from '../utils/icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../constants/spacing';

const { width } = Dimensions.get('window');

interface NotificationBannerProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  visible,
  title,
  message,
  onClose,
  duration = 5000,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Slide out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}>
      <View style={styles.banner}>
        <View style={styles.iconContainer}>
          <FontAwesomeIcon icon="bell" size={22} color={Colors.white} />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FontAwesomeIcon icon="times" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    minHeight: 70,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  message: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  closeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});

export default NotificationBanner;
