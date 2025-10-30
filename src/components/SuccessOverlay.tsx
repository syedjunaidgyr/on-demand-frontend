import React, { useEffect, useRef } from 'react';
import { Modal, Animated, View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '../utils/icons';
import Responsive from '../utils/responsive';
import { Typography } from '../constants/typography';

interface SuccessOverlayProps {
  visible: boolean;
  title?: string;
  message?: string;
  durationMs?: number;
  onDismiss?: () => void;
}

const SuccessOverlay: React.FC<SuccessOverlayProps> = ({
  visible,
  title = 'Success!',
  message = 'Operation completed successfully',
  durationMs = 2000,
  onDismiss,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();

      timeout = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
        ]).start(() => {
          onDismiss && onDismiss();
        });
      }, durationMs);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [visible, durationMs, fadeAnim, scaleAnim, onDismiss]);

  return (
    <Modal transparent={false} visible={visible} animationType="none" onRequestClose={() => {}}>
      <Animated.View style={[styles.fullscreen, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.iconContainer}>
            <FontAwesomeIcon icon="check-circle" size={Responsive.iconSize(80)} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.regular,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
  },
});

export default SuccessOverlay;


