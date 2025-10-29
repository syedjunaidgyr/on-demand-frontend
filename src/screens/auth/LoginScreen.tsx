import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import ApiService from '../../services/api';
import messaging from '@react-native-firebase/messaging';
import { useAuth } from '../../navigation/AppNavigator';
import Responsive from '../../utils/responsive';

const { width, height } = Dimensions.get('window');

// Device size detection for responsive design - now using Responsive utility
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

  const performLogin = async (isRetry = false) => {
    if (!isRetry) {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
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
      
      login(response.user);
      console.log('✅ Auth context updated, navigation should happen now');

      // Register device push token after successful login
      try {
        // Request permissions on login (iOS + Android 13+)
        if (Platform.OS === 'ios') {
          await messaging().requestPermission();
        } else if (Platform.OS === 'android' && Platform.Version >= 33) {
          await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS');
        }
        // Ensure device is registered for remote messages
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
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and server status.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password.';
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
          errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
          setRetryCount(0);
          setRetryMessage('');
        }
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    Keyboard.dismiss();
    performLogin(false);
  };

  const navigateToRegister = () => {
    navigation.navigate('Register' as never);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.content}>
            {/* Top Spacer */}
            <View style={styles.topSpacer} />
            
            {/* Logo Section */}
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

            {/* Welcome Card */}
            <View style={styles.card}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subtitleText}>Sign in to continue</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <FontAwesomeIcon icon="envelope" size={Responsive.iconSize(18)} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={Colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <FontAwesomeIcon icon="lock" size={Responsive.iconSize(18)} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
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

            {/* Bottom Spacer */}
            <View style={styles.bottomSpacer} />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Powered By Section - Fixed at bottom */}
      <View style={styles.poweredByContainer}>
        <Text style={styles.poweredByText}>Powered by</Text>
        <Image
          source={require('../../assets/footer_logo.png')}
          style={styles.companyLogo}
          resizeMode="contain"
        />
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: Responsive.wp('5%'),
  },
  topSpacer: {
    flex: 0.3,
  },
  bottomSpacer: {
    flex: 0.4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Responsive.verticalScale(height * 0.05),
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Responsive.scale(10),
  },
  logoWrapper: {
    width: Responsive.scale(90),
    height: Responsive.verticalScale(90),
    borderRadius: Responsive.scale(45),
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
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontSize: Responsive.fontSize(width * 0.07),
    fontFamily: Typography.fontFamily.bold, // DM Sans Bold
    color: Colors.primary,
    letterSpacing: 1,
    marginTop: Responsive.verticalScale(3),
  },
  logoSubtext: {
    fontSize: Responsive.fontSize(width * 0.035),
    fontFamily: Typography.fontFamily.regular, // DM Sans Regular
    color: Colors.textSecondary,
    marginTop: Responsive.verticalScale(1),
  },
  logoSubtext2: {
    fontSize: Responsive.fontSize(width * 0.035),
    fontFamily: Typography.fontFamily.regular, // DM Sans Regular
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
  welcomeText: {
    fontSize: Responsive.fontSize(24),
    fontFamily: Typography.fontFamily.bold, // DM Sans Bold for headers
    color: Colors.textPrimary,
    marginBottom: Responsive.verticalScale(8),
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.regular, // DM Sans Regular for subtitles
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Responsive.verticalScale(24),
  },
  inputContainer: {
    marginBottom: Responsive.verticalScale(height * 0.02),
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
    fontFamily: Typography.fontFamily.regular, // DM Sans Regular for input text
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: Spacing.xs,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Responsive.verticalScale(height * 0.02),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Responsive.verticalScale(height * 0.01),
    marginBottom: Responsive.verticalScale(height * 0.02),
    ...Shadow.md,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: Colors.white,
    fontSize: Responsive.fontSize(width * 0.045),
    fontFamily: Typography.fontFamily.medium, // DM Sans Medium for button text
    fontWeight: Typography.fontWeight.medium,
  },
  retryMessage: {
    fontSize: Responsive.fontSize(Typography.fontSize.sm),
    fontFamily: Typography.fontFamily.regular, // DM Sans Regular
    color: Colors.warning,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  accountLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Responsive.verticalScale(12),
    marginTop: Responsive.verticalScale(16),
    marginHorizontal: Responsive.wp('8%'),
  },
  accountLinkText: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular, // DM Sans Regular
    color: '#000000',
  },
  signUpLink: {
    fontSize: Responsive.fontSize(16),
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium, // DM Sans Medium
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
    fontFamily: Typography.fontFamily.medium, // DM Sans Medium
    color: '#000000',
    marginRight: IS_VERY_SMALL_DEVICE ? Responsive.scale(-15) : Responsive.scale(-25),
  },
  companyLogo: {
    height: IS_VERY_SMALL_DEVICE ? Responsive.verticalScale(12) : Responsive.verticalScale(15),
    width: IS_VERY_SMALL_DEVICE ? Responsive.scale(80) : Responsive.scale(95),
  },
});

export default LoginScreen;