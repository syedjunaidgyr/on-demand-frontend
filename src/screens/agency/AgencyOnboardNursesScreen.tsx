import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../../navigation/AppNavigator';
import ApiService from '../../services/api';
import { Typography } from '../../constants/typography';
import { FontAwesomeIcon } from '../../utils/icons';

const AgencyOnboardNursesScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const load = async () => {
    try {
      setLoading(true);
      const agencyId = user?.id;
      const res = agencyId ? await ApiService.getAgencyAvailableNurses(agencyId) : { availableNurses: [] };
      setUsers(res.availableNurses || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggle = (id: number) => {
    setSelected(prev => ({ ...prev, [String(id)]: !prev[String(id)] }));
  };

  const submit = async () => {
    const ids = Object.keys(selected).filter(k => selected[k]).map(k => Number(k));
    if (!ids.length) return;
    const agencyId = user?.id;
    if (!agencyId) return;
    await ApiService.addNursesToAgency(agencyId, ids);
    // Reset selection and refresh available list
    setSelected({});
    await load();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading users…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" colors={["#6366F1"]} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Onboard Nurses</Text>

        <View style={styles.list}>
          {users.length === 0 ? (
            <View style={styles.empty}> 
              <FontAwesomeIcon icon="users" size={20} color="#9CA3AF" />
              <Text style={styles.emptyText}>No nurses available</Text>
            </View>
          ) : (
            users.map((u: any) => {
              const isSelected = !!selected[String(u.id)];
              return (
                <TouchableOpacity key={u.id} style={styles.item} onPress={() => toggle(u.id)} activeOpacity={0.8}>
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected && <FontAwesomeIcon icon="check" size={12} color="#FFFFFF" />}
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={styles.name}>{u.firstName} {u.lastName}</Text>
                    <Text style={styles.sub}>{u.email}</Text>
                  </View>
                  <View style={styles.roleBadge}><Text style={styles.roleTxt}>{u.role}</Text></View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={submit} activeOpacity={0.9}>
          <Text style={styles.primaryBtnTxt}>Add to Agency</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F9FF' },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 20, fontFamily: Typography.fontFamily.bold, color: '#111827', marginBottom: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#6B7280', fontFamily: Typography.fontFamily.medium },
  list: { marginTop: 4, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  empty: { alignItems: 'center', padding: 24, gap: 8 },
  emptyText: { color: '#6B7280', fontFamily: Typography.fontFamily.medium },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#9CA3AF', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  checkboxChecked: { backgroundColor: '#111827', borderColor: '#111827' },
  itemBody: { flex: 1, marginLeft: 12 },
  name: { fontFamily: Typography.fontFamily.medium, color: '#111827' },
  sub: { fontSize: 12, color: '#6B7280' },
  roleBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roleTxt: { color: '#4F46E5', fontFamily: Typography.fontFamily.bold, fontSize: 10 },
  primaryBtn: { marginTop: 16, backgroundColor: '#111827', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnTxt: { color: '#FFFFFF', fontFamily: Typography.fontFamily.bold },
});

export default AgencyOnboardNursesScreen;


