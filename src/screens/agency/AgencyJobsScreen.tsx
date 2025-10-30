import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import ApiService from '../../services/api';
import { Typography } from '../../constants/typography';
import { FontAwesomeIcon } from '../../utils/icons';

const AgencyJobsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getAgencyJobs({ limit: 50 });
      setJobs(res.jobs || []);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading jobs…</Text>
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
        <Text style={styles.title}>Jobs</Text>

        <View style={styles.list}>
          {jobs.length === 0 ? (
            <View style={styles.empty}> 
              <FontAwesomeIcon icon="briefcase" size={24} color="#9CA3AF" />
              <Text style={styles.emptyText}>No jobs available</Text>
            </View>
          ) : (
            jobs.map((job: any) => (
              <View key={job.id} style={styles.item}>
                <View style={styles.iconWrap}><FontAwesomeIcon icon="briefcase" size={16} color="#2563EB" /></View>
                <View style={styles.itemBody}>
                  <Text style={styles.name} numberOfLines={1}>{job.title}</Text>
                  <Text style={styles.sub} numberOfLines={1}>{job.department} · {job.location}</Text>
                </View>
                <View style={styles.badge}><Text style={styles.badgeTxt}>₹{job.hourlyRate}/hr</Text></View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F9FF' },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontFamily: Typography.fontFamily.bold, color: '#111827', marginBottom: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#6B7280', fontFamily: Typography.fontFamily.medium },
  list: { marginTop: 4, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  empty: { alignItems: 'center', padding: 24, gap: 8 },
  emptyText: { color: '#6B7280', fontFamily: Typography.fontFamily.medium },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  itemBody: { flex: 1, marginLeft: 12 },
  name: { fontFamily: Typography.fontFamily.medium, color: '#111827' },
  sub: { fontSize: 12, color: '#6B7280' },
  badge: { backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeTxt: { color: '#FFFFFF', fontFamily: Typography.fontFamily.medium },
});

export default AgencyJobsScreen;


