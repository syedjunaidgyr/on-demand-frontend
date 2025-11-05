import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';
import ApiService from '../../services/api';
import { Typography } from '../../constants/typography';
import Responsive from '../../utils/responsive';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../navigation/AppNavigator';

const HospitalAdminCreateAgencyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }
    if (!formData.firstName || !formData.lastName) {
      Alert.alert('Validation Error', 'First name and last name are required');
      return false;
    }
    if (!formData.phone) {
      Alert.alert('Validation Error', 'Phone number is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      await ApiService.createAgency({
        email: formData.email,
        password: formData.password,
        name,
        phone: formData.phone,
        address: {
          street: formData.street || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          zipCode: formData.zipCode || undefined,
          country: formData.country || undefined,
        },
      });
      Alert.alert('Success', 'Agency registered successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.response?.data?.error || (status === 403 ? 'You do not have permission to create agencies with this account.' : 'Failed to create agency. Please check details and try again.');
      // eslint-disable-next-line no-console
      console.log('[CreateAgency] error', status, error?.response?.data || error);
      Alert.alert('Create Agency failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader title="Create Agency" showBackButton />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password (min 8 characters)"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter first name"
              value={formData.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter last name"
              value={formData.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter company name (optional)"
              value={formData.companyName}
              onChangeText={(text) => handleChange('companyName', text)}
            />
          </View>

          <Text style={styles.sectionTitle}>Address (Optional)</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter street address"
              value={formData.street}
              onChangeText={(text) => handleChange('street', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter city"
              value={formData.city}
              onChangeText={(text) => handleChange('city', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter state"
              value={formData.state}
              onChangeText={(text) => handleChange('state', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ZIP Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter ZIP code"
              value={formData.zipCode}
              onChangeText={(text) => handleChange('zipCode', text)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter country"
              value={formData.country}
              onChangeText={(text) => handleChange('country', text)}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Register Agency</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F9FF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Responsive.scale(20),
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: Responsive.scale(16),
    padding: Responsive.scale(20),
  },
  inputGroup: {
    marginBottom: Responsive.verticalScale(16),
  },
  label: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.medium,
    color: '#374151',
    marginBottom: Responsive.verticalScale(8),
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: Responsive.scale(8),
    padding: Responsive.scale(12),
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    marginTop: Responsive.verticalScale(8),
    marginBottom: Responsive.verticalScale(16),
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: Responsive.scale(8),
    padding: Responsive.scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Responsive.verticalScale(24),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.bold,
  },
});

export default HospitalAdminCreateAgencyScreen;

