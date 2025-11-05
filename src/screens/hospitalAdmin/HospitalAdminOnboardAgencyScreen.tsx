import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';
import HospitalAdminApi from '../../services/hospitalAdminApi';
import { Typography } from '../../constants/typography';
import Responsive from '../../utils/responsive';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../navigation/AppNavigator';

interface Agency {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
}

const HospitalAdminOnboardAgencyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    notes: '',
    terms: '',
  });
  const [hospitalId, setHospitalId] = useState<number | null>(null);
  const [onboarding, setOnboarding] = useState(false);

  const [activeTab, setActiveTab] = useState<'unlinked' | 'linked'>('unlinked');
  const [linkedAgencies, setLinkedAgencies] = useState<any[]>([]);

  useEffect(() => {
    loadHospitalId();
  }, []);

  const loadHospitalId = async () => {
    try {
      const hosp = await HospitalAdminApi.getHospitalDetails();
      const hid = hosp?.id || hosp?.hospitalId || hosp?.hospital?.id || hosp?.hospital?.hospitalId;
      if (hid) {
        setHospitalId(hid);
        await Promise.all([loadUnlinked(hid), loadLinked(hid)]);
      }
    } catch (e) {
      console.error('Failed to get hospital ID:', e);
    }
  };

  const loadUnlinked = async (hid?: number) => {
    try {
      setLoading(true);
      const hId = hid || hospitalId;
      if (!hId) {
        await loadHospitalId();
        return;
      }
      console.log('[HA Onboard] GET unlinked agencies for hospital:', hId);
      const res = await HospitalAdminApi.listUnlinkedAgencies(hId);
      const list = (res as any)?.agencies || (res as any)?.data || res || [];
      console.log('[HA Onboard] unlinked response count:', Array.isArray(list) ? list.length : 0);
      setAgencies(Array.isArray(list) ? list : []);
    } catch (error: any) {
      console.error('Failed to load agencies:', error);
      Alert.alert('Error', 'Failed to load agencies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLinked = async (hid?: number) => {
    try {
      const hId = hid || hospitalId;
      if (!hId) return;
      console.log('[HA Onboard] GET linked agencies for hospital:', hId);
      const res = await HospitalAdminApi.listHospitalAgencies(hId);
      const list = (res as any)?.agencies || (res as any)?.data || res || [];
      const normalized = list.map((a: any) => (a?.agency ? a.agency : a));
      console.log('[HA Onboard] linked response count:', Array.isArray(normalized) ? normalized.length : 0);
      setLinkedAgencies(Array.isArray(normalized) ? normalized : []);
    } catch (e) {
      setLinkedAgencies([]);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'unlinked') {
      loadUnlinked();
    } else {
      loadLinked();
    }
  }, [hospitalId, activeTab]);

  const handleSelectAgency = (agency: Agency) => {
    setSelectedAgency(agency);
    setShowModal(true);
  };

  const handleOnboard = async () => {
    if (!selectedAgency || !hospitalId) {
      Alert.alert('Error', 'Please select an agency');
      return;
    }

    Alert.alert(
      'Confirm Onboard',
      `Onboard ${selectedAgency.firstName} ${selectedAgency.lastName} to your hospital?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Onboard', style: 'destructive', onPress: async () => {
            try {
              setOnboarding(true);
              await HospitalAdminApi.onboardAgency(selectedAgency.id, hospitalId, {
                notes: onboardingData.notes || undefined,
                terms: onboardingData.terms || undefined,
              });
              Alert.alert('Success', 'Agency onboarded successfully', [
                { text: 'OK', onPress: () => {
                  setShowModal(false);
                  setSelectedAgency(null);
                  setOnboardingData({ notes: '', terms: '' });
                  loadAgencies();
                }},
              ]);
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to onboard agency');
            } finally {
              setOnboarding(false);
            }
        } }
      ]
    );
  };

  const filteredAgencies = agencies.filter((agency) => {
    const search = searchQuery.toLowerCase();
    return (
      agency.email.toLowerCase().includes(search) ||
      agency.firstName.toLowerCase().includes(search) ||
      agency.lastName.toLowerCase().includes(search) ||
      (agency.companyName && agency.companyName.toLowerCase().includes(search))
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader title="Onboard Agency" showBackButton />
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <FontAwesomeIcon icon="search" size={Responsive.iconSize(16)} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search agencies..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={styles.tabsRow}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'unlinked' && styles.tabBtnActive]} onPress={() => setActiveTab('unlinked')}>
            <Text style={[styles.tabText, activeTab === 'unlinked' && styles.tabTextActive]}>Unlinked</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'linked' && styles.tabBtnActive]} onPress={() => setActiveTab('linked')}>
            <Text style={[styles.tabText, activeTab === 'linked' && styles.tabTextActive]}>Linked</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'unlinked' ? filteredAgencies : linkedAgencies.filter(a => {
            const s = searchQuery.toLowerCase();
            const full = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
            return (a.email || '').toLowerCase().includes(s) || full.includes(s) || (a.companyName || '').toLowerCase().includes(s);
          })}
          keyExtractor={(item) => `agency-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.agencyCard}
              onPress={() => handleSelectAgency(item)}
              activeOpacity={0.7}>
              <View style={styles.agencyInfo}>
                <View style={styles.agencyIcon}>
                  <FontAwesomeIcon icon="building" size={Responsive.iconSize(20)} color={Colors.primary} />
                </View>
                <View style={styles.agencyDetails}>
                  <Text style={styles.agencyName}>
                    {(item.firstName || '') + ' ' + (item.lastName || '')}
                  </Text>
                  <Text style={styles.agencyEmail}>{item.email}</Text>
                  {item.companyName && (
                    <Text style={styles.agencyCompany}>{item.companyName}</Text>
                  )}
                </View>
              </View>
              <FontAwesomeIcon icon="chevron-right" size={Responsive.iconSize(16)} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesomeIcon icon="building" size={Responsive.iconSize(48)} color="#D1D5DB" />
              <Text style={styles.emptyText}>No agencies found</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Onboarding Modal */}
      {showModal && selectedAgency && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agency Details</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <FontAwesomeIcon icon="times" size={Responsive.iconSize(20)} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalAgencyName}>
              {(selectedAgency.firstName || '') + ' ' + (selectedAgency.lastName || '')}
            </Text>
            <Text style={styles.modalAgencyEmail}>{selectedAgency.email}</Text>

            <ScrollView style={styles.modalScroll}>
              {selectedAgency.companyName ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Company</Text>
                  <Text style={styles.modalAgencyEmail}>{selectedAgency.companyName}</Text>
                </View>
              ) : null}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add any notes about this onboarding..."
                  value={onboardingData.notes}
                  onChangeText={(text) => setOnboardingData(prev => ({ ...prev, notes: text }))}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Terms (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add any terms or conditions..."
                  value={onboardingData.terms}
                  onChangeText={(text) => setOnboardingData(prev => ({ ...prev, terms: text }))}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              {activeTab === 'unlinked' ? (
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton, onboarding && styles.submitButtonDisabled]}
                  onPress={() => {
                    if (!selectedAgency || !hospitalId) return;
                    Alert.alert('Confirm Link', 'Link this agency to your hospital?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Link', style: 'destructive', onPress: async () => {
                        try {
                          setOnboarding(true);
                          console.log('[HA Onboard] LINK', { agencyId: selectedAgency.id, hospitalId });
                          await HospitalAdminApi.linkAgencyToHospital(selectedAgency.id, [Number(hospitalId)]);
                          Alert.alert('Success', 'Agency linked');
                          setShowModal(false);
                          await Promise.all([loadUnlinked(), loadLinked()]);
                        } catch (e: any) {
                          console.log('[HA Onboard] LINK failed', e?.response?.status, e?.response?.data || e?.message);
                          Alert.alert('Link failed', e?.response?.data?.message || e?.message || 'Failed');
                        } finally {
                          setOnboarding(false);
                        }
                      } }
                    ]);
                  }}
                  disabled={onboarding}>
                  {onboarding ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Link to Hospital</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton, onboarding && styles.submitButtonDisabled]}
                  onPress={() => {
                    if (!selectedAgency || !hospitalId) return;
                    Alert.alert('Confirm Unlink', 'Unlink this agency from your hospital?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Unlink', style: 'destructive', onPress: async () => {
                        try {
                          setOnboarding(true);
                          console.log('[HA Onboard] UNLINK', { agencyId: selectedAgency.id, hospitalId });
                          await HospitalAdminApi.unlinkAgencyFromHospital(selectedAgency.id, hospitalId);
                          Alert.alert('Success', 'Agency unlinked');
                          setShowModal(false);
                          await Promise.all([loadUnlinked(), loadLinked()]);
                        } catch (e: any) {
                          console.log('[HA Onboard] UNLINK failed', e?.response?.status, e?.response?.data || e?.message);
                          Alert.alert('Unlink failed', e?.response?.data?.message || e?.message || 'Failed');
                        } finally {
                          setOnboarding(false);
                        }
                      } }
                    ]);
                  }}
                  disabled={onboarding}>
                  {onboarding ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Unlink from Hospital</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F9FF',
  },
  searchContainer: {
    padding: Responsive.scale(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: Responsive.scale(8),
    paddingHorizontal: Responsive.scale(12),
    gap: Responsive.scale(8),
  },
  searchInput: {
    flex: 1,
    padding: Responsive.scale(12),
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular,
    color: '#111827',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Responsive.scale(8),
    marginTop: Responsive.verticalScale(12),
  },
  tabBtn: {
    paddingVertical: Responsive.scale(8),
    paddingHorizontal: Responsive.scale(12),
    borderRadius: Responsive.scale(8),
    backgroundColor: '#E5E7EB',
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Responsive.fontSize(13),
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Responsive.scale(16),
  },
  agencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Responsive.scale(12),
    padding: Responsive.scale(16),
    marginBottom: Responsive.verticalScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  agencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  agencyIcon: {
    width: Responsive.scale(48),
    height: Responsive.scale(48),
    borderRadius: Responsive.scale(24),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Responsive.scale(12),
  },
  agencyDetails: {
    flex: 1,
  },
  agencyName: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    marginBottom: Responsive.verticalScale(4),
  },
  agencyEmail: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
    marginBottom: Responsive.verticalScale(2),
  },
  agencyCompany: {
    fontSize: Responsive.fontSize(12),
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Responsive.verticalScale(48),
  },
  emptyText: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.medium,
    color: '#9CA3AF',
    marginTop: Responsive.verticalScale(16),
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: Responsive.scale(16),
    width: '90%',
    maxHeight: '80%',
    padding: Responsive.scale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Responsive.verticalScale(16),
  },
  modalTitle: {
    fontSize: Responsive.fontSize(20),
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
  },
  modalAgencyName: {
    fontSize: Responsive.fontSize(18),
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    marginBottom: Responsive.verticalScale(4),
  },
  modalAgencyEmail: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
    marginBottom: Responsive.verticalScale(16),
  },
  modalScroll: {
    maxHeight: Responsive.verticalScale(300),
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
  textArea: {
    minHeight: Responsive.verticalScale(100),
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Responsive.verticalScale(16),
    gap: Responsive.scale(12),
  },
  modalButton: {
    flex: 1,
    padding: Responsive.scale(16),
    borderRadius: Responsive.scale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.bold,
    color: '#374151',
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
  },
});

export default HospitalAdminOnboardAgencyScreen;

