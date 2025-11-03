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

interface Unit {
  id: number;
  hospitalId: number;
  unitCode: string;
  unitName: string;
  isActive: boolean;
}

const HospitalAdminUnitsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [form, setForm] = useState({ unitCode: '', unitName: '' });

  const load = useCallback(async () => {
    try {
      const res = await HospitalAdminApi.listUnits();
      setUnits(res.units || res || []);
    } catch (e: any) {
      console.error('Failed to load units:', e);
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to load units');
    } finally {
      setLoading(false);
    }
  }, []);

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
    try {
      if (editingUnit) {
        await HospitalAdminApi.updateUnit(editingUnit.unitCode, form);
        Alert.alert('Success', 'Unit updated successfully');
      } else {
        await HospitalAdminApi.createUnit(form);
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
    <View style={styles.unitCard}>
      <View style={styles.unitInfo}>
        <Text style={styles.unitCode}>{item.unitCode}</Text>
        <Text style={styles.unitName}>{item.unitName}</Text>
        <View style={styles.unitMeta}>
          <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, item.isActive ? styles.statusTextActive : styles.statusTextInactive]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.unitActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
          <FontAwesomeIcon icon="edit" size={Responsive.iconSize(16)} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: item.isActive ? '#FEE2E2' : '#D1FAE5' }]}
          onPress={async () => {
            const nextState = !item.isActive;
            Alert.alert(
              nextState ? 'Activate Unit' : 'Deactivate Unit',
              nextState ? `Activate ${item.unitName}?` : `Mark ${item.unitName} as inactive? You can reactivate it later.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: nextState ? 'Activate' : 'Deactivate',
                  style: nextState ? 'default' : 'destructive',
                  onPress: async () => {
                    try {
                      await HospitalAdminApi.updateUnit(item.unitCode, { isActive: nextState });
                      await load();
                    } catch (e: any) {
                      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to update status');
                    }
                  },
                },
              ]
            );
          }}>
          <FontAwesomeIcon icon={item.isActive ? 'times' : 'check'} size={Responsive.iconSize(16)} color={item.isActive ? '#B91C1C' : '#059669'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader
        title="Manage Units"
        showBackButton={true}
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}
        backButtonStyle={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#d1d5db' }}
        rightComponent={
          <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
            <FontAwesomeIcon icon="plus" size={Responsive.iconSize(20)} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={units}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUnit}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesomeIcon icon="hospital" size={Responsive.iconSize(48)} color="#D1D5DB" />
              <Text style={styles.emptyText}>No units found</Text>
              <Text style={styles.emptySubtext}>Create your first unit to get started</Text>
            </View>
          }
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingUnit ? 'Edit Unit' : 'Create Unit'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Unit Code (e.g., ICU)"
              value={form.unitCode}
              onChangeText={(v) => setForm({ ...form, unitCode: v.toUpperCase() })}
              placeholderTextColor={Colors.textSecondary}
              editable={!editingUnit}
            />
            <TextInput
              style={styles.input}
              placeholder="Unit Name (e.g., Intensive Care Unit)"
              value={form.unitName}
              onChangeText={(v) => setForm({ ...form, unitName: v })}
              placeholderTextColor={Colors.textSecondary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20 },
  unitCard: {
    backgroundColor: '#FFFFFF',
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
  unitCode: { fontSize: 14, fontFamily: Typography.fontFamily.bold, color: Colors.primary, marginBottom: 4 },
  unitName: { fontSize: 16, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, marginBottom: 8 },
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
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: 20 },
  input: { backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, fontSize: 15, fontFamily: Typography.fontFamily.regular, borderWidth: 1, borderColor: Colors.border },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  cancelButtonText: { fontSize: 15, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  saveButton: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  saveButtonText: { fontSize: 15, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
});

export default HospitalAdminUnitsScreen;

