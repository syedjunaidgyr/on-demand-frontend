import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../../navigation/AppNavigator';
import ApiService from '../../services/api';
import { Typography } from '../../constants/typography';
import { FontAwesomeIcon } from '../../utils/icons';

const AgencyNursesScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [poolCounts, setPoolCounts] = useState({ approved: 0, pending: 0, revoked: 0 });
  const [nurses, setNurses] = useState<any[]>([]);
  const [pool, setPool] = useState<any[]>([]);
  const [agencyId, setAgencyId] = useState<string | number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      // Ensure we have an agencyId; fetch profile if needed
      let idToUse: string | number | null = agencyId || user?.id || null;
      if (!idToUse) {
        try {
          const profile = await ApiService.getProfile();
          idToUse = profile?.id;
          setAgencyId(idToUse as any);
        } catch {}
      }

      if (!idToUse) {
        setNurses([]);
        setPool([]);
        setPoolCounts({ approved: 0, pending: 0, revoked: 0 });
        return;
      }

      const res = await ApiService.getAgencyNurses(idToUse);
      setNurses(res.nurses || []);
      setPool(res.pool || []);
      const counts = { approved: 0, pending: 0, revoked: 0 };
      (res.pool || []).forEach((m: any) => {
        if (m.status === 'APPROVED') counts.approved += 1;
        else if (m.status === 'PENDING') counts.pending += 1;
        else if (m.status === 'REVOKED') counts.revoked += 1;
      });
      setPoolCounts(counts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading nurses…</Text>
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
        <Text style={styles.title}>Nurses</Text>

        <View style={styles.statsRow}>
          <Stat label="Approved" value={poolCounts.approved} icon="user-check" color="#10B981" />
          <Stat label="Pending" value={poolCounts.pending} icon="clock" color="#F59E0B" />
          <Stat label="Revoked" value={poolCounts.revoked} icon="user-times" color="#EF4444" />
        </View>

        {/* Pool memberships (with status) */}
        <Text style={styles.sectionHeader}>Pool</Text>
        <View style={styles.list}>
          {pool.length === 0 ? (
            <View style={styles.empty}> 
              <FontAwesomeIcon icon="users" size={20} color="#9CA3AF" />
              <Text style={styles.emptyText}>No pool members</Text>
            </View>
          ) : (
            pool.map((m: any) => {
              const n = m.nurse || {};
              const status = String(m.status || '').toUpperCase();
              const statusColor = status === 'APPROVED' ? '#10B981' : status === 'PENDING' ? '#F59E0B' : '#EF4444';
              return (
                <View key={`${m.id}-${n.id || 'n'}`} style={styles.item}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{(n.firstName || n.lastName || 'N').charAt(0)}</Text></View>
                  <View style={styles.itemBody}>
                    <Text style={styles.name}>{n.firstName} {n.lastName}</Text>
                    <Text style={styles.sub}>{n.email}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Flat nurses list */}
        <Text style={styles.sectionHeader}>All Nurses</Text>
        <View style={styles.list}>
          {nurses.length === 0 ? (
            <View style={styles.empty}> 
              <FontAwesomeIcon icon="users" size={20} color="#9CA3AF" />
              <Text style={styles.emptyText}>No nurses found</Text>
            </View>
          ) : (
            nurses.map((nurse: any) => (
              <View key={nurse.id} style={styles.item}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{(nurse.firstName || nurse.lastName || 'N').charAt(0)}</Text></View>
                <View style={styles.itemBody}>
                  <Text style={styles.name}>{nurse.firstName} {nurse.lastName}</Text>
                  <Text style={styles.sub}>{nurse.email}</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionTxt}>View</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Stat = ({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: color + '15' }]}> 
      <FontAwesomeIcon icon={icon} size={18} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F9FF' },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontFamily: Typography.fontFamily.bold, color: '#111827', marginBottom: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#6B7280', fontFamily: Typography.fontFamily.medium },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontFamily: Typography.fontFamily.bold, color: '#111827' },
  statLabel: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: '#6B7280' },
  list: { marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionHeader: { marginTop: 16, marginBottom: 8, fontFamily: Typography.fontFamily.bold, color: '#111827' },
  empty: { alignItems: 'center', padding: 24, gap: 8 },
  emptyText: { color: '#6B7280', fontFamily: Typography.fontFamily.medium },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#4F46E5', fontFamily: Typography.fontFamily.bold },
  itemBody: { flex: 1, marginLeft: 12 },
  name: { fontFamily: Typography.fontFamily.medium, color: '#111827' },
  sub: { fontSize: 12, color: '#6B7280' },
  statusBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontFamily: Typography.fontFamily.bold, fontSize: 10 },
  actionBtn: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionTxt: { color: '#FFFFFF', fontFamily: Typography.fontFamily.medium },
});

export default AgencyNursesScreen;


