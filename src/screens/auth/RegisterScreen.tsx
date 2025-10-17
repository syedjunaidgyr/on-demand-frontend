import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '../../utils/icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import ApiService from '../../services/api';

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'DOCTOR' as 'DOCTOR' | 'NURSE',
    department: '',
    location: '',
    specialization: '',
    licenseNumber: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const requiredFields = [
      'email', 'password', 'confirmPassword', 'firstName', 'lastName',
      'department', 'location', 'phone', 'emergencyContactName',
      'emergencyContactPhone', 'emergencyContactRelationship',
      'street', 'city', 'state', 'zipCode'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        Alert.alert('Validation Error', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const registerData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        department: formData.department,
        location: formData.location,
        specialization: formData.specialization || undefined,
        licenseNumber: formData.licenseNumber || undefined,
        phone: formData.phone,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship,
        },
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
      };

      await ApiService.register(registerData);
      // Navigation will be handled by the AppNavigator based on auth state
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.goBack();
  };

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    secureTextEntry = false, 
    keyboardType = 'default',
    icon,
    showEye = false,
    onToggleEye,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
    keyboardType?: any;
    icon: any;
    showEye?: boolean;
    onToggleEye?: () => void;
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <FontAwesomeIcon icon={icon} size={20} color={Colors.textTertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {showEye && (
          <TouchableOpacity onPress={onToggleEye} style={styles.eyeIcon}>
            <FontAwesomeIcon
              icon={secureTextEntry ? "eye-slash" : "eye"}
              size={20}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
            <FontAwesomeIcon icon="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Join Locum Healthcare</Text>
          <Text style={styles.subtitleText}>Fill in your details to get started</Text>

          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === 'DOCTOR' && styles.roleButtonActive,
              ]}
              onPress={() => handleInputChange('role', 'DOCTOR')}>
              <FontAwesomeIcon icon="user-md" size={24} color={formData.role === 'DOCTOR' ? Colors.white : Colors.primary} />
              <Text style={[
                styles.roleButtonText,
                formData.role === 'DOCTOR' && styles.roleButtonTextActive,
              ]}>
                Doctor
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === 'NURSE' && styles.roleButtonActive,
              ]}
              onPress={() => handleInputChange('role', 'NURSE')}>
              <FontAwesomeIcon icon="stethoscope" size={24} color={formData.role === 'NURSE' ? Colors.white : Colors.primary} />
              <Text style={[
                styles.roleButtonText,
                formData.role === 'NURSE' && styles.roleButtonTextActive,
              ]}>
                Nurse
              </Text>
            </TouchableOpacity>
          </View>

          <InputField
            label="Email Address"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            placeholder="Enter your email"
            keyboardType="email-address"
            icon="envelope"
          />

          <InputField
            label="Password"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            placeholder="Create a password"
            secureTextEntry={!showPassword}
            icon="lock"
            showEye={true}
            onToggleEye={() => setShowPassword(!showPassword)}
          />

          <InputField
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => handleInputChange('confirmPassword', text)}
            placeholder="Confirm your password"
            secureTextEntry={!showConfirmPassword}
            icon="lock"
            showEye={true}
            onToggleEye={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="First Name"
                value={formData.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
                placeholder="First name"
                icon="user"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Last Name"
                value={formData.lastName}
                onChangeText={(text) => handleInputChange('lastName', text)}
                placeholder="Last name"
                icon="user"
              />
            </View>
          </View>

          <InputField
            label="Department"
            value={formData.department}
            onChangeText={(text) => handleInputChange('department', text)}
            placeholder="e.g., Emergency Medicine"
            icon="building"
          />

          <InputField
            label="Location"
            value={formData.location}
            onChangeText={(text) => handleInputChange('location', text)}
            placeholder="e.g., New York"
            icon="map-marker-alt"
          />

          {formData.role === 'DOCTOR' && (
            <>
              <InputField
                label="Specialization"
                value={formData.specialization}
                onChangeText={(text) => handleInputChange('specialization', text)}
                placeholder="e.g., Emergency Medicine"
                icon="file-medical"
              />
              <InputField
                label="License Number"
                value={formData.licenseNumber}
                onChangeText={(text) => handleInputChange('licenseNumber', text)}
                placeholder="Medical license number"
                icon="file-medical"
              />
            </>
          )}

          <InputField
            label="Phone Number"
            value={formData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            placeholder="+1234567890"
            keyboardType="phone-pad"
            icon="phone"
          />

          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <InputField
            label="Contact Name"
            value={formData.emergencyContactName}
            onChangeText={(text) => handleInputChange('emergencyContactName', text)}
            placeholder="Emergency contact name"
            icon="person"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Contact Phone"
                value={formData.emergencyContactPhone}
                onChangeText={(text) => handleInputChange('emergencyContactPhone', text)}
                placeholder="+1234567890"
                keyboardType="phone-pad"
                icon="phone"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Relationship"
                value={formData.emergencyContactRelationship}
                onChangeText={(text) => handleInputChange('emergencyContactRelationship', text)}
                placeholder="e.g., Spouse"
                icon="family-restroom"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Address</Text>
          <InputField
            label="Street Address"
            value={formData.street}
            onChangeText={(text) => handleInputChange('street', text)}
            placeholder="123 Main St"
                icon="map-marker-alt"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="City"
                value={formData.city}
                onChangeText={(text) => handleInputChange('city', text)}
                placeholder="City"
                icon="building"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="State"
                value={formData.state}
                onChangeText={(text) => handleInputChange('state', text)}
                placeholder="State"
                icon="map-marker-alt"
              />
            </View>
          </View>

          <InputField
            label="ZIP Code"
            value={formData.zipCode}
            onChangeText={(text) => handleInputChange('zipCode', text)}
            placeholder="12345"
            keyboardType="numeric"
            icon="map-marker-alt"
          />

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={navigateToLogin}>
            <Text style={styles.loginButtonText}>
              Already have an account? <Text style={styles.loginLinkText}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  formContainer: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  welcomeText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitleText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: Spacing['2xl'],
    gap: Spacing.md,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
  },
  roleButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  roleButtonTextActive: {
    color: Colors.white,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing['2xl'],
    ...Shadow.md,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  loginButton: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  loginButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  loginLinkText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default RegisterScreen;
