import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import ApiService from '../../services/api';
import { useAuth } from '../../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

// Device size detection for responsive design
const IS_SMALL_DEVICE = height < 700;
const IS_VERY_SMALL_DEVICE = height < 600;

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
        style={styles.keyboardView}>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            
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
                  <FontAwesomeIcon icon="envelope" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
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
                  <FontAwesomeIcon icon="lock" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
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
                      size={18}
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
            <TouchableOpacity
              style={styles.accountLinkContainer}
              onPress={navigateToRegister}>
              <Text style={styles.accountLinkText}>
                Don't have an account?{' '}
                <Text style={styles.signUpLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>

            {/* Spacer for powered by */}
            <View style={styles.spacer} />
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Powered By Section - Bottom Right Corner */}
        <View style={styles.poweredByContainer}>
          <Text style={styles.poweredByText}>Powered by</Text>
          <Image
            source={require('../../assets/footer_logo.png')}
            style={styles.companyLogo}
            resizeMode="contain"
          />
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.08,
    paddingBottom: height * 0.15, // Add bottom padding for footer
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.05,
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  logoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontSize: width * 0.07,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    letterSpacing: 1,
    marginTop: 3,
  },
  logoSubtext: {
    fontSize: width * 0.035,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  logoSubtext2: {
    fontSize: width * 0.035,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: width * 0.06,
    ...Shadow.md,
    marginHorizontal: width * 0.08,
    alignSelf: 'center',
    width: width * 0.84,
  },
  welcomeText: {
    fontSize: width * 0.065,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: width * 0.04,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: height * 0.03,
  },
  inputContainer: {
    marginBottom: height * 0.02,
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
    height: 50,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: Spacing.xs,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: height * 0.02,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.01,
    marginBottom: height * 0.02,
    ...Shadow.md,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: Colors.white,
    fontSize: width * 0.045,
    fontWeight: Typography.fontWeight.bold,
  },
  retryMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: height * 0.02,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
  },
  accountLinkContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
    marginHorizontal: width * 0.08,
  },
  accountLinkText: {
    fontSize: width * 0.035,
    color: Colors.textSecondary,
  },
  signUpLink: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  spacer: {
    flex: 1,
    minHeight: height * 0.05,
  },
  poweredByContainer: {
    position: 'absolute',
    bottom: IS_VERY_SMALL_DEVICE ? height * 0.02 : height * 0.01,
    right: IS_VERY_SMALL_DEVICE ? width * 0.03 : width * 0.02,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: width * 0.4, // Prevent overflow on small screens
  },
  poweredByText: {
    fontSize: IS_VERY_SMALL_DEVICE ? width * 0.025 : width * 0.03,
    color: '#000000',
    fontWeight: '600',
    marginRight: IS_VERY_SMALL_DEVICE ? -15 : -25,
  },
  companyLogo: {
    height: IS_VERY_SMALL_DEVICE ? 12 : 15,
    width: IS_VERY_SMALL_DEVICE ? 80 : 95,
  },
});

export default LoginScreen;