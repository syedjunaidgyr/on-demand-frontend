import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import HospitalAdminApi from '../../services/hospitalAdminApi';
import { useTheme } from '../../contexts/ThemeContext';

const HospitalAdminThemeManageScreen: React.FC = () => {
  const { loadAndApplyDefaultTheme } = useTheme();
  const [themes, setThemes] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({
    id: '',
    name: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#2563EB',
    backgroundColor: '#F3F9FF',
    textColor: '#111827',
    accentTextColor: '#FFFFFF',
  });

  const load = async () => {
    const res = await HospitalAdminApi.getThemes();
    setThemes(res?.themes || res || []);
    const current = res?.current;
    const cid = current ? current.id || current : null;
    setCurrentId(cid || null);
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const create = async () => {
    try {
      await HospitalAdminApi.createTheme({ ...form, id: form.id || undefined });
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to create theme');
    }
  };

  const update = async () => {
    if (!form.id) return Alert.alert('Validation', 'Enter a theme id to update');
    try {
      const { id, ...updates } = form as any;
      await HospitalAdminApi.updateTheme(id, updates);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to update theme');
    }
  };

  const setDefault = async (id: string) => {
    try {
      await HospitalAdminApi.setDefaultTheme(id);
      await load();
      await loadAndApplyDefaultTheme();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to set default theme');
    }
  };

  const remove = async (id: string) => {
    if (currentId === id) return Alert.alert('Blocked', 'Select a different default before deleting this theme.');
    try {
      await HospitalAdminApi.deleteTheme(id);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to delete theme');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemRow}>
      <View style={[styles.colorDot, { backgroundColor: item.primaryColor }]} />
      <Text style={styles.itemName}>{item.id || item.name}</Text>
      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.smallBtn} onPress={() => setDefault(item.id || item.name)}>
          <Text style={styles.smallBtnText}>Default</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.smallBtn, styles.deleteBtn]} onPress={() => remove(item.id || item.name)}>
          <Text style={[styles.smallBtnText, styles.deleteBtnText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Themes</Text>

      <View style={styles.formRow}>
        <TextInput style={styles.input} placeholder="id (optional for create)" value={form.id} onChangeText={(v) => setForm({ ...form, id: v })} placeholderTextColor={Colors.textSecondary} />
        <TextInput style={styles.input} placeholder="name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholderTextColor={Colors.textSecondary} />
      </View>
      <View style={styles.formRow}>
        <TextInput style={styles.input} placeholder="#primaryColor" value={form.primaryColor} onChangeText={(v) => setForm({ ...form, primaryColor: v })} placeholderTextColor={Colors.textSecondary} />
        <TextInput style={styles.input} placeholder="#secondaryColor" value={form.secondaryColor} onChangeText={(v) => setForm({ ...form, secondaryColor: v })} placeholderTextColor={Colors.textSecondary} />
      </View>
      <View style={styles.formRow}>
        <TextInput style={styles.input} placeholder="#backgroundColor" value={form.backgroundColor} onChangeText={(v) => setForm({ ...form, backgroundColor: v })} placeholderTextColor={Colors.textSecondary} />
        <TextInput style={styles.input} placeholder="#textColor" value={form.textColor} onChangeText={(v) => setForm({ ...form, textColor: v })} placeholderTextColor={Colors.textSecondary} />
      </View>
      <View style={styles.formRow}>
        <TextInput style={styles.input} placeholder="#accentTextColor" value={form.accentTextColor} onChangeText={(v) => setForm({ ...form, accentTextColor: v })} placeholderTextColor={Colors.textSecondary} />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={create}><Text style={styles.primaryBtnText}>Create</Text></TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={update}><Text style={styles.primaryBtnText}>Update</Text></TouchableOpacity>
      </View>

      <FlatList
        data={themes}
        keyExtractor={(item) => String(item.id || item.name)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.subtitle}>No themes</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary, marginBottom: 10 },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  formRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  input: { flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: Colors.textPrimary },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  primaryBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  colorDot: { width: 16, height: 16, borderRadius: 8, marginRight: 10 },
  itemName: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  rowActions: { flexDirection: 'row', gap: 8 },
  smallBtn: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  smallBtnText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600' },
  deleteBtn: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  deleteBtnText: { color: '#B91C1C' },
});

export default HospitalAdminThemeManageScreen;


