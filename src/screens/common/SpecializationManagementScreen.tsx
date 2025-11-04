import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import { Typography } from '../../constants/typography';
import Responsive from '../../utils/responsive';
import { useGlobalStyles } from '../../theme/globalStyles';
import { useAppColors } from '../../hooks/useAppColors';
import ApiService from '../../services/api';
import { useAuth } from '../../navigation/AppNavigator';
import GlobalHeader from '../../components/GlobalHeader';

const SpecializationManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const g = useGlobalStyles();
  const appColors = useAppColors();
  const { user } = useAuth();
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    department: '',
  });

  const isAdmin = user?.role === 'ADMIN';
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN';

  useEffect(() => {
    loadSpecializations();
  }, []);

  const loadSpecializations = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use the existing getSpecializations API which returns all specializations from jobs
      const data = await ApiService.getSpecializations();
      setSpecializations(Array.isArray(data) ? data : (data.specializations || []));
    } catch (error: any) {
      console.error('Failed to load specializations:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load specializations');
      setSpecializations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSpecializations();
    setRefreshing(false);
  };

  const handleCreate = () => {
    setFormData({ name: '', code: '', description: '', department: '' });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Specialization name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isAdmin) {
        await ApiService.createSpecialization({
          name: formData.name.trim(),
          code: formData.code.trim() || undefined,
          description: formData.description.trim() || undefined,
          department: formData.department.trim() || undefined,
        });
      } else if (isHospitalAdmin) {
        await ApiService.createHospitalSpecialization({
          name: formData.name.trim(),
          code: formData.code.trim() || undefined,
          description: formData.description.trim() || undefined,
          department: formData.department.trim() || undefined,
        });
      } else {
        Alert.alert('Error', 'You do not have permission to create specializations');
        return;
      }
      
      Alert.alert('Success', 'Specialization created successfully');
      setShowCreateModal(false);
      await loadSpecializations();
    } catch (error: any) {
      console.error('Failed to create specialization:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to create specialization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSpecializations = specializations.filter(spec =>
    spec.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const medicalDepartments = [
    'Emergency Medicine',
    'General Medicine',
    'General Surgery',
    'Obstetrics & Gynecology',
    'Pediatrics',
    'Orthopedics',
    'Cardiology',
    'Neurology',
    'Urology',
    'Nephrology',
    'Gastroenterology',
    'Oncology',
    'ENT',
    'Ophthalmology',
    'Dermatology',
    'Psychiatry',
    'Radiology',
    'Pathology',
    'Anesthesiology',
    'Physiotherapy',
  ];

  return (
    <SafeAreaView style={[g.appBackground, { flex: 1 }]}>
      <StatusBar backgroundColor={appColors.background} barStyle={appColors.barStyle} />
      <GlobalHeader
        title="Specializations"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: appColors.accentText }]}>
          <FontAwesomeIcon icon="search" size={Responsive.iconSize(18)} color={appColors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: appColors.textPrimary }]}
            placeholder="Search specializations..."
            placeholderTextColor={appColors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Action Bar */}
        {(isAdmin || isHospitalAdmin) && (
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: appColors.primary }]}
            onPress={handleCreate}
          >
            <FontAwesomeIcon icon="plus" size={Responsive.iconSize(16)} color={appColors.accentText} />
            <Text style={[styles.createButtonText, { color: appColors.accentText }]}>Add Specialization</Text>
          </TouchableOpacity>
        )}

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={appColors.primary} />
            <Text style={[styles.loadingText, { color: appColors.textSecondary }]}>Loading specializations...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appColors.primary} />}
          >
            {filteredSpecializations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesomeIcon icon="list" size={Responsive.iconSize(48)} color={appColors.textSecondary} />
                <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>
                  {searchQuery ? 'No specializations found' : 'No specializations available'}
                </Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {filteredSpecializations.map((spec, index) => (
                  <View key={index} style={[styles.specCard, { backgroundColor: appColors.accentText }]}>
                    <View style={styles.specContent}>
                      <FontAwesomeIcon icon="stethoscope" size={Responsive.iconSize(20)} color={appColors.primary} />
                      <Text style={[styles.specName, { color: appColors.textPrimary }]}>{spec}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: appColors.accentText }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: appColors.textPrimary }]}>Add Specialization</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <FontAwesomeIcon icon="times" size={Responsive.iconSize(20)} color={appColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: appColors.textPrimary }]}>Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                  placeholder="Enter specialization name"
                  placeholderTextColor={appColors.textSecondary}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: appColors.textPrimary }]}>Code (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                  placeholder="Enter code"
                  placeholderTextColor={appColors.textSecondary}
                  value={formData.code}
                  onChangeText={(text) => setFormData({ ...formData, code: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: appColors.textPrimary }]}>Department (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                  placeholder="Select department"
                  placeholderTextColor={appColors.textSecondary}
                  value={formData.department}
                  onChangeText={(text) => setFormData({ ...formData, department: text })}
                />
                <Text style={[styles.inputHint, { color: appColors.textSecondary }]}>
                  Examples: Emergency Medicine, Cardiology, etc.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: appColors.textPrimary }]}>Description (Optional)</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
                  placeholder="Enter description"
                  placeholderTextColor={appColors.textSecondary}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {isHospitalAdmin && (
                <View style={[styles.infoBox, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={[styles.infoText, { color: '#1E40AF', fontSize: 12 }]}>
                    Note: Hospital Admin can create specializations. These will be scoped to your hospital.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: appColors.border }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: appColors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: appColors.primary }]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={appColors.accentText} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: appColors.accentText }]}>Save</Text>
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
  container: {
    flex: 1,
    padding: Responsive.scale(16),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Responsive.scale(12),
    paddingVertical: Responsive.verticalScale(10),
    borderRadius: Responsive.scale(8),
    marginBottom: Responsive.verticalScale(16),
    gap: Responsive.scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Responsive.verticalScale(12),
    paddingHorizontal: Responsive.scale(16),
    borderRadius: Responsive.scale(8),
    marginBottom: Responsive.verticalScale(16),
    gap: Responsive.scale(8),
  },
  createButtonText: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.medium,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Responsive.verticalScale(16),
  },
  loadingText: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Responsive.verticalScale(60),
    gap: Responsive.verticalScale(16),
  },
  emptyText: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.regular,
  },
  listContainer: {
    gap: Responsive.verticalScale(12),
  },
  specCard: {
    padding: Responsive.scale(16),
    borderRadius: Responsive.scale(12),
    marginBottom: Responsive.verticalScale(8),
  },
  specContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Responsive.scale(12),
  },
  specName: {
    flex: 1,
    fontSize: Responsive.fontSize(15),
    fontFamily: Typography.fontFamily.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Responsive.scale(20),
    borderTopRightRadius: Responsive.scale(20),
    maxHeight: '90%',
    paddingBottom: Responsive.verticalScale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Responsive.scale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: Responsive.fontSize(18),
    fontFamily: Typography.fontFamily.bold,
  },
  modalBody: {
    padding: Responsive.scale(20),
    maxHeight: Responsive.verticalScale(500),
  },
  inputGroup: {
    marginBottom: Responsive.verticalScale(16),
  },
  inputLabel: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Responsive.verticalScale(8),
  },
  input: {
    padding: Responsive.scale(12),
    borderRadius: Responsive.scale(8),
    borderWidth: 1,
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular,
  },
  textArea: {
    padding: Responsive.scale(12),
    borderRadius: Responsive.scale(8),
    borderWidth: 1,
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular,
    minHeight: Responsive.verticalScale(100),
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: Responsive.fontSize(12),
    fontFamily: Typography.fontFamily.regular,
    marginTop: Responsive.verticalScale(4),
  },
  infoBox: {
    padding: Responsive.scale(12),
    borderRadius: Responsive.scale(8),
    marginTop: Responsive.verticalScale(8),
  },
  infoText: {
    fontSize: Responsive.fontSize(12),
    fontFamily: Typography.fontFamily.regular,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Responsive.scale(20),
    gap: Responsive.scale(12),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Responsive.verticalScale(12),
    borderRadius: Responsive.scale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  saveButton: {
    // backgroundColor set inline
  },
  modalButtonText: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.medium,
  },
});

export default SpecializationManagementScreen;

