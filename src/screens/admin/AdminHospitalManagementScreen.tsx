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
  Modal,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import { Typography } from '../../constants/typography';
import Responsive from '../../utils/responsive';
import { useGlobalStyles } from '../../theme/globalStyles';
import { useAppColors } from '../../hooks/useAppColors';
import ApiService from '../../services/api';
import GlobalHeader from '../../components/GlobalHeader';
import { launchImageLibrary, Asset } from 'react-native-image-picker';

const AdminHospitalManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const g = useGlobalStyles();
  const appColors = useAppColors();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<Asset | null>(null);
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
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.listHospitals();
      setHospitals(response.hospitals || response || []);
    } catch (error: any) {
      console.error('Failed to load hospitals:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load hospitals');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHospitals();
    setRefreshing(false);
  };

  const normalizeWebsiteUrl = (url: string): string | undefined => {
    if (!url || !url.trim()) {
      return undefined;
    }
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const handleCreate = () => {
    setEditingHospital(null);
    setLogoFile(null);
    setFormData({
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
    setShowCreateModal(true);
  };

  const handleEdit = (hospital: any) => {
    setEditingHospital(hospital);
    setLogoFile(null);
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
    setShowCreateModal(true);
  };

  const handlePickLogo = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.9,
      });
      if (result.assets && result.assets.length > 0) {
        setLogoFile(result.assets[0]);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to pick image');
    }
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

      if (editingHospital) {
        await ApiService.updateHospital(editingHospital.id, data);
        // Upload logo separately if provided
        if (logoFile) {
          const formDataLogo = new FormData();
          formDataLogo.append('logo', {
            uri: logoFile.uri,
            name: logoFile.fileName || 'logo.jpg',
            type: logoFile.type || 'image/jpeg',
          } as any);
          await ApiService.uploadHospitalLogo(editingHospital.id, formDataLogo);
        }
        Alert.alert('Success', 'Hospital updated successfully');
      } else {
        // Create hospital
        if (logoFile) {
          const formDataLogo = new FormData();
          formDataLogo.append('logo', {
            uri: logoFile.uri,
            name: logoFile.fileName || 'logo.jpg',
            type: logoFile.type || 'image/jpeg',
          } as any);
          // Append all hospital data to formData
          Object.keys(data).forEach((key) => {
            if (key === 'address' || key === 'contactInfo') {
              formDataLogo.append(key, JSON.stringify(data[key as keyof typeof data]));
            } else {
              formDataLogo.append(key, (data as any)[key] || '');
            }
          });
          await ApiService.createHospital({}, formDataLogo);
        } else {
          await ApiService.createHospital(data);
        }
        Alert.alert('Success', 'Hospital created successfully');
      }

      setShowCreateModal(false);
      setLogoFile(null);
      await loadHospitals();
    } catch (error: any) {
      console.error('Failed to save hospital:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save hospital');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (hospital: any) => {
    Alert.alert(
      'Delete Hospital',
      `Are you sure you want to delete ${hospital.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteHospital(hospital.id);
              Alert.alert('Success', 'Hospital deleted successfully');
              loadHospitals();
            } catch (error: any) {
              console.error('Failed to delete hospital:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete hospital');
            }
          },
        },
      ]
    );
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={g.appBackground}>
        <StatusBar backgroundColor={appColors.background} barStyle={appColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text style={[styles.loadingText, { color: appColors.textSecondary }]}>Loading hospitals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={g.appBackground}>
      <StatusBar backgroundColor={appColors.background} barStyle={appColors.barStyle} />
      <GlobalHeader
        title="Hospital Management"
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={handleCreate} style={[styles.addButton, { backgroundColor: appColors.primary }]}>
            <FontAwesomeIcon icon="plus" size={Responsive.iconSize(20)} color={appColors.accentText} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appColors.primary} />}
      >
        {hospitals.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesomeIcon icon="hospital" size={Responsive.iconSize(48)} color={appColors.textSecondary} />
            <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No hospitals found</Text>
          </View>
        ) : (
          hospitals.map((hospital) => (
            <View key={hospital.id} style={[styles.hospitalCard, { backgroundColor: appColors.accentText }]}>
              <View style={styles.hospitalInfo}>
                <Text style={[styles.hospitalName, { color: appColors.textPrimary }]}>{hospital.name}</Text>
                <Text style={[styles.hospitalCode, { color: appColors.textSecondary }]}>Code: {hospital.code}</Text>
                {hospital.email && (
                  <Text style={[styles.hospitalDetail, { color: appColors.textSecondary }]}>{hospital.email}</Text>
                )}
                {hospital.address && (
                  <Text style={[styles.hospitalDetail, { color: appColors.textSecondary }]}>
                    {hospital.address.city}, {hospital.address.state}
                  </Text>
                )}
                <View style={styles.statusRow}>
                  <View style={[styles.statusBadge, { backgroundColor: hospital.isActive ? '#10B981' : '#EF4444' }]}>
                    <Text style={styles.statusText}>{hospital.isActive ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(hospital)} style={styles.actionButton}>
                  <FontAwesomeIcon icon="edit" size={Responsive.iconSize(18)} color={appColors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('HospitalAdminUnits' as never, { hospitalId: hospital.id } as never)} 
                  style={[styles.actionButton, { backgroundColor: '#EEF2FF' }]}
                >
                  <FontAwesomeIcon icon="hospital" size={Responsive.iconSize(16)} color={appColors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('HospitalAdminThemes' as never, { hospitalId: hospital.id } as never)} 
                  style={[styles.actionButton, { backgroundColor: '#FEF3C7' }]}
                >
                  <FontAwesomeIcon icon="palette" size={Responsive.iconSize(16)} color="#F59E0B" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(hospital)} style={styles.actionButton}>
                  <FontAwesomeIcon icon="trash" size={Responsive.iconSize(18)} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: appColors.accentText }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: appColors.textPrimary }]}>
                {editingHospital ? 'Edit Hospital' : 'Create Hospital'}
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <FontAwesomeIcon icon="times" size={Responsive.iconSize(20)} color={appColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={[styles.label, { color: appColors.textPrimary }]}>Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Hospital name"
                placeholderTextColor={appColors.textSecondary}
              />

              <Text style={[styles.label, { color: appColors.textPrimary }]}>Code *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text })}
                placeholder="Hospital code"
                placeholderTextColor={appColors.textSecondary}
              />

              <Text style={[styles.label, { color: appColors.textPrimary }]}>Phone</Text>
              <TextInput
                style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Phone number"
                placeholderTextColor={appColors.textSecondary}
              />

              <Text style={[styles.label, { color: appColors.textPrimary }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Email address"
                placeholderTextColor={appColors.textSecondary}
                keyboardType="email-address"
              />

              <Text style={[styles.label, { color: appColors.textPrimary }]}>Website</Text>
              <TextInput
                style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                value={formData.website}
                onChangeText={(text) => setFormData({ ...formData, website: text })}
                placeholder="www.example.com or https://example.com"
                placeholderTextColor={appColors.textSecondary}
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: appColors.textPrimary }]}>Description</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Hospital description"
                placeholderTextColor={appColors.textSecondary}
                multiline
                numberOfLines={4}
              />

              <Text style={[styles.label, { color: appColors.textPrimary }]}>Hospital Logo</Text>
              {logoFile ? (
                <View style={styles.logoPreview}>
                  <Image source={{ uri: logoFile.uri }} style={styles.logoImage} resizeMode="contain" />
                  <TouchableOpacity onPress={() => setLogoFile(null)} style={styles.removeLogoButton}>
                    <FontAwesomeIcon icon="times" size={Responsive.iconSize(16)} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadLogoButton, { backgroundColor: appColors.background, borderColor: appColors.border }]}
                  onPress={handlePickLogo}
                >
                  <FontAwesomeIcon icon="camera" size={Responsive.iconSize(20)} color={appColors.textSecondary} />
                  <Text style={[styles.uploadLogoText, { color: appColors.textSecondary }]}>Choose Logo</Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.label, { color: appColors.textPrimary }]}>Street</Text>
              <TextInput
                style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                value={formData.street}
                onChangeText={(text) => setFormData({ ...formData, street: text })}
                placeholder="Street address"
                placeholderTextColor={appColors.textSecondary}
              />

              <Text style={[styles.label, { color: appColors.textPrimary }]}>City</Text>
              <TextInput
                style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="City"
                placeholderTextColor={appColors.textSecondary}
              />

              <Text style={[styles.label, { color: appColors.textPrimary }]}>State</Text>
              <TextInput
                style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
                placeholder="State"
                placeholderTextColor={appColors.textSecondary}
              />

              <Text style={[styles.label, { color: appColors.textPrimary }]}>Zip Code</Text>
              <TextInput
                style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                value={formData.zipCode}
                onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                placeholder="Zip code"
                placeholderTextColor={appColors.textSecondary}
              />

              <Text style={[styles.label, { color: appColors.textPrimary }]}>Country</Text>
              <TextInput
                style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                value={formData.country}
                onChangeText={(text) => setFormData({ ...formData, country: text })}
                placeholder="Country"
                placeholderTextColor={appColors.textSecondary}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: appColors.background, borderColor: appColors.border }]}
                onPress={() => setShowCreateModal(false)}
                disabled={isSaving}
              >
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
  },
  hospitalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: 4,
  },
  hospitalCode: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: 4,
  },
  hospitalDetail: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: 2,
  },
  statusRow: {
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  logoPreview: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removeLogoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadLogoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  uploadLogoText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
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
});

export default AdminHospitalManagementScreen;

