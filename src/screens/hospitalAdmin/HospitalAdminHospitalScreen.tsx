import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';
import { Typography } from '../../constants/typography';
import Responsive from '../../utils/responsive';
import { useGlobalStyles } from '../../theme/globalStyles';
import { useAppColors } from '../../hooks/useAppColors';
import HospitalAdminApi from '../../services/hospitalAdminApi';
import { getFinalApiUrl } from '../../config/api';

const HospitalAdminHospitalScreen: React.FC = () => {
  const navigation = useNavigation();
  const g = useGlobalStyles();
  const appColors = useAppColors();
  const [hospital, setHospital] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  useEffect(() => {
    loadHospital();
  }, []);

  const loadHospital = async () => {
    try {
      setIsLoading(true);
      const response = await HospitalAdminApi.getHospitalDetails();
      const hospitalData = response?.hospital || response;
      setHospital(hospitalData);
      
      // Populate form with hospital data
      if (hospitalData) {
        setFormData({
          name: hospitalData.name || '',
          code: hospitalData.code || '',
          phone: hospitalData.phone || hospitalData.contactInfo?.phone || '',
          email: hospitalData.email || hospitalData.contactInfo?.email || '',
          website: hospitalData.website || '',
          description: hospitalData.description || '',
          street: hospitalData.address?.street || '',
          city: hospitalData.address?.city || '',
          state: hospitalData.address?.state || '',
          zipCode: hospitalData.address?.zipCode || '',
          country: hospitalData.address?.country || '',
        });
      }
    } catch (error: any) {
      console.error('Failed to load hospital:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load hospital details');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHospital();
    setRefreshing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form to original hospital data
    if (hospital) {
      setFormData({
        name: hospital.name || '',
        code: hospital.code || '',
        phone: hospital.phone || hospital.contactInfo?.phone || '',
        email: hospital.email || hospital.contactInfo?.email || '',
        website: hospital.website || '',
        description: hospital.description || '',
        street: hospital.address?.street || '',
        city: hospital.address?.city || '',
        state: hospital.address?.state || '',
        zipCode: hospital.address?.zipCode || '',
        country: hospital.address?.country || '',
      });
    }
    setIsEditing(false);
  };

  const normalizeWebsiteUrl = (url: string): string | undefined => {
    if (!url || !url.trim()) {
      return undefined;
    }
    const trimmed = url.trim();
    // If it already starts with http:// or https://, return as is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    // Otherwise, prepend https://
    return `https://${trimmed}`;
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      Alert.alert('Validation', 'Name and Code are required fields');
      return;
    }

    // Validate website URL format
    if (formData.website && formData.website.trim()) {
      const normalizedWebsite = normalizeWebsiteUrl(formData.website);
      try {
        // Validate it's a proper URL
        new URL(normalizedWebsite!);
      } catch (e) {
        Alert.alert('Validation Error', 'Please enter a valid website URL (e.g., www.example.com or https://example.com)');
        return;
      }
    }

    try {
      setIsSaving(true);
      const data = {
        name: formData.name,
        code: formData.code,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        website: normalizeWebsiteUrl(formData.website),
        description: formData.description || undefined,
        address: {
          street: formData.street || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          zipCode: formData.zipCode || undefined,
          country: formData.country || undefined,
        },
        contactInfo: {
          phone: formData.phone || undefined,
          email: formData.email || undefined,
        },
      };

      await HospitalAdminApi.updateHospital(data);
      Alert.alert('Success', 'Hospital updated successfully');
      setIsEditing(false);
      await loadHospital();
    } catch (error: any) {
      console.error('Failed to update hospital:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update hospital');
    } finally {
      setIsSaving(false);
    }
  };

  const getLogoUrl = () => {
    if (!hospital) return null;
    const candidate = hospital as any;
    const logoPath = candidate?.logoUrl || candidate?.logoPath || candidate?.logo || candidate?.assets?.logoUrl || null;
    if (!logoPath) return null;
    
    // Construct full URL if it's a relative path
    let logoUri = logoPath as string;
    if (logoUri && !logoUri.startsWith('http')) {
      const baseUrl = getFinalApiUrl().replace('/api/v1', '');
      logoUri = logoUri.startsWith('/') 
        ? `${baseUrl}${logoUri}` 
        : `${baseUrl}/${logoUri}`;
    }
    return logoUri;
  };

  const renderField = (label: string, value: string, key: keyof typeof formData, editable: boolean = true, placeholder?: string) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: appColors.textSecondary }]}>{label}</Text>
      {isEditing && editable ? (
        <TextInput
          style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
          value={formData[key]}
          onChangeText={(text) => setFormData({ ...formData, [key]: text })}
          placeholder={placeholder}
          placeholderTextColor={appColors.textSecondary}
        />
      ) : (
        <Text style={[styles.value, { color: appColors.textPrimary }]}>{value || 'N/A'}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={g.appBackground}>
      <StatusBar backgroundColor={appColors.background} barStyle={appColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />
      <GlobalHeader
        title="Hospital Details"
        showBackButton={true}
        backgroundColor={appColors.accentText}
        titleColor={appColors.textPrimary}
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}
        backButtonStyle={{ backgroundColor: appColors.accentText, borderWidth: 1, borderColor: appColors.border }}
        rightComponent={
          !isEditing ? (
            <TouchableOpacity style={[styles.editButton, { backgroundColor: appColors.primary }]} onPress={handleEdit}>
              <FontAwesomeIcon icon="edit" size={Responsive.iconSize(18)} color={appColors.accentText} />
            </TouchableOpacity>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.cancelButton, { backgroundColor: appColors.background, borderColor: appColors.border }]} onPress={handleCancel}>
                <FontAwesomeIcon icon="times" size={Responsive.iconSize(18)} color={appColors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: appColors.primary }]} 
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={appColors.accentText} />
                ) : (
                  <FontAwesomeIcon icon="check" size={Responsive.iconSize(18)} color={appColors.accentText} />
                )}
              </TouchableOpacity>
            </View>
          )
        }
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text style={[styles.loadingText, { color: appColors.textSecondary }]}>Loading hospital details...</Text>
        </View>
      ) : hospital ? (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appColors.primary} />}
        >
          {/* Hospital Logo */}
          <View style={styles.logoContainer}>
            {(() => {
              const logoUri = getLogoUrl();
              return logoUri ? (
                <Image 
                  source={{ uri: logoUri }} 
                  style={styles.logo} 
                  resizeMode="contain"
                  onError={(e) => {
                    console.error('Logo load error:', e);
                  }}
                />
              ) : (
                <View style={[styles.logo, styles.logoPlaceholder, { backgroundColor: appColors.background }]}>
                  <FontAwesomeIcon icon="hospital" size={Responsive.iconSize(48)} color={appColors.textSecondary} />
                </View>
              );
            })()}
            <TouchableOpacity
              style={[styles.uploadLogoButton, { backgroundColor: appColors.primary }]}
              onPress={() => (navigation as any).navigate('HospitalAdminUploadLogo')}
            >
              <FontAwesomeIcon icon="camera" size={Responsive.iconSize(16)} color={appColors.accentText} />
              <Text style={[styles.uploadLogoText, { color: appColors.accentText }]}>Change Logo</Text>
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={[styles.section, { backgroundColor: appColors.accentText }]}>
            <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Basic Information</Text>
            {renderField('Hospital Name', formData.name, 'name')}
            {renderField('Hospital Code', formData.code, 'code')}
            {renderField('Description', formData.description, 'description')}
          </View>

          {/* Contact Information */}
          <View style={[styles.section, { backgroundColor: appColors.accentText }]}>
            <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Contact Information</Text>
            {renderField('Phone', formData.phone, 'phone')}
            {renderField('Email', formData.email, 'email')}
            {renderField('Website', formData.website, 'website', true, 'www.example.com or https://example.com')}
          </View>

          {/* Address Information */}
          <View style={[styles.section, { backgroundColor: appColors.accentText }]}>
            <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Address</Text>
            {renderField('Street', formData.street, 'street')}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderField('City', formData.city, 'city')}
              </View>
              <View style={styles.halfWidth}>
                {renderField('State', formData.state, 'state')}
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderField('Zip Code', formData.zipCode, 'zipCode')}
              </View>
              <View style={styles.halfWidth}>
                {renderField('Country', formData.country, 'country')}
              </View>
            </View>
          </View>

          {/* Read-only Information */}
          <View style={[styles.section, { backgroundColor: appColors.accentText }]}>
            <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Status</Text>
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: appColors.textSecondary }]}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: hospital.isActive ? '#D1FAE5' : '#FEE2E2' }]}>
                <Text style={[styles.statusText, { color: hospital.isActive ? '#059669' : '#B91C1C' }]}>
                  {hospital.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            {hospital.createdAt && (
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: appColors.textSecondary }]}>Created At</Text>
                <Text style={[styles.value, { color: appColors.textPrimary }]}>
                  {new Date(hospital.createdAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Info Note */}
          {isEditing && (
            <View style={[styles.infoBox, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.infoText, { color: '#1E40AF' }]}>
                Note: Hospital Admin can update hospital details but cannot delete the hospital. Only system Admins can delete hospitals.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesomeIcon icon="hospital" size={Responsive.iconSize(48)} color={appColors.textSecondary} />
          <Text style={[styles.emptyText, { color: appColors.textPrimary }]}>No hospital found</Text>
          <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
            Please contact your administrator if you believe this is an error.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadLogoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadLogoText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.regular,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Typography.fontFamily.regular,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HospitalAdminHospitalScreen;

