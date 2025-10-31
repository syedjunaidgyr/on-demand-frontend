import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAppColors } from '../../hooks/useAppColors';
import HospitalAdminApi from '../../services/hospitalAdminApi';

const PAGE_SIZE = 50;

const HospitalAdminJobsScreen: React.FC = () => {
  const appColors = useAppColors();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  const load = async (nextPage: number, replace = false) => {
    try {
      if (replace) setIsLoading(true);
      // Backend supports optional filter params (documented), pass search if supported in API
      const res = await HospitalAdminApi.getJobs({ page: nextPage, limit: PAGE_SIZE, ...(search ? { search } : {}) } as any);
      const newJobs = Array.isArray(res) ? res : (res.jobs || []);
      setJobs(replace ? newJobs : [...jobs, ...newJobs]);
      const total = res?.pagination?.total;
      const totalPages = res?.pagination?.totalPages;
      if (totalPages) setHasMore(nextPage < totalPages);
      else setHasMore(newJobs.length === PAGE_SIZE);
      setPage(nextPage);
    } catch (e) {
      if (replace) setJobs([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(1, true);
  }, [search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1, true);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!hasMore || isLoading) return;
    await load(page + 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: appColors.background }] }>
      <Text style={[styles.title, { color: appColors.textPrimary }]}>Hospital Admin Jobs</Text>
      <View style={styles.filtersRow}>
        <TextInput
          placeholder="Search job title or department"
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>
      {isLoading && jobs.length === 0 ? (
        <Text style={styles.subtitle}>Loading...</Text>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReachedThreshold={0.5}
          onEndReached={loadMore}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.listTitle}>{item.title || 'Untitled Job'}</Text>
              <Text style={styles.listSubtitle}>{item.department || item.location || ''}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.subtitle}>No jobs found</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  listItem: {
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  listSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});

export default HospitalAdminJobsScreen;


