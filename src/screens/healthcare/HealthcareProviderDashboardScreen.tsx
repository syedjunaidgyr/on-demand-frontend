import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import LinearGradient from 'react-native-linear-gradient';
import GlobalHeader from '../../components/GlobalHeader';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { Job, JobAssignment, User } from '../../types';
import ApiService from '../../services/api';

const HealthcareProviderDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<Job[]>([]);
  const [myAssignments, setMyAssignments] = useState<JobAssignment[]>([]);
  const [workStatus, setWorkStatus] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load user profile first to determine role
      const userData = await ApiService.getProfile();
      setUser(userData);

      // Load role-specific data with individual error handling
      let availableData = null;
      let upcomingData = null;
      let assignmentsData = null;
      let statusData = null;

      try {
        availableData = userData.role === 'DOCTOR' 
          ? await ApiService.getAvailableJobs()
          : await ApiService.getNurseAvailableJobs();
        console.log('✅ Available jobs loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load available jobs:', error);
      }

      try {
        upcomingData = userData.role === 'DOCTOR' 
          ? await ApiService.getUpcomingJobs()
          : await ApiService.getNurseUpcomingJobs();
        console.log('✅ Upcoming jobs loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load upcoming jobs:', error);
      }

      try {
        assignmentsData = userData.role === 'DOCTOR'
          ? await ApiService.getMyAssignments({ limit: 5 })
          : await ApiService.getNurseAssignments({ limit: 5 });
        console.log('✅ Assignments loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load assignments:', error);
      }

      try {
        statusData = userData.role === 'DOCTOR'
          ? await ApiService.getMyWorkStatus()
          : await ApiService.getNurseWorkStatus();
        console.log('✅ Work status loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load work status:', error);
      }

      setAvailableJobs(availableData?.data || []);
      console.log('✅ Available jobs loaded successfully:', availableData);
      setUpcomingJobs(upcomingData || []);
      console.log('✅ Upcoming jobs loaded successfully:', upcomingData);
      setMyAssignments(assignmentsData?.data || []);
      console.log('✅ Assignments loaded successfully:', assignmentsData);
      setWorkStatus(statusData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setAvailableJobs([]);
      setUpcomingJobs([]);
      setMyAssignments([]);
      setWorkStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRoleConfig = () => {
    if (!user) return { color: Colors.primary, title: 'Dashboard', subtitle: 'Manage your assignments' };
    
    switch (user.role) {
      case 'DOCTOR':
        return {
          color: Colors.primary,
          title: 'Doctor Dashboard',
          subtitle: 'Manage your medical assignments',
          icon: 'user-md'
        };
      case 'NURSE':
        return {
          color: Colors.primary,
          title: 'Nurse Dashboard',
          subtitle: 'Manage your nursing assignments',
          icon: 'stethoscope'
        };
      default:
        return {
          color: Colors.primary,
          title: 'Healthcare Dashboard',
          subtitle: 'Manage your assignments',
          icon: 'user'
        };
    }
  };

  // ✨ NEW: Horizontal Quick Action Component
  const QuickActionHorizontal = ({ icon, title, subtitle, onPress, gradient }: any) => (
    <View style={styles.quickActionShadowContainer}>
      <TouchableOpacity onPress={onPress} activeOpacity={1}>
        <LinearGradient
          colors={gradient}
          style={styles.quickActionHorizontal}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <View style={styles.quickActionContent}>
            <View style={styles.quickActionHorizontalIcon}>
              <FontAwesomeIcon icon={icon} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.quickActionTextContainer}>
              <Text style={styles.quickActionHorizontalTitle}>{title}</Text>
              <Text style={styles.quickActionHorizontalSubtitle}>{subtitle}</Text>
            </View>
          </View>
          <View style={styles.quickActionArrow}>
            <FontAwesomeIcon icon="arrow-right" size={14} color="rgba(255, 255, 255, 0.7)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const JobCard = ({ job }: { job: Job }) => {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'URGENT':
          return Colors.error;
        case 'HIGH':
          return Colors.warning;
        case 'MEDIUM':
          return Colors.info;
        case 'LOW':
          return Colors.success;
        default:
          return Colors.success;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'ACTIVE':
          return Colors.primary;
        case 'FILLED':
          return Colors.textTertiary;
        case 'CANCELLED':
          return Colors.error;
        default:
          return Colors.success;
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'ACTIVE':
          return 'Available';
        case 'FILLED':
          return 'Filled';
        case 'CANCELLED':
          return 'Cancelled';
        default:
          return 'Available';
      }
    };

    const handleJobPress = () => {
      (navigation as any).navigate('JobDetails', { jobId: job.id });
    };

    return (
      <TouchableOpacity style={styles.jobCard} activeOpacity={0.9} onPress={handleJobPress}>
        <View style={styles.jobCardInner}>
          <View style={styles.jobHeader}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <View style={styles.jobHeaderRight}>
              {job.priority === 'URGENT' && (
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
                  <Text style={styles.priorityText}>{job.priority}</Text>
                </View>
              )}
              <View style={[styles.jobStatus, { backgroundColor: getStatusColor(job.status) }]}>
                <Text style={styles.jobStatusText}>{getStatusText(job.status)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.jobDetails}>
            <View style={styles.jobDetail}>
              <View style={styles.jobDetailIcon}>
                <FontAwesomeIcon icon="map-marker-alt" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.jobDetailText}>{job.location}</Text>
            </View>
            <View style={styles.jobDetail}>
              <View style={styles.jobDetailIcon}>
                <FontAwesomeIcon icon="clock" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.jobDetailText}>
                {formatDate(job.startDate)} at {formatTime(job.startTime)}
              </Text>
            </View>
            <View style={styles.jobDetail}>
              <View style={styles.jobDetailIcon}>
                <FontAwesomeIcon icon="building" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.jobDetailText}>{job.department}</Text>
            </View>
            {job.specialization && (
              <View style={styles.jobDetail}>
                <View style={styles.jobDetailIcon}>
                  <FontAwesomeIcon icon="stethoscope" size={14} color={Colors.primary} />
                </View>
                <Text style={styles.jobDetailText}>{job.specialization}</Text>
              </View>
            )}
          </View>
          <View style={styles.jobCardFooter}>
            <View style={styles.jobPayRate}>
              <Text style={styles.jobPayRateText}>₹ {job.hourlyRate}/hour</Text>
            </View>
            <View style={styles.jobFooterRight}>
              <Text style={styles.jobDuration}>
                {formatTime(job.startTime)} - {formatTime(job.endTime)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const AssignmentCard = ({ assignment }: { assignment: JobAssignment }) => {
    const getAssignmentStatusColor = (status: string) => {
      switch (status) {
        case 'ACCEPTED':
          return Colors.primary;
        case 'PENDING':
          return Colors.warning;
        case 'COMPLETED':
          return Colors.info;
        case 'CANCELLED':
          return Colors.error;
        case 'REJECTED':
          return Colors.textTertiary;
        default:
          return Colors.info;
      }
    };

    const getAssignmentStatusText = (status: string) => {
      switch (status) {
        case 'ACCEPTED':
          return 'Active';
        case 'PENDING':
          return 'Pending';
        case 'COMPLETED':
          return 'Completed';
        case 'CANCELLED':
          return 'Cancelled';
        case 'REJECTED':
          return 'Rejected';
        default:
          return 'Active';
      }
    };

    const handleAssignmentPress = () => {
      (navigation as any).navigate('CheckInOut', { assignmentId: assignment.id });
    };

    return (
      <TouchableOpacity style={styles.assignmentCard} activeOpacity={0.9} onPress={handleAssignmentPress}>
        <View style={styles.assignmentCardInner}>
          <View style={styles.assignmentHeader}>
            <Text style={styles.assignmentTitle}>{assignment.job?.title || 'Unknown Job'}</Text>
            <View style={[styles.assignmentStatus, { backgroundColor: getAssignmentStatusColor(assignment.status) }]}>
              <Text style={styles.assignmentStatusText}>{getAssignmentStatusText(assignment.status)}</Text>
            </View>
          </View>
          <View style={styles.assignmentDetails}>
            <View style={styles.assignmentDetail}>
              <View style={styles.assignmentDetailIcon}>
                <FontAwesomeIcon icon="map-marker-alt" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.assignmentDetailText}>{assignment.job?.location || 'Unknown Location'}</Text>
            </View>
            <View style={styles.assignmentDetail}>
              <View style={styles.assignmentDetailIcon}>
                <FontAwesomeIcon icon="clock" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.assignmentDetailText}>
                {assignment.job ? `${formatDate(assignment.job.startDate)} at ${formatTime(assignment.job.startTime)}` : 'Date not available'}
              </Text>
            </View>
            <View style={styles.assignmentDetail}>
              <View style={styles.assignmentDetailIcon}>
                <FontAwesomeIcon icon="rupee-sign" size={14} color={Colors.success} />
              </View>
              <Text style={styles.assignmentDetailText}>{assignment.hourlyRate || assignment.job?.hourlyRate || 0}/hour</Text>
            </View>
          </View>
          <View style={styles.assignmentCardFooter}>
            <View style={styles.assignmentProgress}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: assignment.status === 'COMPLETED' ? '100%' : '75%' }]} />
              </View>
              <Text style={styles.progressText}>
                {assignment.status === 'COMPLETED' ? '100% Complete' : '75% Complete'}
              </Text>
            </View>
            {assignment.status === 'ACCEPTED' && (
              <View style={styles.assignmentAction}>
                <FontAwesomeIcon icon="check-circle" size={16} color={Colors.primary} />
                <Text style={styles.assignmentActionText}>Check In/Out</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const roleConfig = getRoleConfig();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.combinedCard}>
          {/* Profile Section */}
          <TouchableOpacity 
            style={styles.profileSection}
            onPress={() => navigation.navigate('Profile' as never)}
            activeOpacity={0.7}>
            <View style={styles.profileInfo}>
              <View style={styles.profileImageContainer}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.profileImage}>
                  <Text style={styles.profileInitials}>
                    {user ? 
                      (user.firstName || user.lastName || 'U').charAt(0).toUpperCase()
                      : 'U'
                    }
                  </Text>
                </LinearGradient>
              </View>
              <View style={styles.profileText}>
                <Text style={styles.profileName}>
                  {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Loading...'}
                </Text>
                <Text style={styles.profileRole}>
                  {user?.role || 'Healthcare Provider'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <FontAwesomeIcon icon="bell" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Main Title */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>{roleConfig.title}</Text>
            <Text style={styles.mainSubtitle}>
              {user?.role === 'DOCTOR' ? 'Manage your medical assignments and patient care' : 'Manage your nursing assignments and patient care'}
            </Text>
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollableContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }>

        {/* ✨ NEW: Horizontal Quick Actions */}
        <View style={[styles.section, styles.firstSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
            decelerationRate="fast"
            snapToInterval={182}
            snapToAlignment="start">
            <QuickActionHorizontal
              icon="briefcase"
              title="Job Assignments"
              subtitle={`${availableJobs.length} Available`}
              onPress={() => navigation.navigate('Assignments' as never)}
              gradient={['#6366F1', '#4F46E5']}
            />
            <QuickActionHorizontal
              icon="calendar-check"
              title="My Jobs"
              subtitle={`${myAssignments.length} Active`}
              onPress={() => navigation.navigate('MyAssignments' as never)}
              gradient={['#10B981', '#059669']}
            />
            <QuickActionHorizontal
              icon="clock"
              title="Check In/Out"
              subtitle="Track Time"
              onPress={() => (navigation as any).navigate('CheckInOut')}
              gradient={['#F59E0B', '#D97706']}
            />
            <QuickActionHorizontal
              icon="chart-line"
              title="Reports"
              subtitle="View Stats"
              onPress={() => navigation.navigate('Reports' as never)}
              gradient={['#8B5CF6', '#7C3AED']}
            />
            <QuickActionHorizontal
              icon="user-md"
              title="Profile"
              subtitle="Settings"
              onPress={() => navigation.navigate('Profile' as never)}
              gradient={['#EC4899', '#DB2777']}
            />
          </ScrollView>
        </View>

        {/* Available Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Job Assignments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Assignments' as never)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {availableJobs && availableJobs.length > 0 ? (
            availableJobs.slice(0, 3).map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesomeIcon icon="briefcase" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyStateText}>No available jobs at the moment</Text>
            </View>
          )}
        </View>

        {/* My Assignments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Assignments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyAssignments' as never)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {myAssignments && myAssignments.length > 0 ? (
            myAssignments.slice(0, 3).map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesomeIcon icon="calendar" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyStateText}>No current assignments</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  scrollableContent: {
    flex: 1,
    marginTop: 200,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  combinedCard: {
    backgroundColor: '#1C2A3A',
    paddingTop: 35,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginTop: 4,
  },
  firstSection: {
    marginTop: -20,
  },
  header: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.white,
    opacity: 0.9,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    textAlignVertical: 'center',
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  seeAllText: {
    fontSize: Typography.fontSize.sm,
    backgroundColor: Colors.primary,
    color: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    fontWeight: Typography.fontWeight.medium,
  },

  // ✨ NEW: Horizontal Quick Actions Styles
  quickActionsScroll: {
    paddingHorizontal: 1,
    paddingVertical: 2,
    paddingRight: 20,
  },
  quickActionShadowContainer: {
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  quickActionHorizontal: {
    width: 170,
    height: 190,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    position: 'relative',
  },
  quickActionContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  quickActionTextContainer: {
    marginTop: 12,
  },
  quickActionHorizontalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  quickActionHorizontalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  quickActionHorizontalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.2,
  },
  quickActionArrow: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    marginHorizontal: 0,
    marginVertical: 4,
  },
  jobCardInner: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    margin: 4,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  jobHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  jobTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    textAlignVertical: 'center',
    lineHeight: 24,
  },
  jobStatus: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobStatusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priorityText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  jobDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  jobDetails: {
    marginBottom: Spacing.lg,
  },
  jobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    minHeight: 24,
  },
  jobDetailIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  jobDetailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  jobCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobPayRate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    flex: 1,
    marginRight: Spacing.sm,
  },
  jobFooterRight: {
    alignItems: 'flex-end',
  },
  jobDuration: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  jobPayRateText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginLeft: Spacing.xs,
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  assignmentCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    marginHorizontal: 0,
    marginVertical: 4,
  },
  assignmentCardInner: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    margin: 4,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  assignmentTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    textAlignVertical: 'center',
    lineHeight: 24,
  },
  assignmentStatus: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignmentStatusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  assignmentDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  assignmentDetails: {
    marginBottom: Spacing.lg,
  },
  assignmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    minHeight: 24,
  },
  assignmentDetailIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  assignmentDetailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  assignmentCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentProgress: {
    alignItems: 'center',
    flex: 1,
  },
  assignmentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    marginLeft: Spacing.sm,
  },
  assignmentActionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.xs,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    textAlignVertical: 'center',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

export default HealthcareProviderDashboardScreen;