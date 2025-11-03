import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, TextInput, FlatList, Alert, StatusBar } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import GlobalHeader from '../../components/GlobalHeader';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { FontAwesomeIcon } from '../../utils/icons';
import ApiService from '../../services/api';
import { useAuth } from '../../navigation/AppNavigator';

type ParamList = {
  AgencyAssignNurse: { jobId: string; hourlyRate?: number; mode?: 'FULL' | 'PARTIAL' };
};

const AgencyAssignNurseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'AgencyAssignNurse'>>();
  const { user } = useAuth();
  const jobId = route.params?.jobId as string;
  const [mode, setMode] = useState<'FULL' | 'PARTIAL'>(route.params?.mode || 'FULL');
  const [hourlyRate, setHourlyRate] = useState<string>(route.params?.hourlyRate ? String(route.params.hourlyRate) : '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pool, setPool] = useState<any[]>([]);
  const [nurses, setNurses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const agencyId = user?.id;
        if (!agencyId) throw new Error('No agency id');
        const res = await ApiService.getAgencyNurses(agencyId);
        setPool(res.pool || []);
        setNurses(res.nurses || []);
      } catch (e) {
        Alert.alert('Error', 'Failed to load nurses.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const eligiblePool = (pool || []).filter((m: any) => String(m.status || '').toUpperCase() !== 'REVOKED');

  const items = eligiblePool.map((m: any) => {
    const fallback = nurses.find((x: any) => String(x.id) === String(m.nurseId)) || {};
    const n = m.nurse || fallback || {};
    return { id: n.id, firstName: n.firstName, lastName: n.lastName, email: n.email, status: m.status };
  }).filter((n: any) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      String(n.firstName || '').toLowerCase().includes(q) ||
      String(n.lastName || '').toLowerCase().includes(q) ||
      String(n.email || '').toLowerCase().includes(q)
    );
  });

  const submit = async () => {
    try {
      if (!selectedUserId) {
        Alert.alert('Select Nurse', 'Please select a nurse to assign.');
        return;
      }
      const rate = parseFloat(hourlyRate || '0');
      if (!rate || isNaN(rate)) {
        Alert.alert('Hourly Rate', 'Enter a valid hourly rate.');
        return;
      }
      setSubmitting(true);
      await ApiService.assignNursesToAgencyJob(jobId, {
        mode,
        hourlyRate: rate,
        assignments: [{ userId: selectedUserId }],
      });
      Alert.alert('Success', 'Nurse assigned to job.', [
        { text: 'OK', onPress: () => (navigation as any).goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to assign nurse.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" translucent={false} />
      <GlobalHeader 
        title="Assign Nurse"
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        onBackPress={() => (navigation as any).goBack?.()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16 }}
      />

      <View style={styles.form}>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Hourly Rate</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 70"
            keyboardType="numeric"
            value={hourlyRate}
            onChangeText={setHourlyRate}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Mode</Text>
          <View style={styles.modeRow}>
            {(['FULL','PARTIAL'] as const).map(m => (
              <TouchableOpacity key={m} style={[styles.modeChip, mode===m && styles.modeChipActive]} onPress={() => setMode(m)}>
                <Text style={[styles.modeChipTxt, mode===m && styles.modeChipTxtActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.searchBar}>
          <FontAwesomeIcon icon="search" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search nurses"
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <FontAwesomeIcon icon="times" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}> 
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading nurses…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.nurseItem, selectedUserId===item.id && styles.nurseItemActive]} onPress={() => setSelectedUserId(item.id)}>
              <View style={styles.avatar}><Text style={styles.avatarTxt}>{(item.firstName || item.lastName || 'N').charAt(0)}</Text></View>
              <View style={styles.nurseBody}>
                <Text style={styles.nurseName}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.nurseSub}>{item.email}</Text>
              </View>
              {selectedUserId === item.id ? (
                <FontAwesomeIcon icon="check-circle" size={18} color={Colors.primary} />
              ) : (
                <FontAwesomeIcon icon="circle" size={18} color={Colors.borderLight} />
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.primaryBtn, (!selectedUserId || submitting) && { opacity: 0.6 }]} onPress={submit} disabled={!selectedUserId || submitting}>
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.primaryBtnTxt}>Assign</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  form: { paddingHorizontal: 16, paddingTop: 8 },
  inputRow: { marginBottom: 10 },
  label: { color: Colors.textPrimary, fontFamily: Typography.fontFamily.medium, marginBottom: 6 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: Colors.borderLight, paddingHorizontal: 12, backgroundColor: Colors.white, color: Colors.textPrimary },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.background },
  modeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeChipTxt: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary },
  modeChipTxtActive: { color: Colors.white },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.borderLight, minHeight: 44 },
  searchInput: { flex: 1, marginLeft: 8, color: Colors.textPrimary, fontFamily: Typography.fontFamily.regular },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: Colors.textSecondary, fontFamily: Typography.fontFamily.medium },
  list: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 100 },
  nurseItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderLight, padding: 12, marginBottom: 8 },
  nurseItemActive: { borderColor: Colors.primary },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTxt: { color: '#4F46E5', fontFamily: Typography.fontFamily.bold },
  nurseBody: { flex: 1 },
  nurseName: { color: Colors.textPrimary, fontFamily: Typography.fontFamily.bold },
  nurseSub: { color: Colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: 12 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: Colors.background },
  primaryBtn: { height: 48, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryBtnTxt: { color: Colors.white, fontFamily: Typography.fontFamily.bold },
});

export default AgencyAssignNurseScreen;


