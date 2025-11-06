import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import ApiService from '../../services/api';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../navigation/AppNavigator';
import Responsive from '../../utils/responsive';

const { width, height } = Dimensions.get('window');

const IS_SMALL_DEVICE = Responsive.isSmallScreen();
const IS_VERY_SMALL_DEVICE = Responsive.getScreenHeight() < 600;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryMessage, setRetryMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);

  const performLogin = async (isRetry = false) => {
    if (!isRetry) {
      if (!email || !password) {
        setErrorMessage('Please fill in all fields');
        setShowErrorModal(true);
        return;
      }

      if (isLoading) {
        return;
      }

      setIsLoading(true);
      setRetryCount(0);
      setRetryMessage('');
    }

    try {
      console.log('🔐 Attempting login...');
      const response = await ApiService.login({ email, password });
      console.log('✅ Login successful, updating auth context...');
      
      try { await AsyncStorage.setItem('SHOW_LOGIN_SUCCESS', '1'); } catch {}
      login(response.user);
      console.log('✅ Auth context updated, navigating to dashboard');

      try {
        if (Platform.OS === 'ios') {
          await messaging().requestPermission();
        } else if (Platform.OS === 'android' && Platform.Version >= 33) {
          await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS');
        }
        if (!messaging().isDeviceRegisteredForRemoteMessages) {
          await messaging().registerDeviceForRemoteMessages();
        }
        await messaging().setAutoInitEnabled(true);

        const fcmToken = await messaging().getToken();
        if (fcmToken) {
          const userType = (response.user.role || '').toLowerCase();
          await ApiService.registerPushToken({
            userId: response.user.id,
            token: fcmToken,
            userType,
          });
        }
      } catch (e) {
        console.log('⚠️ Unable to register push token post-login:', (e as any)?.message);
      }
    } catch (error: any) {
      let errorMsg = 'Login failed. Please try again.';
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMsg = 'Network error. Please check your internet connection and server status.';
      } else if (error.response?.status === 401) {
        errorMsg = 'Invalid email or password.';
      } else if (error.response?.status === 429) {
        if (retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000;
          setRetryCount(prev => prev + 1);
          setRetryMessage(`Rate limited. Retrying in ${delay/1000} seconds...`);
          setTimeout(() => {
            performLogin(true);
          }, delay);
          return;
        } else {
          errorMsg = 'Too many login attempts. Please wait a few minutes before trying again.';
          setRetryCount(0);
          setRetryMessage('');
        }
      } else if (error.response?.status === 500) {
        errorMsg = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });
    return () => { 
      showSub.remove(); 
      hideSub.remove(); 
    };
  }, []);

  const handleEmailFocus = () => {
    // Scroll down when email is focused to reveal password field
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleEmailSubmit = () => {
    // Move to password field when user presses "Next" on email
    passwordInputRef.current?.focus();
  };

  const handleLogin = () => {
    Keyboard.dismiss();
    performLogin(false);
  };

  const navigateToRegister = () => {
    navigation.navigate('Register' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        enabled={Platform.OS === 'ios'}
        behavior="padding"
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo Section - Hidden when keyboard is visible */}
          {!isKeyboardVisible && (
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <View style={styles.logoWrapper}>
                  <Image 
                    source={require('../../assets/logo.png')} 
                    style={styles.logo}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.logoText}>Locum</Text>
                <Text style={styles.logoSubtext}>(On Demand)</Text>
                <Text style={styles.logoSubtext2}>Clinical Professionals</Text>
              </View>
            </View>
          )}

          {/* Welcome Card */}
          <View style={[styles.card, isKeyboardVisible && styles.cardKeyboardVisible]}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subtitleText}>Sign in to continue</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <FontAwesomeIcon icon="envelope" size={Responsive.iconSize(18)} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  ref={emailInputRef}
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={Colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onFocus={handleEmailFocus}
                  onSubmitEditing={handleEmailSubmit}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <FontAwesomeIcon icon="lock" size={Responsive.iconSize(18)} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}>
                  <FontAwesomeIcon
                    icon={showPassword ? "eye-slash" : "eye"}
                    size={Responsive.iconSize(18)}
                    color={Colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {retryMessage ? (
              <Text style={styles.retryMessage}>{retryMessage}</Text>
            ) : null}
          </View>

          {/* Don't have account - Outside Card */}
          <View style={styles.accountLinkContainer}>
            <Text style={styles.accountLinkText}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Extra spacing at bottom for scroll */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Powered By Section - hide when keyboard is open */}
      {!isKeyboardVisible && (
        <View style={styles.poweredByContainer}>
          <Text style={styles.poweredByText}>Powered by</Text>
          <Image
            source={require('../../assets/footer_logo.png')}
            style={styles.companyLogo}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Success Modal */}
      <Modal
        transparent
        visible={showSuccessModal}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <FontAwesomeIcon 
                icon="check-circle" 
                size={Responsive.iconSize(60)} 
                color={Colors.success} 
              />
            </View>
            <Text style={styles.successTitle}>Login Successful!</Text>
            <Text style={styles.successMessage}>Welcome back! You have successfully signed in.</Text>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        transparent
        visible={showErrorModal}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.errorIconContainer}>
              <FontAwesomeIcon 
                icon="exclamation-triangle" 
                size={Responsive.iconSize(60)} 
                color={Colors.error} 
              />
            </View>
            <Text style={styles.errorTitle}>Login Failed</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.closeButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Responsive.wp('5%'),
    paddingTop: Responsive.verticalScale(20),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Responsive.verticalScale(30),
    marginTop: Responsive.verticalScale(20),
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Responsive.scale(10),
  },
  logoWrapper: {
    width: Responsive.scale(70),
    height: Responsive.verticalScale(70),
    borderRadius: Responsive.scale(35),
    overflow: 'hidden',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: Responsive.verticalScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '85%',
    height: '85%',
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: Responsive.fontSize(width * 0.07),
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    letterSpacing: 1,
    marginTop: Responsive.verticalScale(3),
  },
  logoSubtext: {
    fontSize: Responsive.fontSize(width * 0.035),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Responsive.verticalScale(1),
  },
  logoSubtext2: {
    fontSize: Responsive.fontSize(width * 0.035),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Responsive.verticalScale(1),
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Responsive.scale(width * 0.06),
    ...Shadow.md,
    marginHorizontal: Responsive.wp('8%'),
    alignSelf: 'center',
    width: Responsive.wp('84%'),
  },
  cardKeyboardVisible: {
    marginTop: Responsive.verticalScale(20),
  },
  welcomeText: {
    fontSize: Responsive.fontSize(24),
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Responsive.verticalScale(8),
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Responsive.verticalScale(24),
  },
  inputContainer: {
    marginBottom: Responsive.verticalScale(16),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    height: Responsive.verticalScale(50),
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Responsive.fontSize(Typography.fontSize.base),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: Spacing.xs,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Responsive.verticalScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Responsive.verticalScale(8),
    marginBottom: Responsive.verticalScale(12),
    ...Shadow.md,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: Colors.white,
    fontSize: Responsive.fontSize(width * 0.045),
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
  },
  retryMessage: {
    fontSize: Responsive.fontSize(Typography.fontSize.sm),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.warning,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  accountLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Responsive.verticalScale(16),
    marginTop: Responsive.verticalScale(12),
    marginHorizontal: Responsive.wp('8%'),
  },
  accountLinkText: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular,
    color: '#000000',
  },
  signUpLink: {
    fontSize: Responsive.fontSize(16),
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
  },
  poweredByContainer: {
    position: 'absolute',
    bottom: IS_VERY_SMALL_DEVICE ? Responsive.hp('2%') : Responsive.hp('1%'),
    right: IS_VERY_SMALL_DEVICE ? Responsive.wp('3%') : Responsive.wp('2%'),
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: Responsive.wp('40%'),
  },
  poweredByText: {
    fontSize: Responsive.fontSize(12),
    fontFamily: Typography.fontFamily.medium,
    color: '#000000',
    marginRight: IS_VERY_SMALL_DEVICE ? Responsive.scale(-15) : Responsive.scale(-25),
  },
  companyLogo: {
    height: IS_VERY_SMALL_DEVICE ? Responsive.verticalScale(12) : Responsive.verticalScale(15),
    width: IS_VERY_SMALL_DEVICE ? Responsive.scale(80) : Responsive.scale(95),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Responsive.scale(32),
    alignItems: 'center',
    width: Responsive.wp('80%'),
    maxWidth: 400,
    ...Shadow.lg,
  },
  successIconContainer: {
    marginBottom: Responsive.verticalScale(20),
  },
  successTitle: {
    fontSize: Responsive.fontSize(24),
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Responsive.verticalScale(12),
    textAlign: 'center',
  },
  successMessage: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorIconContainer: {
    marginBottom: Responsive.verticalScale(20),
  },
  errorTitle: {
    fontSize: Responsive.fontSize(24),
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Responsive.verticalScale(12),
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Responsive.verticalScale(20),
  },
  closeButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Responsive.verticalScale(12),
    paddingHorizontal: Responsive.scale(40),
    marginTop: Responsive.verticalScale(8),
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default LoginScreen;