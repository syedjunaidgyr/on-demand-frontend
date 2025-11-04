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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';
import HospitalAdminApi from '../../services/hospitalAdminApi';
import ApiService from '../../services/api';
import { Typography } from '../../constants/typography';
import Responsive from '../../utils/responsive';
import { useGlobalStyles } from '../../theme/globalStyles';
import { useAppColors } from '../../hooks/useAppColors';
import { useAuth } from '../../navigation/AppNavigator';

interface Unit {
  id: number;
  hospitalId: number;
  unitCode: string;
  unitName: string;
  isActive: boolean;
}

type UnitsScreenRouteProp = RouteProp<{ Units: { hospitalId?: number } }, 'Units'>;

const HospitalAdminUnitsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<UnitsScreenRouteProp>();
  const { user } = useAuth();
  const g = useGlobalStyles();
  const appColors = useAppColors();
  const isAdmin = user?.role === 'ADMIN';
  const hospitalId = route.params?.hospitalId; // Admin passes hospitalId, Hospital Admin uses their own
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [form, setForm] = useState({ unitCode: '', unitName: '' });
  
  // Get user profile to determine actual hospitalId for Hospital Admin
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await ApiService.getProfile();
        setUserProfile(profile);
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    };
    loadProfile();
  }, []);
  
  const effectiveHospitalId = isAdmin ? hospitalId : userProfile?.hospitalId;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (isAdmin && effectiveHospitalId) {
        // Admin: Get units for specific hospital
        // Note: Admin API endpoint for listing units by hospital might need to be implemented
        // For now, we'll use a workaround or show message
        const hospitalDetails = await ApiService.getHospitalDetails(effectiveHospitalId);
        setUnits(hospitalDetails?.units || hospitalDetails?.unitMasters || []);
      } else if (!isAdmin) {
        // Hospital Admin: Use their API
        const res = await HospitalAdminApi.listUnits();
        setUnits(res.units || res || []);
      } else {
        setUnits([]);
      }
    } catch (e: any) {
      console.error('Failed to load units:', e);
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to load units');
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, effectiveHospitalId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCreate = () => {
    setEditingUnit(null);
    setForm({ unitCode: '', unitName: '' });
    setShowModal(true);
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setForm({ unitCode: unit.unitCode, unitName: unit.unitName });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.unitCode || !form.unitName) {
      Alert.alert('Validation', 'Please fill in all fields');
      return;
    }
    if (isAdmin && !effectiveHospitalId) {
      Alert.alert('Error', 'Hospital ID is required');
      return;
    }
    try {
      if (editingUnit) {
        if (isAdmin && effectiveHospitalId) {
          await ApiService.updateUnitForHospital(effectiveHospitalId, editingUnit.unitCode, form);
        } else {
          await HospitalAdminApi.updateUnit(editingUnit.unitCode, form);
        }
        Alert.alert('Success', 'Unit updated successfully');
      } else {
        if (isAdmin && effectiveHospitalId) {
          await ApiService.createUnitForHospital(effectiveHospitalId, form);
        } else {
          await HospitalAdminApi.createUnit(form);
        }
        Alert.alert('Success', 'Unit created successfully');
      }
      setShowModal(false);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to save unit');
    }
  };

  const handleDelete = (unit: Unit) => {
    Alert.alert(
      'Deactivate Unit',
      `Mark ${unit.unitName} as inactive? You can reactivate it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await HospitalAdminApi.updateUnit(unit.unitCode, { isActive: false });
              Alert.alert('Success', 'Unit deactivated successfully');
              await load();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to deactivate unit');
            }
          },
        },
      ]
    );
  };

  const renderUnit = ({ item }: { item: Unit }) => (
    <View style={[styles.unitCard, { backgroundColor: appColors.accentText }]}>
      <View style={styles.unitInfo}>
        <Text style={[styles.unitCode, { color: appColors.primary }]}>{item.unitCode || (item as any).code}</Text>
        <Text style={[styles.unitName, { color: appColors.textPrimary }]}>{item.unitName || (item as any).name}</Text>
        <View style={styles.unitMeta}>
          <View style={[styles.statusBadge, (item.isActive !== false && (item as any).isActive !== false) ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, (item.isActive !== false && (item as any).isActive !== false) ? styles.statusTextActive : styles.statusTextInactive]}>
              {(item.isActive !== false && (item as any).isActive !== false) ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.unitActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
          <FontAwesomeIcon icon="edit" size={Responsive.iconSize(16)} color={appColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: (item.isActive !== false && (item as any).isActive !== false) ? '#FEE2E2' : '#D1FAE5' }]}
          onPress={async () => {
            const isActiveState = item.isActive !== false && (item as any).isActive !== false;
            const nextState = !isActiveState;
            const unitCode = item.unitCode || (item as any).code;
            const unitName = item.unitName || (item as any).name;
            Alert.alert(
              nextState ? 'Activate Unit' : 'Deactivate Unit',
              nextState ? `Activate ${unitName}?` : `Mark ${unitName} as inactive? You can reactivate it later.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: nextState ? 'Activate' : 'Deactivate',
                  style: nextState ? 'default' : 'destructive',
                  onPress: async () => {
                    try {
                      if (isAdmin && effectiveHospitalId) {
                        await ApiService.updateUnitForHospital(effectiveHospitalId, unitCode, { isActive: nextState });
                      } else {
                        await HospitalAdminApi.updateUnit(unitCode, { isActive: nextState });
                      }
                      await load();
                    } catch (e: any) {
                      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to update status');
                    }
                  },
                },
              ]
            );
          }}>
          <FontAwesomeIcon icon={(item.isActive !== false && (item as any).isActive !== false) ? 'times' : 'check'} size={Responsive.iconSize(16)} color={(item.isActive !== false && (item as any).isActive !== false) ? '#B91C1C' : '#059669'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={g.appBackground}>
      <StatusBar backgroundColor={appColors.background} barStyle={appColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />
      <GlobalHeader
        title={isAdmin && effectiveHospitalId ? `Manage Units (Hospital ${effectiveHospitalId})` : "Manage Units"}
        showBackButton={true}
        backgroundColor={appColors.accentText}
        titleColor={appColors.textPrimary}
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}
        backButtonStyle={{ backgroundColor: appColors.accentText, borderWidth: 1, borderColor: appColors.border }}
        rightComponent={
          <TouchableOpacity style={[styles.addButton, { backgroundColor: appColors.primary }]} onPress={handleCreate}>
            <FontAwesomeIcon icon="plus" size={Responsive.iconSize(20)} color={appColors.accentText} />
          </TouchableOpacity>
        }
      />
      
      {isAdmin && !effectiveHospitalId && (
        <View style={[styles.infoBox, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.infoText, { color: '#92400E' }]}>Please select a hospital to manage units</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text style={[styles.loadingText, { color: appColors.textSecondary }]}>Loading units...</Text>
        </View>
      ) : (
        <FlatList
          data={units}
          keyExtractor={(item) => String(item.id || item.unitCode)}
          renderItem={renderUnit}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appColors.primary} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesomeIcon icon="hospital" size={Responsive.iconSize(48)} color={appColors.textSecondary} />
              <Text style={[styles.emptyText, { color: appColors.textPrimary }]}>No units found</Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>Create your first unit to get started</Text>
            </View>
          }
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: appColors.accentText }]}>
            <Text style={[styles.modalTitle, { color: appColors.textPrimary }]}>{editingUnit ? 'Edit Unit' : 'Create Unit'}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
              placeholder="Unit Code (e.g., ICU)"
              value={form.unitCode}
              onChangeText={(v) => setForm({ ...form, unitCode: v.toUpperCase() })}
              placeholderTextColor={appColors.textSecondary}
              editable={!editingUnit}
            />
            <TextInput
              style={[styles.input, { backgroundColor: appColors.background, color: appColors.textPrimary, borderColor: appColors.border }]}
              placeholder="Unit Name (e.g., Intensive Care Unit)"
              value={form.unitName}
              onChangeText={(v) => setForm({ ...form, unitName: v })}
              placeholderTextColor={appColors.textSecondary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelButton, { backgroundColor: appColors.background }]} onPress={() => setShowModal(false)}>
                <Text style={[styles.cancelButtonText, { color: appColors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: appColors.primary }]} onPress={handleSave}>
                <Text style={[styles.saveButtonText, { color: appColors.accentText }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 14, fontFamily: Typography.fontFamily.medium },
  listContent: { padding: 20 },
  unitCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unitInfo: { flex: 1 },
  unitCode: { fontSize: 14, fontFamily: Typography.fontFamily.bold, marginBottom: 4 },
  unitName: { fontSize: 16, fontFamily: Typography.fontFamily.medium, marginBottom: 8 },
  unitMeta: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusInactive: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 12, fontFamily: Typography.fontFamily.bold },
  statusTextActive: { color: '#059669' },
  statusTextInactive: { color: '#B91C1C' },
  unitActions: { flexDirection: 'row', gap: 12 },
  editButton: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  deleteButton: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  addButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontFamily: Typography.fontFamily.medium, marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: Typography.fontFamily.regular, marginTop: 8 },
  infoBox: { padding: 12, borderRadius: 8, marginHorizontal: 20, marginTop: 12 },
  infoText: { fontSize: 13, fontFamily: Typography.fontFamily.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 16, padding: 24, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontFamily: Typography.fontFamily.bold, marginBottom: 20 },
  input: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, fontSize: 15, fontFamily: Typography.fontFamily.regular, borderWidth: 1 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  cancelButtonText: { fontSize: 15, fontFamily: Typography.fontFamily.medium },
  saveButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  saveButtonText: { fontSize: 15, fontFamily: Typography.fontFamily.bold },
});

export default HospitalAdminUnitsScreen;

