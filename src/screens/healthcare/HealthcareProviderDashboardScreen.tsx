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
          return '#EF4444';
        case 'HIGH':
          return '#F59E0B';
        case 'MEDIUM':
          return '#3B82F6';
        case 'LOW':
          return '#10B981';
        default:
          return '#10B981';
      }
    };

    const getPriorityGradient = (priority: string) => {
      switch (priority) {
        case 'URGENT':
          return ['#EF4444', '#DC2626'];
        case 'HIGH':
          return ['#F59E0B', '#D97706'];
        case 'MEDIUM':
          return ['#3B82F6', '#2563EB'];
        case 'LOW':
          return ['#10B981', '#059669'];
        default:
          return ['#10B981', '#059669'];
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'ACTIVE':
          return '#10B981';
        case 'FILLED':
          return '#6B7280';
        case 'CANCELLED':
          return '#EF4444';
        default:
          return '#10B981';
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
      <TouchableOpacity 
        style={styles.enhancedJobCard} 
        activeOpacity={0.95} 
        onPress={handleJobPress}>
        <LinearGradient
          colors={['#FFFFFF', '#F9FAFB']}
          style={styles.jobCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}>
          
          {/* Header with Title and Badges */}
          <View style={styles.enhancedJobHeader}>
            <View style={styles.jobTitleContainer}>
              <View style={styles.jobIconContainer}>
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  style={styles.jobIconGradient}>
                  <FontAwesomeIcon icon="briefcase" size={18} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.enhancedJobTitle} numberOfLines={2}>
                {job.title}
              </Text>
            </View>
            
            <View style={styles.badgeContainer}>
              {job.priority === 'URGENT' && (
                <LinearGradient
                  colors={getPriorityGradient(job.priority)}
                  style={styles.priorityBadgeGradient}>
                  <FontAwesomeIcon icon="exclamation-circle" size={10} color="#FFFFFF" />
                  <Text style={styles.priorityTextNew}>{job.priority}</Text>
                </LinearGradient>
              )}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                <View style={styles.statusDotBadge} />
                <Text style={styles.statusBadgeText}>{getStatusText(job.status)}</Text>
              </View>
            </View>
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconWrapper}>
                <FontAwesomeIcon icon="map-marker-alt" size={14} color="#6366F1" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{job.location}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconWrapper}>
                <FontAwesomeIcon icon="calendar" size={14} color="#10B981" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(job.startDate)}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconWrapper}>
                <FontAwesomeIcon icon="clock" size={14} color="#F59E0B" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>
                  {formatTime(job.startTime)} - {formatTime(job.endTime)}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconWrapper}>
                <FontAwesomeIcon icon="building" size={14} color="#8B5CF6" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{job.department}</Text>
              </View>
            </View>
          </View>

          {/* Specialization Tag if exists */}
          {job.specialization && (
            <View style={styles.specializationContainer}>
              <View style={styles.specializationTag}>
                <FontAwesomeIcon icon="stethoscope" size={12} color="#6366F1" />
                <Text style={styles.specializationText}>{job.specialization}</Text>
              </View>
            </View>
          )}

          {/* Footer with Pay Rate and Action */}
          <View style={styles.enhancedJobFooter}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.payRateContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <FontAwesomeIcon icon="rupee-sign" size={16} color="#FFFFFF" />
              <Text style={styles.payRateAmount}>{job.hourlyRate}</Text>
              <Text style={styles.payRatePeriod}>/hour</Text>
            </LinearGradient>
            
            <View style={styles.viewDetailsButton}>
              <Text style={styles.viewDetailsText}>View Details</Text>
              <FontAwesomeIcon icon="arrow-right" size={12} color="#6366F1" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const AssignmentCard = ({ assignment }: { assignment: JobAssignment }) => {
    const getAssignmentStatusColor = (status: string) => {
      switch (status) {
        case 'ACCEPTED':
          return ['#10B981', '#059669'];
        case 'PENDING':
          return ['#F59E0B', '#D97706'];
        case 'COMPLETED':
          return ['#3B82F6', '#2563EB'];
        case 'CANCELLED':
          return ['#EF4444', '#DC2626'];
        case 'REJECTED':
          return ['#6B7280', '#4B5563'];
        default:
          return ['#3B82F6', '#2563EB'];
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

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'ACCEPTED':
          return 'check-circle';
        case 'PENDING':
          return 'clock';
        case 'COMPLETED':
          return 'check';
        case 'CANCELLED':
          return 'times';
        case 'REJECTED':
          return 'ban';
        default:
          return 'check-circle';
      }
    };

    const getProgressPercentage = (status: string) => {
      switch (status) {
        case 'ACCEPTED':
          return 40;
        case 'PENDING':
          return 20;
        case 'COMPLETED':
          return 100;
        case 'CANCELLED':
          return 0;
        case 'REJECTED':
          return 0;
        default:
          return 40;
      }
    };

    const handleAssignmentPress = () => {
      (navigation as any).navigate('CheckInOut', { assignmentId: assignment.id });
    };

    const progress = getProgressPercentage(assignment.status);

    return (
      <TouchableOpacity 
        style={styles.enhancedAssignmentCard} 
        activeOpacity={0.95} 
        onPress={handleAssignmentPress}>
        <LinearGradient
          colors={['#FFFFFF', '#F9FAFB']}
          style={styles.assignmentCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}>
          
          {/* Header */}
          <View style={styles.enhancedAssignmentHeader}>
            <View style={styles.assignmentTitleContainer}>
              <View style={styles.assignmentIconContainer}>
                <LinearGradient
                  colors={getAssignmentStatusColor(assignment.status)}
                  style={styles.assignmentIconGradient}>
                  <FontAwesomeIcon icon={getStatusIcon(assignment.status)} size={18} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.assignmentTitleTextContainer}>
                <Text style={styles.enhancedAssignmentTitle} numberOfLines={2}>
                  {assignment.job?.title || 'Unknown Job'}
                </Text>
                <Text style={styles.assignmentSubtitle}>
                  Assignment #{assignment.id.toString().slice(0, 8)}
                </Text>
              </View>
            </View>
            
            <LinearGradient
              colors={getAssignmentStatusColor(assignment.status)}
              style={styles.assignmentStatusBadge}>
              <Text style={styles.assignmentStatusBadgeText}>
                {getAssignmentStatusText(assignment.status)}
              </Text>
            </LinearGradient>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={getAssignmentStatusColor(assignment.status)}
                  style={[styles.progressBarFill, { width: `${progress}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}>
                  <View style={styles.progressShine} />
                </LinearGradient>
              </View>
            </View>
            <Text style={styles.progressPercentage}>{progress}%</Text>
          </View>

          {/* Info Cards */}
          <View style={styles.assignmentInfoGrid}>
            <View style={styles.assignmentInfoCard}>
              <View style={[styles.assignmentInfoIcon, { backgroundColor: '#EEF2FF' }]}>
                <FontAwesomeIcon icon="map-marker-alt" size={16} color="#6366F1" />
              </View>
              <Text style={styles.assignmentInfoLabel}>Location</Text>
              <Text style={styles.assignmentInfoValue} numberOfLines={1}>
                {assignment.job?.location || 'Unknown Location'}
              </Text>
            </View>

            <View style={styles.assignmentInfoCard}>
              <View style={[styles.assignmentInfoIcon, { backgroundColor: '#F0FDF4' }]}>
                <FontAwesomeIcon icon="calendar-check" size={16} color="#10B981" />
              </View>
              <Text style={styles.assignmentInfoLabel}>Schedule</Text>
              <Text style={styles.assignmentInfoValue} numberOfLines={1}>
                {assignment.job ? formatDate(assignment.job.startDate) : 'N/A'}
              </Text>
            </View>

            <View style={styles.assignmentInfoCard}>
              <View style={[styles.assignmentInfoIcon, { backgroundColor: '#FFF7ED' }]}>
                <FontAwesomeIcon icon="clock" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.assignmentInfoLabel}>Time</Text>
              <Text style={styles.assignmentInfoValue} numberOfLines={1}>
                {assignment.job ? formatTime(assignment.job.startTime) : 'N/A'}
              </Text>
            </View>

            <View style={styles.assignmentInfoCard}>
              <View style={[styles.assignmentInfoIcon, { backgroundColor: '#ECFDF5' }]}>
                <FontAwesomeIcon icon="rupee-sign" size={16} color="#10B981" />
              </View>
              <Text style={styles.assignmentInfoLabel}>Rate</Text>
              <Text style={styles.assignmentInfoValue}>
                ₹{assignment.hourlyRate || assignment.job?.hourlyRate || 0}/hr
              </Text>
            </View>
          </View>

          {/* Footer Action */}
          {assignment.status === 'ACCEPTED' && (
            <View style={styles.assignmentFooterAction}>
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                style={styles.checkInButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <FontAwesomeIcon icon="fingerprint" size={16} color="#FFFFFF" />
                <Text style={styles.checkInButtonText}>Check In / Check Out</Text>
                <FontAwesomeIcon icon="arrow-right" size={14} color="#FFFFFF" />
              </LinearGradient>
            </View>
          )}
        </LinearGradient>
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
    marginTop: -10,
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
    marginTop: 1,
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

  // Enhanced Job Card Styles
  enhancedJobCard: {
    marginBottom: 16,
    marginHorizontal: 2,
    shadowColor: '#1C2A3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderRadius: 24,
    overflow: 'hidden',
  },
  jobCardGradient: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  enhancedJobHeader: {
    marginBottom: 20,
  },
  jobTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobIconContainer: {
    marginRight: 12,
  },
  jobIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  enhancedJobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    lineHeight: 24,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityTextNew: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusDotBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoGrid: {
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  specializationContainer: {
    marginBottom: 16,
  },
  specializationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  specializationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  enhancedJobFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  payRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  payRateAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  payRatePeriod: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },

  // Enhanced Assignment Card Styles
  enhancedAssignmentCard: {
    marginBottom: 16,
    marginHorizontal: 2,
    shadowColor: '#1C2A3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderRadius: 24,
    overflow: 'hidden',
  },
  assignmentCardGradient: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  enhancedAssignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  assignmentTitleContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  assignmentIconContainer: {
    marginRight: 12,
  },
  assignmentIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  assignmentTitleTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  enhancedAssignmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 4,
  },
  assignmentSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  assignmentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  assignmentStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  progressShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    minWidth: 45,
    textAlign: 'right',
  },
  assignmentInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  assignmentInfoCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  assignmentInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  assignmentInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  assignmentInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  assignmentFooterAction: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  checkInButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default HealthcareProviderDashboardScreen;