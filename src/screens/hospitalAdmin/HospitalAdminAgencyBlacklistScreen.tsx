import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
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

interface BlacklistedAgency {
  id: number;
  agencyId: number;
  hospitalId: number;
  status: string;
  blacklistReason: string;
  blacklistedBy: number;
  blacklistedAt: string;
  agency: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

const REASON_CATEGORIES = [
  'NON_COMPLIANCE',
  'PERFORMANCE',
  'ATTENDANCE',
  'NO_SHOW',
  'RATE_DISPUTE',
  'CONDUCT',
  'OTHER',
];

const HospitalAdminAgencyBlacklistScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [blacklisted, setBlacklisted] = useState<BlacklistedAgency[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all'|'blacklisted'>('blacklisted');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ reasonCategory: 'NON_COMPLIANCE', reasonDetails: '' });
  const [hospitalId, setHospitalId] = useState<number | null>(null);

  useEffect(() => {
    // Get hospitalId from user profile or API
    if (user && !hospitalId) {
      loadHospitalId();
    }
  }, [user]);

  const loadHospitalId = async () => {
    try {
      const hosp = await HospitalAdminApi.getHospitalDetails();
      const hid = hosp?.id || hosp?.hospitalId || hosp?.hospital?.id || hosp?.hospital?.hospitalId;
      if (hid) {
        setHospitalId(hid);
      }
    } catch (e) {
      console.error('Failed to get hospital ID:', e);
    }
  };

  const load = useCallback(async () => {
    if (!hospitalId) {
      await loadHospitalId();
      return;
    }
    await Promise.all([
      loadAllAgencies(hospitalId),
      loadBlacklisted(hospitalId),
    ]);
  }, [hospitalId]);

  const loadBlacklisted = async (hid: number) => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.q = searchQuery;
      const res = await HospitalAdminApi.listBlacklistedAgencies(hid, params);
      setBlacklisted(res.links || res || []);
    } catch (e: any) {
      console.error('Failed to load blacklisted agencies:', e);
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to load blacklisted agencies');
    } finally {
      setLoading(false);
    }
  };

  const loadAllAgencies = async (hid: number) => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.q = searchQuery;
      const res = await HospitalAdminApi.listHospitalAgencies(hid, params);
      const list = res?.agencies || res || [];
      setAgencies(list);
    } catch (e: any) {
      console.error('Failed to load agencies:', e);
      // Non-fatal: keep list empty
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hospitalId) {
      if (activeTab === 'blacklisted') loadBlacklisted(hospitalId);
      else loadAllAgencies(hospitalId);
    }
  }, [activeTab]);

  useEffect(() => {
    if (hospitalId) {
      Promise.all([
        loadAllAgencies(hospitalId),
        loadBlacklisted(hospitalId),
      ]).catch(() => {});
    }
  }, [hospitalId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleBlacklist = (agencyId: number) => {
    setSelectedAgencyId(agencyId);
    setForm({ reasonCategory: 'NON_COMPLIANCE', reasonDetails: '' });
    setShowModal(true);
  };

  const handleSubmitBlacklist = async () => {
    if (!selectedAgencyId || !hospitalId) return;
    if (!form.reasonDetails.trim()) {
      Alert.alert('Validation', 'Please provide reason details');
      return;
    }
    try {
      await HospitalAdminApi.blacklistAgency(selectedAgencyId, hospitalId, form);
      Alert.alert('Success', 'Agency blacklisted successfully');
      setShowModal(false);
      await Promise.all([
        loadAllAgencies(hospitalId),
        loadBlacklisted(hospitalId),
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to blacklist agency');
    }
  };

  const handleRestore = (agency: BlacklistedAgency) => {
    Alert.alert(
      'Restore Agency',
      `Are you sure you want to restore ${agency.agency.firstName} ${agency.agency.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await HospitalAdminApi.restoreAgency(agency.agencyId, agency.hospitalId);
              Alert.alert('Success', 'Agency restored successfully');
              await load();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to restore agency');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const renderAgency = ({ item }: { item: BlacklistedAgency }) => (
    <View style={styles.agencyCard}>
      <View style={styles.agencyInfo}>
        <Text style={styles.agencyName}>
          {item.agency.firstName} {item.agency.lastName}
        </Text>
        <Text style={styles.agencyEmail}>{item.agency.email}</Text>
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{item.blacklistReason}</Text>
        </View>
        <Text style={styles.blacklistedAt}>Blacklisted on: {formatDate(item.blacklistedAt)}</Text>
      </View>
      <TouchableOpacity style={styles.restoreButton} onPress={() => handleRestore(item)}>
        <Text style={styles.restoreButtonText}>Restore</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader
        title="Agency Blacklist"
        showBackButton={true}
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}
        backButtonStyle={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#d1d5db' }}
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search agencies..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (hospitalId) {
              if (activeTab === 'blacklisted') loadBlacklisted(hospitalId);
              else loadAllAgencies(hospitalId);
            }
          }}
          placeholderTextColor={Colors.textSecondary}
        />
        <FontAwesomeIcon icon="search" size={Responsive.iconSize(18)} color={Colors.textSecondary} style={styles.searchIcon} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 8 }}>
        <TouchableOpacity onPress={() => setActiveTab('blacklisted')} style={{ marginRight: 16 }}>
          <Text style={{ color: activeTab==='blacklisted' ? Colors.primary : Colors.textSecondary, fontFamily: Typography.fontFamily.medium }}>Blacklisted</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('all')}>
          <Text style={{ color: activeTab==='all' ? Colors.primary : Colors.textSecondary, fontFamily: Typography.fontFamily.medium }}>All Agencies</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        activeTab==='blacklisted' ? (
          <FlatList
            data={blacklisted}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderAgency}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesomeIcon icon="ban" size={Responsive.iconSize(48)} color="#D1D5DB" />
                <Text style={styles.emptyText}>No blacklisted agencies</Text>
                <Text style={styles.emptySubtext}>Agencies that are blacklisted will appear here</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={agencies}
            keyExtractor={(item, idx) => String(item.id || item.agencyId || idx)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.agencyCard}>
                <View style={styles.agencyInfo}>
                  <Text style={styles.agencyName}>{item.firstName || item.name || 'Agency'} {item.lastName || ''}</Text>
                  {item.email ? <Text style={styles.agencyEmail}>{item.email}</Text> : null}
                </View>
                {item.status === 'REVOKED' ? (
                  <TouchableOpacity style={styles.restoreButton} onPress={() => item.agencyId && hospitalId && HospitalAdminApi.restoreAgency(item.agencyId, hospitalId).then(() => loadAllAgencies(hospitalId)).then(() => loadBlacklisted(hospitalId)).catch((e) => Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to restore'))}>
                    <Text style={styles.restoreButtonText}>Restore</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.restoreButton, { backgroundColor: '#EF4444' }]} onPress={() => { setSelectedAgencyId(item.id || item.agencyId); setShowModal(true); }}>
                    <Text style={styles.restoreButtonText}>Blacklist</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesomeIcon icon="users" size={Responsive.iconSize(48)} color="#D1D5DB" />
                <Text style={styles.emptyText}>No agencies found</Text>
                <Text style={styles.emptySubtext}>Agencies assigned to your hospital will appear here</Text>
              </View>
            }
          />
        )
      )}

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Blacklist Agency</Text>
            <Text style={styles.modalSubtitle}>Select reason category and provide details</Text>

            <Text style={styles.label}>Reason Category</Text>
            <ScrollView style={styles.categoryList} nestedScrollEnabled>
              {REASON_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryOption, form.reasonCategory === cat && styles.categoryOptionActive]}
                  onPress={() => setForm({ ...form, reasonCategory: cat })}>
                  <Text style={[styles.categoryText, form.reasonCategory === cat && styles.categoryTextActive]}>
                    {cat.replace(/_/g, ' ')}
                  </Text>
                  {form.reasonCategory === cat && (
                    <FontAwesomeIcon icon="check" size={Responsive.iconSize(16)} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Reason Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide detailed reason for blacklisting..."
              value={form.reasonDetails}
              onChangeText={(v) => setForm({ ...form, reasonDetails: v })}
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitBlacklist}>
                <Text style={styles.submitButtonText}>Blacklist</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchContainer: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: { flex: 1, backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: Typography.fontFamily.regular, paddingRight: 40 },
  searchIcon: { position: 'absolute', right: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20 },
  agencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agencyInfo: { marginBottom: 12 },
  agencyName: { fontSize: 18, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: 4 },
  agencyEmail: { fontSize: 14, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, marginBottom: 12 },
  reasonContainer: { marginBottom: 8 },
  reasonLabel: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary, marginBottom: 4 },
  reasonText: { fontSize: 14, fontFamily: Typography.fontFamily.regular, color: Colors.textPrimary },
  blacklistedAt: { fontSize: 12, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, marginTop: 4 },
  restoreButton: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  restoreButtonText: { fontSize: 14, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, marginBottom: 20 },
  label: { fontSize: 14, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, marginBottom: 8 },
  categoryList: { maxHeight: 200, marginBottom: 16 },
  categoryOption: { backgroundColor: Colors.background, padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryOptionActive: { backgroundColor: Colors.primary },
  categoryText: { fontSize: 14, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary },
  categoryTextActive: { color: '#FFFFFF' },
  input: { backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, fontSize: 15, fontFamily: Typography.fontFamily.regular, borderWidth: 1, borderColor: Colors.border },
  textArea: { height: 100, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  cancelButtonText: { fontSize: 15, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  submitButton: { backgroundColor: '#EF4444', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  submitButtonText: { fontSize: 15, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
});

export default HospitalAdminAgencyBlacklistScreen;

