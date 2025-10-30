import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import LinearGradient from 'react-native-linear-gradient';
import GlobalHeader from '../../components/GlobalHeader';
import HRFooterNavigation from '../../components/HRFooterNavigation';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { Job } from '../../types';
import ApiService from '../../services/api';
import Responsive from '../../utils/responsive';

const HRJobsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  
  // Add scroll position tracking for footer transparency
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async (pageNum = 1, refresh = false) => {
    try {
      console.log('🔧 Loading HR jobs...');
      const response = await ApiService.getAllJobs({
        page: pageNum,
        limit: 10,
      });

      console.log('📦 HR Jobs response:', response);

      // Handle different response formats
      const jobsData = response.jobs || response.data || [];
      const pagination = response.pagination || response;

      console.log('📋 Jobs data:', jobsData);
      console.log('📊 Jobs count:', jobsData.length);

      if (refresh || pageNum === 1) {
        setJobs(jobsData);
      } else {
        setJobs(prev => [...prev, ...jobsData]);
      }

      setHasMore(pagination.page < pagination.pages);
    } catch (error) {
      console.error('❌ Failed to load jobs:', error);
      Alert.alert('Error', 'Failed to load jobs. Please try again.');
      if (refresh || pageNum === 1) {
        setJobs([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadJobs(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadJobs(nextPage);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return Colors.urgent;
      case 'HIGH':
        return Colors.high;
      case 'MEDIUM':
        return Colors.medium;
      case 'LOW':
        return Colors.low;
      default:
        return Colors.primary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return Colors.success;
      case 'CANCELLED':
        return Colors.error;
      case 'COMPLETED':
        return Colors.info;
      case 'FILLED':
        return Colors.warning;
      default:
        return Colors.textTertiary;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) return '—';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    if (isNaN(hour)) return '—';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const mins = (minutes ?? '00').slice(0, 2);
    return `${displayHour}:${mins} ${ampm}`;
  };

  const handleJobPress = async (job: Job) => {
    try {
      const allAssignmentsResponse = await ApiService.getJobAssignments(job.id.toString());
      const allAssignments = allAssignmentsResponse.assignments || allAssignmentsResponse.data || allAssignmentsResponse || [];
      const acceptedAssignments = allAssignments.filter((assignment: any) => assignment.status === 'ACCEPTED');
      (navigation as any).navigate('JobAssignment', { 
        jobId: job.id, 
        acceptedAssignments: acceptedAssignments 
      });
    } catch (error) {
      console.error('❌ Failed to open assignment selector:', error);
      Alert.alert('Error', 'Failed to open candidate selection. Please try again.');
    }
  };

  const handleCreateJob = () => {
    (navigation as any).navigate('CreateJob');
  };

  const handleAssignJobToStaff = async (job: Job) => {
    try {
      console.log('🔍 Assigning job to staff:', job.id, job.title);
      // Navigate to staff selection screen or show staff list
      // For now, let's show an alert with instructions
      Alert.alert(
        'Assign Job to Staff',
        `To assign "${job.title}" to staff members:\n\n1. Go to Staff Management\n2. Select compatible staff\n3. Send them job assignments\n4. Wait for them to accept\n5. Then review candidates here`,
        [
          { text: 'OK' },
          { 
            text: 'Go to Staff', 
            onPress: () => {
              // Navigate to staff management screen
              console.log('Navigate to staff management');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Failed to assign job to staff:', error);
      Alert.alert('Error', `Failed to assign job: ${error.message}`);
    }
  };

  const handleReviewCandidates = async (job: Job) => {
    try {
      console.log('🔍 HR reviewing candidates for job:', job.id, job.title);
      console.log('📊 Job assignments count:', job.assignments?.length || 0);
      console.log('📊 Job assignments:', job.assignments);
      
      // Get ALL assignments for this job and filter for accepted ones
      console.log('🔍 Getting ALL assignments for job:', job.id);
      const allAssignmentsResponse = await ApiService.getJobAssignments(job.id.toString());
      console.log('📦 All assignments response:', allAssignmentsResponse);
      
      // Filter for accepted assignments
      const allAssignments = allAssignmentsResponse.assignments || allAssignmentsResponse.data || allAssignmentsResponse || [];
      console.log('📋 All assignments array:', allAssignments);
      
      const acceptedAssignments = allAssignments.filter((assignment: any) => assignment.status === 'ACCEPTED');
      console.log('📋 Filtered accepted assignments:', acceptedAssignments);
      console.log('📋 Accepted assignments count:', acceptedAssignments?.length || 0);
      
      if (!acceptedAssignments || acceptedAssignments.length === 0) {
        Alert.alert(
          'No Accepted Candidates', 
          `No staff members have accepted this job yet.\n\nCurrent assignments:\n${allAssignments.map((a: any) => `- ${a.user?.firstName || 'Unknown'} ${a.user?.lastName || ''}: ${a.status}`).join('\n')}\n\nYou need staff to accept assignments first.`,
          [
            { text: 'OK' },
            { 
              text: 'Assign Job to Staff', 
              onPress: () => {
                console.log('Navigate to assign job to staff');
              }
            }
          ]
        );
        return;
      }
      
      (navigation as any).navigate('JobAssignment', { 
        jobId: job.id, 
        acceptedAssignments: acceptedAssignments 
      });
    } catch (error) {
      console.error('❌ Failed to load accepted assignments:', error);
      console.error('❌ Job details:', job);
      Alert.alert('Error', `Failed to load accepted assignments: ${error.message}`);
    }
  };

  const JobCard = ({ job }: { job: Job }) => {
    const currentAssignments = job.assignments?.length || 0;
    const pendingAssignments = job.assignments?.filter(a => a.status === 'PENDING').length || 0;
    const acceptedAssignments = job.assignments?.filter(a => a.status === 'ACCEPTED').length || 0;
    const assignedAssignments = job.assignments?.filter(a => a.status === 'ASSIGNED').length || 0;

    const initials = (job.title || 'J').trim().slice(0, 2).toUpperCase();
    const timeRange = `${formatTime(job.startTime)} - ${formatTime(job.endTime)}`;
    const dateRange = `${formatDate(job.startDate)} - ${formatDate(job.endDate)}`;
    const subtitleLeft = job.location || '—';
    const subtitleRight = timeRange;
    
    return (
      <TouchableOpacity style={styles.jobCard} onPress={() => handleJobPress(job)}>
        {/* Date header with edit button */}
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTimeText}>{dateRange}</Text>
          <TouchableOpacity style={styles.editTopButton} onPress={() => handleJobPress(job)}>
            <FontAwesomeIcon icon="edit" size={Responsive.iconSize(16)} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.cardDivider} />

        {/* Profile row */}
        <View style={styles.profileRow}>
          <View style={styles.profileContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{job.title}</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitleText} numberOfLines={1}>{subtitleLeft}</Text>
              <Text style={styles.subtitleDot}> • </Text>
              <Text style={styles.subtitleText} numberOfLines={1}>{subtitleRight}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: getStatusColor(job.status) + '33' }]}> 
              <Text style={[styles.statusPillText, { color: getStatusColor(job.status) }]}>{job.status}</Text>
            </View>

            {/* Assignments + Priority row */}
            <View style={styles.assignmentRow}>
              <Text style={styles.assignmentText}>Accepted: {acceptedAssignments}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}> 
                <Text style={styles.priorityText}>{job.priority}</Text>
              </View>
            </View>

            <Text style={styles.cardRateText}>₹{job.hourlyRate}/hr</Text>
          </View>
        </View>

        
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  if (isLoading && jobs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <GlobalHeader 
        title="Job Management"
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16 }}
        // rightComponent={
        //   <TouchableOpacity style={[styles.createButton, { backgroundColor: '#111827' }]} onPress={handleCreateJob}>
        //     <FontAwesomeIcon icon="plus" size={Responsive.iconSize(24)} color={Colors.white} />
        //   </TouchableOpacity>
        // }
      />

      {/* Jobs List */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateJob}>
        <FontAwesomeIcon icon="plus" size={24} color={Colors.white}  />
      </TouchableOpacity>
      
      <HRFooterNavigation activeRoute="Jobs" scrollY={scrollY} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  header: {
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -20,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.white,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
  createButton: {
    width: Responsive.scale(40),
    height: Responsive.verticalScale(40),
    borderRadius: Responsive.scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: Responsive.scale(Spacing.md),
    paddingTop: Responsive.verticalScale(Spacing.sm),
    paddingBottom: Responsive.verticalScale(80),
  },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTimeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editTopButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarInitials: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: '#4C1D95',
  },
  profileContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
    flexShrink: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'nowrap',
  },
  subtitleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    flexShrink: 1,
    maxWidth: '45%',
  },
  subtitleDot: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginHorizontal: 6,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'capitalize',
  },
  cardRateText: {
    marginTop: 6,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  // removed action buttons styles
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  jobTitleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  jobTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  jobRate: {
    alignItems: 'flex-end',
  },
  rateAmount: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  rateLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  jobDetails: {
    marginBottom: Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  jobDetailCol: {
    width: '48%',
  },
  jobDetailFull: {
    width: '100%',
  },
  jobDetailText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  // footer removed
  assignmentText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },
  pendingText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.warning,
  },
  acceptedText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.success,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // removed action button variants
  fab: {
    position: 'absolute',
    bottom: Responsive.verticalScale(Spacing['2xl']),
    right: Responsive.scale(Spacing.lg),
    width: Responsive.scale(56),
    height: Responsive.verticalScale(56),
    borderRadius: Responsive.scale(28),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.lg,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});

export default HRJobsScreen;
