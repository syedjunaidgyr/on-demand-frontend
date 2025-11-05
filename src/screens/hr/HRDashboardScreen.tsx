import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Animated,
  Image,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalStyles } from '../../theme/globalStyles';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import LinearGradient from 'react-native-linear-gradient';
import HRFooterNavigation from '../../components/HRFooterNavigation';

import ApiService from '../../services/api';
import { useAuth } from '../../navigation/AppNavigator';
import { Typography } from '../../constants/typography';
import { useNotifications } from '../../contexts/NotificationContext';
import Responsive from '../../utils/responsive';
import { usePermissions } from '../../hooks/usePermissions';
import {
  SkeletonHeader,
  SkeletonStatCard,
  SkeletonListCard,
  SkeletonQuickAction,
  SkeletonTitle,
} from '../../components/SkeletonComponents';

interface DashboardStats {
  jobs: {
    total: number;
    active: number;
    assigned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  assignments: {
    total: number;
    pending: number;
    accepted: number;
    inProgress: number;
    completed: number;
  };
  staff: {
    total: number;
    doctors: number;
    nurses: number;
  };
  agencies?: {
    total: number;
    jobs: number;
    assignments: number;
  };
  monthly: {
    jobs: number;
    assignments: number;
  };
  recent: {
    jobs: any[];
    assignments: any[];
  };
}

const HRDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const g = useGlobalStyles();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLoginSuccessModal, setShowLoginSuccessModal] = useState(false);
  // Pending check-in approvals
  const [showApprovalsModal, setShowApprovalsModal] = useState(false);
  const [pendingCheckIns, setPendingCheckIns] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const overviewScrollRef = React.useRef<ScrollView>(null);

  const scrollY = React.useRef(new Animated.Value(0)).current;

  /* --------------------------------------------------------------
     DATA LOADING
  -------------------------------------------------------------- */
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Show success modal after login if flag set
  useEffect(() => {
    (async () => {
      try {
        const flag = await AsyncStorage.getItem('SHOW_LOGIN_SUCCESS');
        if (flag === '1') {
          setShowLoginSuccessModal(true);
          await AsyncStorage.removeItem('SHOW_LOGIN_SUCCESS');
        }
      } catch {}
    })();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('Loading HR dashboard data...');

      try {
        const profile = await ApiService.getProfile();
        setUserProfile(profile);
      } catch (profileError) {
        setUserProfile(null);
      }

      let dashboardResponse;
      try {
        dashboardResponse = await ApiService.getHRDashboard();
      } catch (dashboardError) {
        dashboardResponse = null;
      }

      const jobsResponse = await ApiService.getAllJobs();
      const jobs = (jobsResponse as any).jobs || jobsResponse.data || [];
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter((job: any) => job.status === 'ACTIVE').length;
      const assignedJobs = jobs.filter((job: any) => (job.assignments?.length || 0) > 0).length;

      const dashboardData = dashboardResponse?.dashboard || dashboardResponse;
      const statsData = dashboardData || {
        jobs: { total: 0, active: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0 },
        assignments: { total: 0, pending: 0, accepted: 0, inProgress: 0, completed: 0 },
        staff: { total: 0, doctors: 0, nurses: 0 },
        agencies: { total: 0, jobs: 0, assignments: 0 },
        monthly: { jobs: 0, assignments: 0 },
        recent: { jobs: [], assignments: [] }
      };

      statsData.jobs.total = totalJobs;
      statsData.jobs.active = activeJobs;
      statsData.jobs.assigned = assignedJobs;

      // Ensure agencies block exists
      if (!statsData.agencies) {
        statsData.agencies = { total: 0, jobs: 0, assignments: 0 } as any;
      }

      // Set stats first, then set loading to false
      setStats(statsData);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      // Set default stats first, then set loading to false
      setStats({
        jobs: { total: 0, active: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0 },
        assignments: { total: 0, pending: 0, accepted: 0, inProgress: 0, completed: 0 },
        staff: { total: 0, doctors: 0, nurses: 0 },
        monthly: { jobs: 0, assignments: 0 },
        recent: { jobs: [], assignments: [] }
      });
      setIsLoading(false);
    }
  };

  const loadPendingCheckIns = async () => {
    try {
      console.log('🔍 Loading pending check-ins...');
      const list = await ApiService.getPendingCheckIns();
      console.log('✅ Pending check-ins loaded:', list?.length || 0, list);
      setPendingCheckIns(list || []);
    } catch (e) {
      console.error('❌ Failed to load pending check-ins:', e);
      setPendingCheckIns([]);
    }
  };

  const handleOpenApprovals = async () => {
    await loadPendingCheckIns();
    setShowApprovalsModal(true);
  };

  const handleApprove = async (checkIn: any) => {
    try {
      setApprovingId(checkIn.id);
      await ApiService.approveCheckIn(checkIn.id);
      setPendingCheckIns(prev => prev.filter(ci => ci.id !== checkIn.id));
    } catch (e) {
      // noop; you can add alert if needed
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (checkIn: any) => {
    try {
      setApprovingId(checkIn.id);
      await ApiService.rejectCheckIn(checkIn.id, 'Not compliant');
      setPendingCheckIns(prev => prev.filter(ci => ci.id !== checkIn.id));
    } catch (e) {
    } finally {
      setApprovingId(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const scrollToEnd = () => {
    overviewScrollRef.current?.scrollToEnd({ animated: true });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 48) return 'Yesterday';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#EF4444';
      case 'HIGH': return '#F59E0B';
      case 'MEDIUM': return '#3B82F6';
      case 'LOW': return '#10B981';
      default: return '#6B7280';
    }
  };

  /* --------------------------------------------------------------
     STAT CARD
  -------------------------------------------------------------- */
  const StatCard = ({
    title,
    value,
    icon,
    onPress,
  }: {
    title: string;
    value: number;
    icon: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}>
      <View style={styles.statContainer}>
        <View style={styles.statIconWrapper}>
          <FontAwesomeIcon icon={icon} size={Responsive.iconSize(22)} color="#1C2A3A" />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{value.toLocaleString()}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  /* --------------------------------------------------------------
     QuickAction & IconStatItem
  -------------------------------------------------------------- */
  const QuickAction = ({
    title,
    subtitle,
    icon,
    gradient,
    onPress
  }: {
    title: string;
    subtitle: string;
    icon: string;
    gradient: string[];
    onPress: () => void;
  }) => {
    const scaleAnim = new Animated.Value(1);
    const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    return (
      <TouchableOpacity
        style={styles.quickActionWrapper}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}>
        <Animated.View style={[styles.quickActionCard, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickActionGradient}>
            <FontAwesomeIcon icon={icon} size={Responsive.iconSize(18)} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.quickActionTitle} numberOfLines={2} ellipsizeMode="tail">{title}</Text>
          <Text style={styles.quickActionSubtitle} numberOfLines={2} ellipsizeMode="tail">{subtitle}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.iconStatValue}>{value.toLocaleString()}</Text>
        </View>
      </View>
      <Text style={styles.iconStatTitle}>{title}</Text>
    </TouchableOpacity>
  );

  /* --------------------------------------------------------------
     SKELETON LOADING SCREEN
  -------------------------------------------------------------- */

  /* --------------------------------------------------------------
     MAIN RENDER
  -------------------------------------------------------------- */
  return (
    <SafeAreaView style={g.appBackground}>
      {/* STATUS BAR – PERFECT MATCH */}
      <StatusBar
        backgroundColor="#FFFFFF"
        barStyle="dark-content"
        translucent={false}
      />

      <View style={styles.innerContainer}>
        {/* Simple Header */}
        {isLoading || !userProfile ? (
          <SkeletonHeader />
        ) : (
          <View style={styles.simpleHeader}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerGreeting}>
                  Hello <Text style={styles.headerRole}>Admin</Text>
                </Text>
                <Text style={styles.headerName}>
                  {userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() : 'Loading...'}!
                </Text>
              </View>
              <View style={styles.headerRight}>
                <View style={styles.headerRightContainer}>
                  <TouchableOpacity
                    style={styles.simpleNotificationButton}
                    onPress={handleOpenApprovals}>
                    <FontAwesomeIcon icon="clock" size={Responsive.iconSize(18)} color="#111827" />
                  </TouchableOpacity>
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
                        {userProfile
                          ? (userProfile.firstName || userProfile.lastName || 'U').charAt(0).toUpperCase()
                          : 'U'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" colors={['#6366F1']} />
          }>

          {/* Dashboard Title */}
          <View style={styles.dashboardTitleSection}>
            {isLoading ? (
              <SkeletonTitle width={150} height={16} />
            ) : (
              <Text style={styles.dashboardTitle}>HR Dashboard</Text>
            )}
          </View>

          {/* MAIN STATS */}
          {isLoading ? (
            <View style={styles.mainStatsGrid}>
              <SkeletonStatCard />
              <SkeletonStatCard />
            </View>
          ) : stats ? (
            <View style={styles.mainStatsGrid}>
              <StatCard
                title="Total Staff"
                value={stats?.staff?.total || 0}
                icon="users"
                onPress={() => (navigation as any).navigate('HRUsers')}
              />
              <StatCard
                title="Total Jobs"
                value={stats?.jobs?.total || 0}
                icon="briefcase"
                onPress={() => (navigation as any).navigate('HRJobs')}
              />
            </View>
          ) : (
            <View style={styles.mainStatsGrid}>
              <SkeletonStatCard />
              <SkeletonStatCard />
            </View>
          )}

          {/* Overview Stats */}
          <View style={styles.overviewSection}>
            <View style={styles.sectionHeaderRow}>
              {isLoading ? (
                <SkeletonTitle width={100} height={16} />
              ) : (
                <Text style={styles.sectionTitle}>Overview</Text>
              )}
              {!isLoading && (
                <TouchableOpacity onPress={scrollToEnd} style={styles.scrollToEndButton}>
                  <Text style={styles.viewAllText}>See All</Text>
                  <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(14)} color="#6366F1" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              ref={overviewScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              style={styles.overviewScroll}
              contentContainerStyle={styles.overviewScrollContent}>
              {isLoading || !stats ? (
                <View style={styles.iconStatsRow}>
                  {[...Array(6)].map((_, i) => (
                    <View key={i} style={{ marginRight: 16 }}>
                      <SkeletonStatCard />
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.iconStatsRow}>
                  <IconStatItem title="Total Jobs" value={stats?.jobs?.total || 0} icon="briefcase" iconColor="#3B82F6" onPress={() => (navigation as any).navigate('HRJobs')} />
                  <IconStatItem title="Active Jobs" value={stats?.jobs?.active || 0} icon="play" iconColor="#10B981" />
                  <IconStatItem title="Assigned" value={stats?.jobs?.assigned || 0} icon="user-check" iconColor="#8B5CF6" />
                  <IconStatItem title="In Progress" value={stats?.jobs?.inProgress || 0} icon="sync" iconColor="#F59E0B" />
                  <IconStatItem title="Completed" value={stats?.jobs?.completed || 0} icon="check-circle" iconColor="#059669" />
                  <IconStatItem title="Cancelled" value={stats?.jobs?.cancelled || 0} icon="times-circle" iconColor="#EF4444" />
                  <IconStatItem title="Total Staff" value={stats?.staff?.total || 0} icon="users" iconColor="#6366F1" onPress={() => (navigation as any).navigate('HRUsers')} />
                  <IconStatItem title="Assignments" value={stats?.assignments?.total || 0} icon="list" iconColor="#7C3AED" />
                  <IconStatItem title="Pending" value={stats?.assignments?.pending || 0} icon="clock" iconColor="#F59E0B" />
                  <IconStatItem title="Accepted" value={stats?.assignments?.accepted || 0} icon="check" iconColor="#10B981" />
                  <IconStatItem title="Progress" value={stats?.assignments?.inProgress || 0} icon="sync" iconColor="#3B82F6" />
                  <IconStatItem title="Done" value={stats?.assignments?.completed || 0} icon="check-circle" iconColor="#059669" />
                  {/* Agencies block */}
                  <IconStatItem title="Agencies" value={stats?.agencies?.total || 0} icon="building" iconColor="#0EA5E9" />
                  <IconStatItem title="Agency Jobs" value={stats?.agencies?.jobs || 0} icon="briefcase" iconColor="#9333EA" />
                  <IconStatItem title="Agency Assignments" value={stats?.agencies?.assignments || 0} icon="user-check" iconColor="#14B8A6" />
                </View>
              )}
            </ScrollView>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            {isLoading ? (
              <SkeletonTitle width={120} height={16} style={{ marginBottom: 16 }} />
            ) : (
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            )}
            {isLoading || !stats ? (
              <View style={styles.quickActionsGrid}>
                {[...Array(4)].map((_, i) => (
                  <SkeletonQuickAction key={i} />
                ))}
              </View>
            ) : (
              <View style={styles.quickActionsGrid}>
                {!permissionsLoading && hasPermission('JOB_CREATE') && (
                  <QuickAction title="Create Job" subtitle="Post new opening" icon="plus" gradient={['#3B82F6', '#2563EB']} onPress={() => (navigation as any).navigate('CreateJob')} />
                )}
                {!permissionsLoading && hasPermission('JOB_READ') && (
                  <QuickAction title="Assign Jobs" subtitle="View & edit" icon="briefcase" gradient={['#8B5CF6', '#7C3AED']} onPress={() => (navigation as any).navigate('HRJobs')} />
                )}
                {!permissionsLoading && hasPermission('USER_READ') && (
                  <QuickAction title="Staff" subtitle="Manage users" icon="users" gradient={['#10B981', '#059669']} onPress={() => (navigation as any).navigate('HRUsers')} />
                )}
                {!permissionsLoading && hasPermission('REPORT_VIEW') && (
                  <QuickAction title="Reports" subtitle="View insights" icon="chart-line" gradient={['#F59E0B', '#D97706']} onPress={() => (navigation as any).navigate('Reports')} />
                )}
                {isAdmin && (
                  <>
                    <QuickAction title="Hospitals" subtitle="Manage hospitals" icon="hospital" gradient={['#EF4444', '#DC2626']} onPress={() => (navigation as any).navigate('AdminHospitalManagement')} />
                    <QuickAction title="Permissions" subtitle="Manage permissions" icon="shield-alt" gradient={['#6366F1', '#4F46E5']} onPress={() => (navigation as any).navigate('PermissionManagement')} />
                    <QuickAction title="Specializations" subtitle="Manage specializations" icon="stethoscope" gradient={['#14B8A6', '#0D9488']} onPress={() => (navigation as any).navigate('SpecializationManagement')} />
                  </>
                )}
              </View>
            )}
          </View>

          {/* Recent Jobs */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              {isLoading ? (
                <SkeletonTitle width={120} height={16} />
              ) : (
                <Text style={styles.sectionTitle}>Recent Jobs</Text>
              )}
              {!isLoading && stats && (
                <TouchableOpacity onPress={() => (navigation as any).navigate('HRJobs')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            {isLoading || !stats ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <SkeletonListCard key={i} />
                ))}
              </>
            ) : (
              <View style={styles.listCard}>
                {stats?.recent?.jobs && stats.recent.jobs.length > 0 ? (
                  stats.recent.jobs.slice(0, 3).map((job, index) => (
                    <TouchableOpacity
                      key={job.id}
                      style={[styles.listItem, index === Math.min(2, stats.recent.jobs.length - 1) && styles.listItemLast]}
                      onPress={() => (navigation as any).navigate('JobDetails', { jobId: job.id })}
                      activeOpacity={0.7}>
                      <View style={styles.listIconWrapper}>
                        <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.listIcon}>
                          <FontAwesomeIcon icon="briefcase" size={Responsive.iconSize(18)} color="#FFFFFF" />
                        </LinearGradient>
                      </View>
                      <View style={styles.listContent}>
                        <Text style={styles.listTitle} numberOfLines={1}>{job.title}</Text>
                        <Text style={styles.listSubtitle} numberOfLines={1}>{job.department} to {job.location}</Text>
                        <View style={styles.listFooter}>
                          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) + '20' }]}>
                            <Text style={[styles.priorityText, { color: getPriorityColor(job.priority) }]}>{job.priority}</Text>
                          </View>
                          <Text style={styles.listRate}>₹{job.hourlyRate}/hr</Text>
                        </View>
                      </View>
                      <Text style={styles.listTime}>{formatDate(job.createdAt)}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                      <FontAwesomeIcon icon="briefcase" size={Responsive.iconSize(32)} color="#D1D5DB" />
                    </View>
                    <Text style={styles.emptyTitle}>No Recent Jobs</Text>
                    <Text style={styles.emptySubtitle}>Job postings will appear here</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Recent Assignments */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              {isLoading ? (
                <SkeletonTitle width={160} height={16} />
              ) : (
                <Text style={styles.sectionTitle}>Recent Assignments</Text>
              )}
              {!isLoading && stats && (
                <TouchableOpacity>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            {isLoading || !stats ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <SkeletonListCard key={i} />
                ))}
              </>
            ) : (
              <View style={styles.listCard}>
                {stats?.recent?.assignments && stats.recent.assignments.length > 0 ? (
                  stats.recent.assignments.slice(0, 3).map((assignment, index) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'ACCEPTED': return '#10B981';
                        case 'PENDING': return '#F59E0B';
                        case 'COMPLETED': return '#059669';
                        case 'REJECTED': return '#EF4444';
                        default: return '#6B7280';
                      }
                    };
                    const getStatusIcon = (status: string) => {
                      switch (status) {
                        case 'ACCEPTED': return 'check';
                        case 'PENDING': return 'clock';
                        case 'COMPLETED': return 'check-circle';
                        case 'REJECTED': return 'times-circle';
                        default: return 'info-circle';
                      }
                    };
                    const statusColor = getStatusColor(assignment.status);

                    return (
                      <View
                        key={assignment.id}
                        style={[styles.listItem, index === Math.min(2, stats.recent.assignments.length - 1) && styles.listItemLast]}>
                        <View style={styles.listIconWrapper}>
                          <LinearGradient colors={[statusColor, statusColor]} style={styles.listIcon}>
                            <FontAwesomeIcon icon={getStatusIcon(assignment.status)} size={Responsive.iconSize(18)} color="#FFFFFF" />
                          </LinearGradient>
                        </View>
                        <View style={styles.listContent}>
                          <Text style={styles.listTitle} numberOfLines={1}>
                            {assignment.user?.firstName} {assignment.user?.lastName}
                          </Text>
                          <Text style={styles.listSubtitle} numberOfLines={1}>{assignment.job?.title}</Text>
                          <View style={styles.listFooter}>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                              <Text style={[styles.statusText, { color: statusColor }]}>{assignment.status}</Text>
                            </View>
                            <Text style={styles.listRate}>₹{assignment.hourlyRate}/hr</Text>
                          </View>
                        </View>
                        <Text style={styles.listTime}>{formatDate(assignment.updatedAt)}</Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                      <FontAwesomeIcon icon="list" size={Responsive.iconSize(32)} color="#D1D5DB" />
                    </View>
                    <Text style={styles.emptyTitle}>No Recent Assignments</Text>
                    <Text style={styles.emptySubtitle}>Assignment updates will appear here</Text>
                  </View>
                )}
              </View>
            )}
          </View>

      </ScrollView>

      {/* Pending Check-ins Modal */}
      {showApprovalsModal && (
        <View style={styles.approvalsOverlay}>
          <View style={styles.approvalsSheet}>
            <View style={styles.approvalsHeader}>
              <Text style={styles.approvalsTitle}>Pending Check-ins</Text>
              <TouchableOpacity onPress={() => setShowApprovalsModal(false)}>
                <FontAwesomeIcon icon="times" size={Responsive.iconSize(18)} color="#111827" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.6 }}>
              {pendingCheckIns.length === 0 ? (
                <Text style={{ color: '#6B7280', paddingVertical: 12 }}>No pending items</Text>
              ) : (
                pendingCheckIns.map((ci) => (
                  <View key={ci.id} style={styles.approvalRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.approvalJob}>{ci?.job?.title || 'Job'}</Text>
                      <Text style={styles.approvalMeta}>{(ci?.user?.firstName || '') + ' ' + (ci?.user?.lastName || '')} • {(ci?.job?.facilityName || ci?.job?.location || '')}</Text>
                    </View>
                    <View style={styles.approvalActions}>
                      <TouchableOpacity disabled={approvingId===ci.id} style={[styles.approveBtn, approvingId===ci.id && { opacity: 0.6 }]} onPress={() => handleApprove(ci)}>
                        <Text style={styles.approvalBtnText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity disabled={approvingId===ci.id} style={[styles.rejectBtn, approvingId===ci.id && { opacity: 0.6 }]} onPress={() => handleReject(ci)}>
                        <Text style={styles.approvalBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Powered By */}
      <View style={styles.poweredByContainer}>
        <Text style={styles.poweredByText}>Powered by</Text>
        <Image source={require('../../assets/footer_logo.png')} style={styles.companyLogo} resizeMode="contain" />
      </View>

      <HRFooterNavigation activeRoute="Dashboard" scrollY={scrollY} isLoading={isLoading} />
      </View>

      {/* Login Success Modal (same style as LoginScreen) */}
      <Modal
        transparent
        visible={showLoginSuccessModal}
        animationType="fade"
        onRequestClose={() => setShowLoginSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLoginSuccessModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <FontAwesomeIcon 
                icon="check-circle" 
                size={Responsive.iconSize(60)} 
                color="#4CAF50" 
              />
            </View>
            <Text style={styles.successTitle}>Login Successful!</Text>
            <Text style={styles.successMessage}>Welcome back! You have successfully signed in.</Text>
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowLoginSuccessModal(false)}
            >
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/* --------------------------------------------------------------
   STYLES – CLEAN & STATUS BAR FIXED
-------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280',
  },
  dashboardTitleSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dashboardTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    letterSpacing: -0.3,
  },
  mainStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 0,
  },
  statCard: {
    flex: 1,
    minHeight: 100,
  },
  statContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    // borderWidth: 1,
    borderColor: '#1C2A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  statContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontFamily: Typography.fontFamily.bold,
    color: '#1C2A3A',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: '#1C2A3A',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  overviewSection: {
    paddingHorizontal: 20,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    letterSpacing: -0.3,
  },
  scrollToEndButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    color: '#6366F1',
    marginTop: 2,
  },
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
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Avoid gap for cross-device consistency
    // Horizontal spacing handled by space-between and child widths
    marginTop: 16,
    justifyContent: 'space-between',
  },
  quickActionWrapper: {
    width: '48%',
    flexBasis: '48%',
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 8,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    width: '100%',
  },
  quickActionGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionTitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    marginBottom: 2,
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemLast: {
    borderBottomWidth: 0,
  },
  listIconWrapper: {
    marginRight: 14,
  },
  listIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flex: 1,
    marginRight: 12,
  },
  listTitle: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.medium,
    color: '#111827',
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
    marginBottom: 8,
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'capitalize',
  },
  listRate: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
  },
  listTime: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
    textAlign: 'center',
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
    color: '#374151',
    textAlign: 'center',
    lineHeight: 15,
    maxWidth: 80,
  },
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    marginTop: 0,
  },
  approvalsOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'
  },
  approvalsSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20
  },
  approvalsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12
  },
  approvalsTitle: { fontSize: 16, fontFamily: Typography.fontFamily.medium, color: '#111827' },
  approvalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  approvalJob: { fontSize: 14, fontFamily: Typography.fontFamily.medium, color: '#111827' },
  approvalMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  approvalActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12 },
  approveBtn: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  rejectBtn: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  approvalBtnText: { color: '#FFFFFF', fontSize: 12, fontFamily: Typography.fontFamily.medium },
  poweredByText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280',
    marginRight: -2,
  },
  companyLogo: {
    height: 15,
    width: 80,
    marginLeft: -12,
  },
  // Success modal styles (matching LoginScreen)
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  modalDoneButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
  },
});

export default HRDashboardScreen;