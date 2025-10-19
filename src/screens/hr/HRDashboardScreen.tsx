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
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import LinearGradient from 'react-native-linear-gradient';
import GlobalHeader from '../../components/GlobalHeader';

import ApiService from '../../services/api';

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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get screen dimensions for responsive design
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenHeight < 700;
  const isLargeScreen = screenHeight > 800;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('🔧 Loading HR dashboard data...');
      
      // Load user profile first
      try {
        const profile = await ApiService.getProfile();
        console.log('👤 User Profile:', profile);
        setUserProfile(profile);
      } catch (profileError) {
        console.log('⚠️ Profile API failed:', profileError);
        setUserProfile(null);
      }
      
      let dashboardResponse;
      try {
        dashboardResponse = await ApiService.getHRDashboard();
        console.log('📊 HR Dashboard Response:', JSON.stringify(dashboardResponse, null, 2));
      } catch (dashboardError) {
        console.log('⚠️ Dashboard API failed, loading jobs directly:', dashboardError);
        dashboardResponse = null;
      }
      
      const jobsResponse = await ApiService.getAllJobs();
      console.log('📋 Jobs Response:', jobsResponse);
      
      const jobs = jobsResponse.jobs || jobsResponse.data || [];
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter(job => job.status === 'ACTIVE').length;
      const assignedJobs = jobs.filter(job => (job.assignments?.length || 0) > 0).length;
      
      console.log('📊 Job Stats:', { totalJobs, activeJobs, assignedJobs });
      
      const dashboardData = dashboardResponse?.dashboard || dashboardResponse;
      const statsData = dashboardData || {
        jobs: { total: 0, active: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0 },
        assignments: { total: 0, pending: 0, accepted: 0, inProgress: 0, completed: 0 },
        staff: { total: 0, doctors: 0, nurses: 0 },
        monthly: { jobs: 0, assignments: 0 },
        recent: { jobs: [], assignments: [] }
      };
      
      statsData.jobs.total = totalJobs;
      statsData.jobs.active = activeJobs;
      statsData.jobs.assigned = assignedJobs;
      
      setStats(statsData);
    } catch (error: any) {
      console.error('❌ Failed to load dashboard data:', error);
      
      setStats({
        jobs: { total: 0, active: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0 },
        assignments: { total: 0, pending: 0, accepted: 0, inProgress: 0, completed: 0 },
        staff: { total: 0, doctors: 0, nurses: 0 },
        monthly: { jobs: 0, assignments: 0 },
        recent: { jobs: [], assignments: [] }
      });
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
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    gradient, 
    onPress,
    percentage 
  }: {
    title: string;
    value: number;
    icon: string;
    gradient: string[];
    onPress?: () => void;
    percentage?: string;
  }) => (
    <TouchableOpacity 
      style={styles.statCard} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statGradient}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statTitle}>{title}</Text>
          <View style={styles.statIconRound}>
            <FontAwesomeIcon icon={icon} size={18} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.statValue}>{value.toLocaleString()}</Text>
        {percentage && (
          <View style={styles.percentageBadge}>
            <FontAwesomeIcon icon="chevron-up" size={10} color="#FFFFFF" />
            <Text style={styles.percentageText}>{percentage}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

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
  }) => (
    <TouchableOpacity 
      style={styles.quickActionWrapper} 
      onPress={onPress}
      activeOpacity={0.8}>
      <View style={styles.quickActionCard}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickActionGradient}>
          <FontAwesomeIcon icon={icon} size={24} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        {/* Combined Profile, Title and Stats Card */}
        <View style={styles.combinedCard}>
          {/* Profile Section */}
          <TouchableOpacity 
            style={styles.profileSection}
            onPress={() => (navigation as any).navigate('Profile')}
            activeOpacity={0.7}>
            <View style={styles.profileInfo}>
              <View style={styles.profileImageContainer}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.profileImage}>
                  <Text style={styles.profileInitials}>
                    {userProfile ? 
                      (userProfile.firstName || userProfile.lastName || 'U').charAt(0).toUpperCase()
                      : 'U'
                    }
                  </Text>
                </LinearGradient>
              </View>
              <View style={styles.profileText}>
                <Text style={styles.profileName}>
                  {userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() : 'Loading...'}
                </Text>
                <Text style={styles.profileRole}>
                  {userProfile?.role || 'HR'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <FontAwesomeIcon icon="bell" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Main Title */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>HR Dashboard</Text>
          </View>

          {/* Main Stats Cards */}
          <View style={styles.mainStatsSection}>
            <View style={styles.mainStatsRow}>
              <View style={styles.mainStatCard}>
                <View style={styles.mainStatContent}>
                  <View style={styles.mainStatIcon}>
                    <FontAwesomeIcon icon="users" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.mainStatText}>
                    <Text style={styles.mainStatValue}>{stats?.staff?.total || 0}</Text>
                    <Text style={styles.mainStatLabel}>Total Staff</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.mainStatCard}>
                <View style={styles.mainStatContent}>
                  <View style={styles.mainStatIcon}>
                    <FontAwesomeIcon icon="briefcase" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.mainStatText}>
                    <Text style={styles.mainStatValue}>{stats?.jobs?.total || 0}</Text>
                    <Text style={styles.mainStatLabel}>Total Jobs</Text>
                  </View>
                </View>
              </View>
            </View>
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

        {/* Overview Stats Grid */}
        <View style={[styles.section, styles.firstSection]}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Jobs"
              value={stats?.jobs?.total || 0}
              icon="briefcase"
              gradient={['#0891B2', '#0E7490']}
              onPress={() => (navigation as any).navigate('HRJobs')}
            />
            <StatCard
              title="Active Jobs"
              value={stats?.jobs?.active || 0}
              icon="play"
              gradient={['#1F2937', '#374151']}
            />
            <StatCard
              title="Assigned Jobs"
              value={stats?.jobs?.assigned || 0}
              icon="user-check"
              gradient={['#2563EB', '#3B82F6']}
            />
            <StatCard
              title="In Progress"
              value={stats?.jobs?.inProgress || 0}
              icon="sync"
              gradient={['#EC4899', '#BE185D']}
            />
            <StatCard
              title="Completed Jobs"
              value={stats?.jobs?.completed || 0}
              icon="check-circle"
              gradient={['#10B981', '#059669']}
            />
            <StatCard
              title="Cancelled Jobs"
              value={stats?.jobs?.cancelled || 0}
              icon="times-circle"
              gradient={['#EF4444', '#DC2626']}
            />
            <StatCard
              title="Total Staff"
              value={stats?.staff?.total || 0}
              icon="users"
              gradient={['#8B5CF6', '#7C3AED']}
              onPress={() => (navigation as any).navigate('HRUsers')}
            />
            <StatCard
              title="Total Assignments"
              value={stats?.assignments?.total || 0}
              icon="list"
              gradient={['#F59E0B', '#D97706']}
            />
            <StatCard
              title="Pending"
              value={stats?.assignments?.pending || 0}
              icon="clock"
              gradient={['#F97316', '#EA580C']}
            />
            <StatCard
              title="Accepted"
              value={stats?.assignments?.accepted || 0}
              icon="check"
              gradient={['#14B8A6', '#0D9488']}
            />
            <StatCard
              title="In Progress"
              value={stats?.assignments?.inProgress || 0}
              icon="sync"
              gradient={['#06B6D4', '#0891B2']}
            />
            <StatCard
              title="Completed"
              value={stats?.assignments?.completed || 0}
              icon="check-circle"
              gradient={['#22C55E', '#16A34A']}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              title="Create Job"
              subtitle="Post new opening"
              icon="plus"
              gradient={['#3B82F6', '#2563EB']}
              onPress={() => (navigation as any).navigate('CreateJob')}
            />
            <QuickAction
              title="Manage Jobs"
              subtitle="View & edit"
              icon="briefcase"
              gradient={['#8B5CF6', '#7C3AED']}
              onPress={() => (navigation as any).navigate('HRJobs')}
            />
            <QuickAction
              title="Staff"
              subtitle="Manage users"
              icon="users"
              gradient={['#10B981', '#059669']}
              onPress={() => (navigation as any).navigate('HRUsers')}
            />
            <QuickAction
              title="Reports"
              subtitle="View insights"
              icon="chart-line"
              gradient={['#F59E0B', '#D97706']}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Recent Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Jobs</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('HRJobs')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listCard}>
            {stats?.recent?.jobs && stats.recent.jobs.length > 0 ? (
              stats.recent.jobs.slice(0, 3).map((job, index) => (
                <TouchableOpacity 
                  key={job.id} 
                  style={[
                    styles.listItem,
                    index === Math.min(2, stats.recent.jobs.length - 1) && styles.listItemLast
                  ]}
                  onPress={() => (navigation as any).navigate('JobDetails', { jobId: job.id })}
                  activeOpacity={0.7}>
                  <View style={styles.listIconWrapper}>
                    <LinearGradient
                      colors={['#3B82F6', '#2563EB']}
                      style={styles.listIcon}>
                      <FontAwesomeIcon icon="briefcase" size={18} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <View style={styles.listContent}>
                    <Text style={styles.listTitle} numberOfLines={1}>{job.title}</Text>
                    <Text style={styles.listSubtitle} numberOfLines={1}>
                      {job.department} • {job.location}
                    </Text>
                    <View style={styles.listFooter}>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) + '20' }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(job.priority) }]}>
                          {job.priority}
                        </Text>
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
                  <FontAwesomeIcon icon="briefcase" size={32} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyTitle}>No Recent Jobs</Text>
                <Text style={styles.emptySubtitle}>Job postings will appear here</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Assignments */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Assignments</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listCard}>
            {stats?.recent?.assignments && stats.recent.assignments.length > 0 ? (
              stats.recent.assignments.slice(0, 3).map((assignment, index) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'ACCEPTED': return '#10B981';
                    case 'PENDING': return '#F59E0B';
                    case 'COMPLETED': return '#3B82F6';
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
                    style={[
                      styles.listItem,
                      index === Math.min(2, stats.recent.assignments.length - 1) && styles.listItemLast
                    ]}>
                    <View style={styles.listIconWrapper}>
                      <LinearGradient
                        colors={[statusColor, statusColor]}
                        style={styles.listIcon}>
                        <FontAwesomeIcon icon={getStatusIcon(assignment.status)} size={18} color="#FFFFFF" />
                      </LinearGradient>
                    </View>
                    <View style={styles.listContent}>
                      <Text style={styles.listTitle} numberOfLines={1}>
                        {assignment.user?.firstName} {assignment.user?.lastName}
                      </Text>
                      <Text style={styles.listSubtitle} numberOfLines={1}>
                        {assignment.job?.title}
                      </Text>
                      <View style={styles.listFooter}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                          <Text style={[styles.statusText, { color: statusColor }]}>
                            {assignment.status}
                          </Text>
                        </View>
                        <Text style={styles.listRate}>₹{assignment.hourlyRate}/hr</Text>
                      </View>
                    </View>
                    <Text style={styles.listTime}>{formatDate(assignment.assignedAt)}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <FontAwesomeIcon icon="list" size={32} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyTitle}>No Recent Assignments</Text>
                <Text style={styles.emptySubtitle}>Assignment updates will appear here</Text>
              </View>
            )}
          </View>
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
    marginTop: 260, // Height of the sticky header + extra space
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
    paddingBottom: 12,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  mainStatsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mainStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    minHeight: 90,
    justifyContent: 'center',
  },
  mainStatContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mainStatText: {
    flex: 1,
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  mainStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  heroSection: {
    paddingBottom: 8,
  },
  heroGradient: {
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroContent: {
    padding: 24,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  firstSection: {
    paddingTop: 30,
    marginTop: 0,
  },
  lastSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  statGradient: {
    borderRadius: 20,
    padding: 20,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statIconRound: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 36,
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    maxWidth: '60%',
    lineHeight: 18,
  },
  percentageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickActionWrapper: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
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
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 13,
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
    fontWeight: '700',
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
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  listRate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  listTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
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
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default HRDashboardScreen;