import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import LinearGradient from 'react-native-linear-gradient';
import GlobalHeader from '../../components/GlobalHeader';
import HRFooterNavigation from '../../components/HRFooterNavigation';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { Job, JobAssignment, User } from '../../types';
import ApiService from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import Responsive from '../../utils/responsive';
import {
  SkeletonJobCard,
  SkeletonQuickAction,
  SkeletonStatCard,
  SkeletonHeader,
} from '../../components/SkeletonComponents';

const HealthcareProviderDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<Job[]>([]);
  const [myAssignments, setMyAssignments] = useState<JobAssignment[]>([]);
  const [workStatus, setWorkStatus] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const scrollY = React.useRef(new Animated.Value(0)).current;

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
        console.log('📊 Available jobs response:', availableData);
      } catch (error: any) {
        // Suppress backend noise; UI will gracefully show zero available jobs
      }

      try {
        upcomingData = userData.role === 'DOCTOR' 
          ? await ApiService.getUpcomingJobs()
          : await ApiService.getNurseUpcomingJobs();
        console.log('✅ Upcoming jobs loaded successfully');
      } catch (error: any) {
        // Silently fail if endpoint doesn't exist (404) since upcoming jobs aren't displayed
        if (error?.response?.status !== 404) {
          console.warn('⚠️ Failed to load upcoming jobs:', error?.response?.status || error?.message);
        }
        upcomingData = null;
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
      console.log('📊 Available jobs count:', availableData?.data?.length || 0);
      setUpcomingJobs(upcomingData || []);
      console.log('✅ Upcoming jobs loaded successfully:', upcomingData);
      console.log('📊 Upcoming jobs count:', upcomingData?.length || 0);
      // Handle API response structure: { assignments: [...], total: ... } or { data: [...] }
      const assignmentsList = assignmentsData?.data || (assignmentsData as any)?.assignments || [];
      setMyAssignments(assignmentsList);
      console.log('✅ Assignments loaded successfully:', assignmentsData);
      console.log('📊 Assignments count:', assignmentsList.length);
      console.log('📊 First assignment:', assignmentsList[0] ? JSON.stringify(assignmentsList[0], null, 2) : 'No assignments');
      setWorkStatus(statusData);
      // Set loading to false after all data is set
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setAvailableJobs([]);
      setUpcomingJobs([]);
      setMyAssignments([]);
      setWorkStatus(null);
      // Set loading to false even on error
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

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'just now';
    const now = new Date();
    const past = new Date(dateString);

    // Use calendar day difference (local) to avoid timezone rounding issues
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayStart = startOfDay(now).getTime();
    const pastStart = startOfDay(past).getTime();
    const daysDiff = Math.max(0, Math.floor((todayStart - pastStart) / (1000 * 60 * 60 * 24)));

    if (daysDiff === 0) {
      // If same calendar day, show hours if useful
      const diffInHours = Math.max(0, Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60)));
      if (diffInHours < 1) return 'just now';
      if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
      return 'today';
    }
    if (daysDiff === 1) return '1 day ago';
    if (daysDiff < 7) return `${daysDiff} days ago`;
    return formatDate(dateString);
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
  const QuickActionHorizontal = ({ icon, title, subtitle, onPress, gradient, iconColor, count }: any) => (
    <View style={styles.quickActionShadowContainer}>
      <TouchableOpacity onPress={onPress} activeOpacity={1}>
        <View style={styles.quickActionHorizontal}>
          {typeof count === 'number' && count > 0 && (
            <View style={styles.quickActionBadge}>
              <Text style={styles.quickActionBadgeText}>{count > 99 ? '99+' : count}</Text>
            </View>
          )}
          <View style={styles.quickActionContent}>
            <View style={[styles.quickActionHorizontalIcon, { borderColor: iconColor || '#E5E7EB', borderWidth: 1, backgroundColor: '#FFFFFF' }]}>
              <FontAwesomeIcon icon={icon} size={Responsive.iconSize(24)} color={iconColor || Colors.primary} />
            </View>
            <View style={styles.quickActionTextContainer}>
              <Text style={styles.quickActionHorizontalTitle}>{title}</Text>
              <Text style={styles.quickActionHorizontalSubtitle}>{subtitle}</Text>
            </View>
          </View>
          <View style={styles.quickActionArrow}>
            <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(14)} color={iconColor || Colors.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  // IconStatItem – matches HR overview style
  const IconStatItem = ({
    title,
    value,
    icon,
    onPress,
    iconColor = '#3B82F6'
  }: {
    title: string;
    value: number;
    icon: string;
    onPress?: () => void;
    iconColor?: string;
  }) => (
    <TouchableOpacity
      style={styles.iconStatItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}>
      <View style={styles.iconStatContainer}>
        <View style={[styles.iconStatIconWrapper, { backgroundColor: iconColor + '15' }]}>
          <FontAwesomeIcon icon={icon} size={Responsive.iconSize(22)} color={iconColor} />
        </View>
        <View style={styles.iconStatBadge}>
          <Text style={styles.iconStatValue}>{(value ?? 0).toLocaleString()}</Text>
        </View>
      </View>
      <Text style={styles.iconStatTitle} numberOfLines={1}>{title}</Text>
    </TouchableOpacity>
  );

  const JobCard = ({ job }: { job: Job }) => {
    // Debug: Log job data to see what fields are available
    console.log('🔍 Job data:', JSON.stringify(job, null, 2));
    console.log('🔍 Job title:', job?.title);
    console.log('🔍 Job description:', job?.description);
    console.log('🔍 Job hourlyRate:', job?.hourlyRate);
    
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
                <View style={[styles.priorityBadgeInline, { backgroundColor: getPriorityColor(job.priority) + '20', borderColor: getPriorityColor(job.priority) }]}>
                  <Text style={[styles.priorityBadgeTextInline, { color: getPriorityColor(job.priority) }]}>{job.priority}</Text>
                </View>
              )}
              <View style={[styles.jobStatus, { backgroundColor: getStatusColor(job.status) }]}>
                <Text style={styles.jobStatusText}>{getStatusText(job.status)}</Text>
              </View>
            </View>
          </View>
          {(job.description && job.description.trim()) && (
            <Text style={styles.jobDescription} numberOfLines={3}>
              {job.description}
            </Text>
          )}
          {job.facilityName && (
            <View style={styles.jobDetail}>
              <View style={styles.jobDetailIcon}>
                <FontAwesomeIcon icon="hospital" size={Responsive.iconSize(14)} color={Colors.primary} />
              </View>
              <Text style={styles.jobDetailText}>{job.facilityName}</Text>
            </View>
          )}
          <View style={styles.jobDetails}>
            <View style={styles.jobDetail}>
              <View style={styles.jobDetailIcon}>
                <FontAwesomeIcon icon="map-marker-alt" size={Responsive.iconSize(14)} color={Colors.primary} />
              </View>
              <Text style={styles.jobDetailText}>{job.location}</Text>
            </View>
            <View style={styles.jobDetail}>
              <View style={styles.jobDetailIcon}>
                <FontAwesomeIcon icon="clock" size={Responsive.iconSize(14)} color={Colors.primary} />
              </View>
              <Text style={styles.jobDetailText}>
                {formatDate(job.startDate)} at {formatTime(job.startTime)}
              </Text>
            </View>
            <View style={styles.jobDetail}>
              <View style={styles.jobDetailIcon}>
                <FontAwesomeIcon icon="building" size={Responsive.iconSize(14)} color={Colors.primary} />
              </View>
              <Text style={styles.jobDetailText}>{job.department}</Text>
            </View>
            {job.specialization && (
              <View style={styles.jobDetail}>
                <View style={styles.jobDetailIcon}>
                  <FontAwesomeIcon icon="stethoscope" size={Responsive.iconSize(14)} color={Colors.primary} />
                </View>
                <Text style={styles.jobDetailText}>{job.specialization}</Text>
              </View>
            )}
            {job.facilityAddress && (
              <View style={styles.jobDetail}>
                <View style={styles.jobDetailIcon}>
                  <FontAwesomeIcon icon="map-pin" size={Responsive.iconSize(14)} color={Colors.primary} />
                </View>
                <Text style={styles.jobDetailText}>
                  {job.facilityAddress.street}, {job.facilityAddress.city}
                </Text>
              </View>
            )}
            {job.hourlyRate && (
              <View style={styles.jobDetail}>
                <View style={styles.jobDetailIcon}>
                  <FontAwesomeIcon icon="rupee-sign" size={Responsive.iconSize(14)} color={Colors.success} />
                </View>
                <Text style={styles.jobDetailText}>
                  ₹{job.hourlyRate}/hour
                </Text>
              </View>
            )}
          </View>
          <View style={styles.jobCardFooter}>
            <View style={styles.jobDurationContainer}>
              <Text style={styles.jobDuration}>
                {formatTime(job.startTime)} - {formatTime(job.endTime)}
              </Text>
            </View>
            <View style={styles.jobFooterRight}>
              <Text style={styles.jobDate}>
                {formatDate(job.startDate)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const AssignmentCard = ({ assignment }: { assignment: JobAssignment }) => {
    const handleAssignmentPress = () => {
      (navigation as any).navigate('Assignments');
    };

    const job = assignment.job;
    if (!job) return null;

    // Extract data from API response structure - display exactly as received
    const facilityName = (job.facilityName || '').trim() || 'Healthcare Facility';
    const location = (job.location || '').trim() || 'Location not specified';
    
    // Display hourlyRate exactly as it comes from API
    const hourlyRate = assignment.hourlyRate || job.hourlyRate || '0';
    const hourlyRateDisplay = typeof hourlyRate === 'string' ? hourlyRate : hourlyRate.toString();
    
    // Use assignment createdAt first, then job createdAt, then current date
    const createdAt = assignment.createdAt || job.createdAt;
    const postedTime = createdAt ? getTimeAgo(createdAt) : 'just now';

    // Determine Today/Tomorrow based on job start date
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const startDateObj = job.startDate ? new Date(job.startDate) : null;
    const nowDate = new Date();
    const tomorrowDate = new Date(nowDate);
    tomorrowDate.setDate(nowDate.getDate() + 1);
    const dayBadgeLabel = startDateObj
      ? (isSameDay(startDateObj, nowDate) ? 'Today' : (isSameDay(startDateObj, tomorrowDate) ? 'Tomorrow' : null))
      : null;
    const dateDisplay = job.startDate ? `${formatDate(job.startDate)}${job.startTime ? `, ${formatTime(job.startTime)}` : ''}` : '';
    
    // Generate company initials from facility name
    const companyInitials = facilityName
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'HC';

    // Get job details from API
    const priority = job.priority || '';
    const requiredRole = job.requiredRole || '';
    const department = job.department || '';

    // Assignment status mapping (use assignment status, not job status)
    const getAssignmentStatusConfig = (status: string) => {
      switch ((status || '').toUpperCase()) {
        case 'PENDING':
          return { color: Colors.warning, text: 'Pending Response' };
        case 'ACCEPTED':
          return { color: Colors.primary, text: 'Accepted' };
        case 'REJECTED':
          return { color: Colors.error, text: 'Rejected' };
        case 'COMPLETED':
          return { color: Colors.info, text: 'Completed' };
        default:
          return { color: Colors.textTertiary, text: (status || 'Unknown') };
      }
    };

    const statusConfig = getAssignmentStatusConfig(assignment.status);

    // Priority color mapping
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
          return '#6B7280';
      }
    };

    // Status color mapping
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'ACTIVE':
          return '#10B981';
        case 'CANCELLED':
          return '#EF4444';
        case 'COMPLETED':
          return '#3B82F6';
        case 'FILLED':
          return '#6B7280';
        default:
          return '#6B7280';
      }
    };

    return (
      <>
      <View style={styles.postedOuterRow}>
        <Text style={styles.postedOuterText}>Posted {postedTime}</Text>
      </View>
      <TouchableOpacity 
        style={styles.jobCard}
        onPress={handleAssignmentPress}
        activeOpacity={0.8}>
        {/* Top row: Correct date/time in original position */}
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTimeText} numberOfLines={1}>{dateDisplay}</Text>
          {assignment.status && (
            <View style={[styles.topStatusPill, { backgroundColor: statusConfig.color }]}> 
              <Text style={styles.topStatusText}>{statusConfig.text}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardDivider} />

        {/* Main row: Job details (avatar removed) */}
        <View style={styles.profileRow}>
          <View style={styles.profileContent}>
            <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
              {job.title}
            </Text>
            {/* Subtitle row: Facility • Location • Status */}
            <View style={styles.subtitleRow}>
              {facilityName && (
                <Text style={styles.subtitleText} numberOfLines={1}>{facilityName}</Text>
              )}
              {facilityName && location && (
                <Text style={styles.subtitleDot}> • </Text>
              )}
              {location && (
                <Text style={styles.subtitleText} numberOfLines={1}>{location}</Text>
              )}
              {/* Status removed from subtitle row */}
              </View>

            {/* Compact info row: Department, Role, Rate */}
            <View style={styles.assignmentRow}>
              {priority && (
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Priority</Text>
                  <View style={[styles.priorityBadgeInline, { backgroundColor: getPriorityColor(priority) + '20', borderColor: getPriorityColor(priority) }] }>
                    <Text style={[styles.priorityBadgeTextInline, { color: getPriorityColor(priority) }]} numberOfLines={1}>{priority}</Text>
                  </View>
                </View>
              )}
              {requiredRole && (
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Role</Text>
                  <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{requiredRole}</Text>
          </View>
              )}
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Rate</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">₹{hourlyRateDisplay}/hr</Text>
              </View>
            </View>
            {/* Department moved below */}
            {department && (
              <View style={styles.priorityRow}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{department}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
      </>
    );
  };

  const roleConfig = getRoleConfig();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaTop} edges={['top']}>
        {/* STATUS BAR */}
        <StatusBar
          backgroundColor="#FFFFFF"
          barStyle="dark-content"
          translucent={false}
        />

        <View style={styles.innerContainer}>
        {/* Simple Header */}
        {isLoading || !user ? (
          <SkeletonHeader />
        ) : (
          <View style={styles.simpleHeader}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerGreeting}>
                  Hello <Text style={styles.headerRole}>{user?.role || 'Provider'}</Text>
                  </Text>
                <Text style={styles.headerName}>
                  {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Loading...'}!
                </Text>
              </View>
              <View style={styles.headerRight}>
                <View style={styles.headerRightContainer}>
            <TouchableOpacity 
                    style={styles.simpleNotificationButton}
                    onPress={() => (navigation as any).navigate('Notifications')}>
                    <FontAwesomeIcon icon="bell" size={Responsive.iconSize(18)} color="#F59E0B" />
              {unreadCount > 0 && (
                      <View style={styles.simpleNotificationBadge}>
                        <Text style={styles.simpleNotificationBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerProfileImage}
                    onPress={() => (navigation as any).navigate('Profile')}>
                    <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.headerProfileGradient}>
                      <Text style={styles.headerProfileInitials}>
                        {user
                          ? (user.firstName || user.lastName || 'U').charAt(0).toUpperCase()
                          : 'U'}
            </Text>
                    </LinearGradient>
                  </TouchableOpacity>
          </View>
        </View>
      </View>
            {/* Dashboard Title inside Header */}
            {/* <View style={styles.dashboardTitleSection}>
              <Text style={styles.dashboardTitle}>{roleConfig.title}</Text>
            </View> */}
          </View>
        )}

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollableContent}
        showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }>

        {/* ✨ Quick Actions – icon stats like HR overview */}
        <View style={[styles.section, styles.firstSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.overviewScrollContent}
            style={styles.overviewScroll}
            scrollEventThrottle={16}>
            {isLoading ? (
              <View style={styles.iconStatsRow}>
                {[...Array(4)].map((_, i) => (
                  <View key={i} style={{ marginRight: 16 }}>
                    <SkeletonStatCard />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.iconStatsRow}>
                <IconStatItem
                  title="Assignments"
                  value={myAssignments.length}
                  icon="calendar-check"
                  iconColor="#4F46E5"
                  onPress={() => (navigation as any).navigate('Assignments')}
                />
                {myAssignments && myAssignments.length > 0 && (
                  <IconStatItem
                    title="Check In/Out"
                    value={myAssignments.filter(a => a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS').length}
                    icon="clock"
                    iconColor="#D97706"
                    onPress={() => (navigation as any).navigate('CheckInOut')}
                  />
                )}
                <IconStatItem
                  title="Reports"
                  value={0}
                  icon="chart-line"
                  iconColor="#7C3AED"
                  onPress={() => (navigation as any).navigate('Reports')}
                />
                <IconStatItem
                  title="Profile"
                  value={0}
                  icon="user-md"
                  iconColor="#DB2777"
                  onPress={() => (navigation as any).navigate('Profile')}
                />
              </View>
            )}
          </ScrollView>
        </View>

        {/* Available Jobs */}
        {/* <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Job Assignments</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Assignments')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {(() => {
            console.log('🎯 Rendering Job Assignments section');
            console.log('🎯 availableJobs array:', availableJobs);
            console.log('🎯 availableJobs length:', availableJobs?.length);
            console.log('🎯 availableJobs type:', typeof availableJobs);
            return null;
          })()}
          {availableJobs && availableJobs.length > 0 ? (
            availableJobs.slice(0, 3).map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesomeIcon icon="briefcase" size={Responsive.iconSize(48)} color={Colors.textTertiary} />
              <Text style={styles.emptyStateText}>No available jobs at the moment</Text>
            </View>
          )}
        </View> */}

        {/* My Assignments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Jobs</Text>
            {!isLoading && (
            <TouchableOpacity onPress={() => (navigation as any).navigate('Assignments')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
            )}
          </View>
          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <SkeletonJobCard key={i} />
              ))}
            </>
          ) : (
            <>
          {myAssignments && myAssignments.length > 0 ? (
            myAssignments.slice(0, 3).map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesomeIcon icon="calendar" size={Responsive.iconSize(48)} color={Colors.textTertiary} />
              <Text style={styles.emptyStateText}>No current assignments</Text>
            </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <HRFooterNavigation activeRoute="Dashboard" scrollY={scrollY} isLoading={isLoading} />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F9FF',
  },
  safeAreaTop: {
    flex: 1,
    backgroundColor: '#F3F9FF',
  },
  innerContainer: {
    flex: 1,
    backgroundColor: '#F3F9FF',
  },
  simpleHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRole: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    color: '#6366F1',
  },
  headerGreeting: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
    marginBottom: 2,
  },
  headerName: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  simpleNotificationButton: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  simpleNotificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  simpleNotificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
  },
  headerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  headerProfileGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerProfileInitials: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 8,
  },
  dashboardTitleSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
  },
  dashboardTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    letterSpacing: -0.3,
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
  firstSection: {
    marginTop: 8,
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
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADADA',
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
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  quickActionHorizontalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  quickActionHorizontalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  quickActionArrow: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#1C2A3A',
    borderRadius: 12,
    minWidth: 24,
    height: 22,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  quickActionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
  },
  // Overview-like icon stats (match HR style)
  overviewScroll: {
    marginHorizontal: -20,
  },
  overviewScrollContent: {
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  iconStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconStatItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 85,
  },
  iconStatContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  iconStatIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconStatBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#1C2A3A',
    borderRadius: 12,
    minWidth: 28,
    height: 24,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  iconStatValue: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  iconStatTitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
    maxWidth: 80,
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
  jobDurationContainer: {
    flex: 1,
  },
  jobDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  // Job Card Styles (matching HRUsersScreen style)
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginTop: -8,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayBadgeRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  dayBadgeOuterRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
  },
  postedOuterRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 0,
    marginTop: -12,
  },
  postedOuterText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
    marginBottom: 12,
  },
  topStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    shadowOpacity: 0,
    elevation: 0,
  },
  topStatusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    textTransform: 'capitalize',
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#1C2A3A',
  },
  dayBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
  },
  dayBadgePlaceholder: {
    height: 0,
  },
  dateRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  dateText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
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
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: -2,
  },
  avatarInitials: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: '#4C1D95',
  },
  profileContent: {
    flex: 1,
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
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
  inlineStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inlineStatusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    textTransform: 'capitalize',
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
  },
  infoValue: {
    marginTop: 2,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  priorityRow: {
    marginTop: 8,
  },
  priorityBadgeInline: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  priorityBadgeTextInline: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
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