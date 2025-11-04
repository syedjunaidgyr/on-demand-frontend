import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAppColors } from '../../hooks/useAppColors';
import HospitalAdminApi from '../../services/hospitalAdminApi';
import { usePermissions } from '../../hooks/usePermissions';
import { FontAwesomeIcon } from '../../utils/icons';

const PAGE_SIZE = 50;

const HospitalAdminJobsScreen: React.FC = () => {
  const appColors = useAppColors();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  const load = async (nextPage: number, replace = false) => {
    try {
      if (replace) setIsLoading(true);
      console.log('[HA Jobs] Loading jobs, page:', nextPage, 'search:', search);
      
      // Backend supports optional filter params (documented), pass search if supported in API
      const res = await HospitalAdminApi.getJobs({ page: nextPage, limit: PAGE_SIZE, ...(search ? { search } : {}) } as any);
      console.log('[HA Jobs] response:', res);
      
      // Handle different response formats
      const newJobs = Array.isArray(res) ? res : (res?.jobs || res?.data || []);
      console.log('[HA Jobs] parsed:', newJobs.length, 'pagination:', res?.pagination);
      
      setJobs(replace ? newJobs : [...jobs, ...newJobs]);
      
      // Handle pagination - check both totalPages and pages
      const pagination = res?.pagination || {};
      const total = pagination.total || 0;
      const totalPages = pagination.totalPages || pagination.pages || 0;
      
      console.log('[HospitalAdminJobsScreen] Pagination:', { total, totalPages, currentPage: nextPage });
      
      if (totalPages > 0) {
        setHasMore(nextPage < totalPages);
      } else {
        setHasMore(newJobs.length === PAGE_SIZE);
      }
      setPage(nextPage);
    } catch (e: any) {
      console.error('[HospitalAdminJobsScreen] Error loading jobs:', e);
      console.error('[HospitalAdminJobsScreen] Error details:', {
        message: e?.message,
        response: e?.response?.data,
        status: e?.response?.status
      });
      
      if (replace) setJobs([]);
      setHasMore(false);
      
      // Show error to user
      Alert.alert(
        'Error Loading Jobs',
        e?.response?.data?.message || e?.message || 'Failed to load jobs. Please try again.',
        [{ text: 'OK' }]
      );
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

      {/* Floating Action Button - Only show if user has JOB_CREATE permission */}
      {!permissionsLoading && hasPermission('JOB_CREATE') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            // Guard again before navigating
            if (!hasPermission('JOB_CREATE')) {
              Alert.alert('Access Denied', 'You do not have permission to create jobs.', [{ text: 'OK' }]);
              return;
            }
            // Navigate to the Create Job screen (shared)
            // @ts-ignore
            (require('@react-navigation/native').useNavigation() as any).navigate('CreateJob');
          }}
          activeOpacity={0.8}
        >
          <FontAwesomeIcon icon="plus" size={20} color={Colors.white} />
        </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default HospitalAdminJobsScreen;


