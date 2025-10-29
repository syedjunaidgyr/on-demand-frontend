import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';
import { Typography } from '../../constants/typography';
import { Colors } from '../../constants/colors';
import ApiService from '../../services/api';
import Responsive from '../../utils/responsive';

const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const showSuccessAnimation = () => {
    setShowSuccessModal(true);
    
    // Animate the modal appearance
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate back after 2 seconds
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccessModal(false);
        navigation.goBack();
      });
    }, 2000);
  };

  const handleChangePassword = async () => {
    if (!formData.currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (!formData.newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (formData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setIsLoading(true);
    try {
      await ApiService.changePassword(formData.currentPassword, formData.newPassword);
      setIsLoading(false);
      showSuccessAnimation();
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Error', error.message || 'Failed to change password');
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <View style={styles.container}>
      <GlobalHeader
        title="Change Password"
        showBackButton={true}
        backgroundColor="#1C2A3A"
        titleColor="#FFFFFF"
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}>

          {/* Security Info */}
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <FontAwesomeIcon icon="shield-alt" size={Responsive.iconSize(24)} color="#1C2A3A" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Password Security</Text>
                <Text style={styles.infoText}>
                  For your security, please enter your current password and choose a strong new password.
                </Text>
              </View>
            </View>
          </View>

          {/* Password Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Password</Text>
            
            <View style={styles.formCard}>
              {/* Current Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Password *</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.currentPassword}
                    onChangeText={(value) => updateFormData('currentPassword', value)}
                    placeholder="Enter current password"
                    secureTextEntry={!showPasswords.current}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility('current')}>
                    <FontAwesomeIcon 
                      icon={showPasswords.current ? "eye-slash" : "eye"} 
                      size={Responsive.iconSize(18)} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password *</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.newPassword}
                    onChangeText={(value) => updateFormData('newPassword', value)}
                    placeholder="Enter new password"
                    secureTextEntry={!showPasswords.new}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility('new')}>
                    <FontAwesomeIcon 
                      icon={showPasswords.new ? "eye-slash" : "eye"} 
                      size={Responsive.iconSize(18)} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.passwordHint}>
                  Password must be at least 6 characters long
                </Text>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm New Password *</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.confirmPassword}
                    onChangeText={(value) => updateFormData('confirmPassword', value)}
                    placeholder="Confirm new password"
                    secureTextEntry={!showPasswords.confirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility('confirm')}>
                    <FontAwesomeIcon 
                      icon={showPasswords.confirm ? "eye-slash" : "eye"} 
                      size={Responsive.iconSize(18)} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Password Requirements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Password Requirements</Text>
            
            <View style={styles.requirementsCard}>
              <View style={styles.requirementItem}>
                <FontAwesomeIcon icon="check" size={Responsive.iconSize(14)} color="#10B981" />
                <Text style={styles.requirementText}>At least 6 characters long</Text>
              </View>
              <View style={styles.requirementItem}>
                <FontAwesomeIcon icon="check" size={Responsive.iconSize(14)} color="#10B981" />
                <Text style={styles.requirementText}>Different from current password</Text>
              </View>
              <View style={styles.requirementItem}>
                <FontAwesomeIcon icon="check" size={Responsive.iconSize(14)} color="#10B981" />
                <Text style={styles.requirementText}>Confirmed correctly</Text>
              </View>
            </View>
          </View>

          {/* Change Password Button */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.changePasswordButton, isLoading && styles.changePasswordButtonDisabled]} 
              onPress={handleChangePassword}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <FontAwesomeIcon icon="lock" size={Responsive.iconSize(18)} color="#FFFFFF" />
                  <Text style={styles.changePasswordButtonText}>Change Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Screen */}
      <Modal
        transparent={false}
        visible={showSuccessModal}
        animationType="none"
        onRequestClose={() => {}}>
        <Animated.View 
          style={[
            styles.successFullScreen,
            {
              opacity: fadeAnim,
            },
          ]}>
          <Animated.View 
            style={[
              styles.successContent,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}>
            <View style={styles.successIconContainer}>
              <FontAwesomeIcon icon="check-circle" size={Responsive.iconSize(80)} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>
              Password changed successfully
            </Text>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    marginTop: -5,
    backgroundColor: '#FFFFFF',
  },
  scrollContentContainer: {
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    color: '#374151',
    marginBottom: 8,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: '#111827',
  },
  eyeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordHint: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
    marginTop: 4,
  },
  requirementsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: '#374151',
    marginLeft: 8,
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C2A3A',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  changePasswordButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  changePasswordButtonText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  successFullScreen: {
    flex: 1,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 32,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.regular,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
  },
});

export default ChangePasswordScreen;
