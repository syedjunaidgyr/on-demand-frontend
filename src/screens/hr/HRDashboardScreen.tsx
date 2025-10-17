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

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
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
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await ApiService.getHRDashboard();
      console.log('HR Dashboard Response:', JSON.stringify(response, null, 2));
      
      // Handle nested dashboard response
      const dashboardData = response.dashboard || response;
      const statsData = dashboardData || {
        jobs: { total: 0, active: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0 },
        assignments: { total: 0, pending: 0, accepted: 0, inProgress: 0, completed: 0 },
        staff: { total: 0, doctors: 0, nurses: 0 },
        monthly: { jobs: 0, assignments: 0 },
        recent: { jobs: [], assignments: [] }
      };
      setStats(statsData);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      
      // Handle specific error cases
      if (error.response?.status === 500) {
        console.log('HR Dashboard API returned 500 error - using default data');
      }
      
      // Set default stats on error
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

  // Utility functions for data formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return Colors.error;
      case 'HIGH': return Colors.warning;
      case 'MEDIUM': return Colors.info;
      case 'LOW': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    onPress 
  }: {
    title: string;
    value: number;
    icon: string;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]} 
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.statContent}>
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
            <FontAwesomeIcon icon={icon} size={20} color={color}  />
          </View>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
    </TouchableOpacity>
  );

  const QuickAction = ({ 
    title, 
    subtitle, 
    icon, 
    color, 
    onPress 
  }: {
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionCard}>
        <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
          <FontAwesomeIcon icon={icon} size={20} color={Colors.white}  />
        </View>
        <View style={styles.quickActionContent}>
          <Text style={styles.quickActionTitle}>{title}</Text>
          <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Header */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>HR Dashboard</Text>
              <Text style={styles.headerSubtitle}>Manage your healthcare staffing</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => (navigation as any).navigate('Profile')}>
              <FontAwesomeIcon icon="user" size={24} color={Colors.white}  />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Summary Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Summary</Text>
            <Text style={styles.sectionSubtitle}>Key insights at a glance</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Staff Distribution</Text>
              <Text style={styles.summaryValue}>
                {stats?.staff?.doctors || 0} Doctors • {stats?.staff?.nurses || 0} Nurses
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>This Month</Text>
              <Text style={styles.summaryValue}>
                {stats?.monthly?.jobs || 0} Jobs • {stats?.monthly?.assignments || 0} Assignments
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.sectionSubtitle}>Key metrics and statistics</Text>
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Jobs"
              value={stats?.jobs?.total || 0}
              icon="briefcase"
              color={Colors.primary}
              onPress={() => (navigation as any).navigate('HRJobs')}
            />
            <StatCard
              title="Active Jobs"
              value={stats?.jobs?.active || 0}
              icon="play"
              color={Colors.success}
            />
            <StatCard
              title="Total Staff"
              value={stats?.staff?.total || 0}
              icon="users"
              color={Colors.info}
              onPress={() => (navigation as any).navigate('HRUsers')}
            />
            <StatCard
              title="Total Assignments"
              value={stats?.assignments?.total || 0}
              icon="clipboard-list"
              color={Colors.warning}
            />
            <StatCard
              title="Pending Assignments"
              value={stats?.assignments?.pending || 0}
              icon="clock"
              color={Colors.error}
            />
            <StatCard
              title="Accepted Assignments"
              value={stats?.assignments?.accepted || 0}
              icon="check"
              color={Colors.success}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubtitle}>Common HR tasks and operations</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              title="Create Job"
              subtitle="Post new opening"
              icon="plus"
              color={Colors.primary}
              onPress={() => (navigation as any).navigate('CreateJob')}
            />
            <QuickAction
              title="Manage Jobs"
              subtitle="View & edit jobs"
              icon="briefcase"
              color={Colors.info}
              onPress={() => (navigation as any).navigate('HRJobs')}
            />
            <QuickAction
              title="Staff Management"
              subtitle="Manage users"
              icon="users"
              color={Colors.success}
              onPress={() => (navigation as any).navigate('HRUsers')}
            />
            <QuickAction
              title="Reports"
              subtitle="Analytics & insights"
              icon="chart-bar"
              color={Colors.warning}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Recent Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Jobs</Text>
            <Text style={styles.sectionSubtitle}>Latest job postings</Text>
          </View>
          <View style={styles.activityCard}>
            {stats?.recent?.jobs && stats.recent.jobs.length > 0 ? (
              stats.recent.jobs.slice(0, 3).map((job, index) => (
                <TouchableOpacity 
                  key={job.id} 
                  style={[
                    styles.activityItem, 
                    index === Math.min(2, stats.recent.jobs.length - 1) && { marginBottom: 0, paddingBottom: 0, borderBottomWidth: 0 }
                  ]}
                  onPress={() => (navigation as any).navigate('JobDetails', { jobId: job.id })}
                >
                  <View style={[styles.activityIcon, { backgroundColor: Colors.primary }]}>
                    <FontAwesomeIcon icon="briefcase" size={20} color={Colors.white} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{job.title}</Text>
                    <Text style={styles.activitySubtitle}>
                      {job.department} • {job.location} • ₹{job.hourlyRate}/hr
                    </Text>
                    <Text style={styles.activityTime}>
                      {formatDate(job.createdAt)} • 
                      <Text style={{ color: getPriorityColor(job.priority) }}> {job.priority}</Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: Colors.textSecondary }]}>
                  <FontAwesomeIcon icon="briefcase" size={20} color={Colors.white} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>No Recent Jobs</Text>
                  <Text style={styles.activitySubtitle}>No job postings found</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Recent Assignments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Assignments</Text>
            <Text style={styles.sectionSubtitle}>Latest assignment updates</Text>
          </View>
          <View style={styles.activityCard}>
            {stats?.recent?.assignments && stats.recent.assignments.length > 0 ? (
              stats.recent.assignments.slice(0, 3).map((assignment, index) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'ACCEPTED': return Colors.success;
                    case 'PENDING': return Colors.warning;
                    case 'COMPLETED': return Colors.info;
                    case 'REJECTED': return Colors.error;
                    default: return Colors.textSecondary;
                  }
                };
                
                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case 'ACCEPTED': return 'check';
                    case 'PENDING': return 'clock';
                    case 'COMPLETED': return 'check-circle';
                    case 'REJECTED': return 'times';
                    default: return 'question';
                  }
                };

                return (
                  <View 
                    key={assignment.id} 
                    style={[
                      styles.activityItem, 
                      index === Math.min(2, stats.recent.assignments.length - 1) && { marginBottom: 0, paddingBottom: 0, borderBottomWidth: 0 }
                    ]}
                  >
                    <View style={[styles.activityIcon, { backgroundColor: getStatusColor(assignment.status) }]}>
                      <FontAwesomeIcon icon={getStatusIcon(assignment.status)} size={20} color={Colors.white} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {assignment.user?.firstName} {assignment.user?.lastName} - {assignment.status}
                      </Text>
                      <Text style={styles.activitySubtitle}>
                        {assignment.job?.title} • {assignment.job?.department}
                      </Text>
                      <Text style={styles.activityTime}>
                        ₹{assignment.hourlyRate}/hr • {formatDate(assignment.assignedAt)}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: Colors.textSecondary }]}>
                  <FontAwesomeIcon icon="clipboard-list" size={20} color={Colors.white} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>No Recent Assignments</Text>
                  <Text style={styles.activitySubtitle}>No assignment updates found</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
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
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.white,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Shadow.sm,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  statContent: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  statTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  statValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  quickActionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.md,
    height: 170,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  quickActionContent: {
    alignItems: 'center',
  },
  quickActionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  activitySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default HRDashboardScreen;
