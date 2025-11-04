import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, TouchableWithoutFeedback, StyleSheet, Modal } from 'react-native';
import { FontAwesomeIcon } from '../utils/icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import Responsive from '../utils/responsive';

type ErrorModalProps = {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
};

const ErrorModal: React.FC<ErrorModalProps> = ({ visible, title = 'Error', message, onClose }) => {
  const { height } = Dimensions.get('window');
  const slideAnim = useRef(new Animated.Value(height)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;
  const sparkle4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
      Animated.spring(iconScale, { toValue: 1, useNativeDriver: true }).start();
      setTimeout(() => Animated.spring(sparkle1, { toValue: 1, useNativeDriver: true }).start(), 50);
      setTimeout(() => Animated.spring(sparkle2, { toValue: 1, useNativeDriver: true }).start(), 120);
      setTimeout(() => Animated.spring(sparkle3, { toValue: 1, useNativeDriver: true }).start(), 180);
      setTimeout(() => Animated.spring(sparkle4, { toValue: 1, useNativeDriver: true }).start(), 240);
    } else {
      slideAnim.setValue(height);
      iconScale.setValue(0);
      sparkle1.setValue(0);
      sparkle2.setValue(0);
      sparkle3.setValue(0);
      sparkle4.setValue(0);
    }
  }, [visible, height, slideAnim, iconScale, sparkle1, sparkle2, sparkle3, sparkle4]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalIconContainer}>
            <Animated.View style={[styles.sparkle, styles.sparkle1, { transform: [{ scale: sparkle1 }] }]}>
              <FontAwesomeIcon icon="star" size={20} color="#FFC2C2" />
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle2, { transform: [{ scale: sparkle2 }] }]}>
              <FontAwesomeIcon icon="star" size={18} color="#FECACA" />
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle3, { transform: [{ scale: sparkle3 }] }]}>
              <FontAwesomeIcon icon="star" size={18} color="#FDA4A4" />
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle4, { transform: [{ scale: sparkle4 }] }]}>
              <FontAwesomeIcon icon="star" size={16} color="#FCA5A5" />
            </Animated.View>
            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              <FontAwesomeIcon icon="times-circle" size={Responsive.iconSize(64)} color="#EF4444" />
            </Animated.View>
          </View>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity style={styles.modalDoneButton} onPress={onClose}>
            <Text style={styles.modalDoneButtonText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    width: '100%',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalIconContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    position: 'relative',
  },
  sparkle: { position: 'absolute' },
  sparkle1: { top: 10, left: 10 },
  sparkle2: { bottom: 15, left: 8 },
  sparkle3: { top: 15, right: 8 },
  sparkle4: { bottom: 10, right: 10 },
  modalMessage: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.regular,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  modalDoneButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
    minWidth: 140,
    marginBottom: 0,
  },
  modalDoneButtonText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});

export default ErrorModal;


