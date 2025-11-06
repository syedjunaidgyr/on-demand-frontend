import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import { Typography } from '../../constants/typography';
import { Colors } from '../../constants/colors';
import Responsive from '../../utils/responsive';
import { useGlobalStyles } from '../../theme/globalStyles';
import { useAppColors } from '../../hooks/useAppColors';
import HRFooterNavigation from '../../components/HRFooterNavigation';
import ApiService from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';

interface AgencyDashboardData {
  hospitals: { total: number; items: any[] };
  pool: { approved: number; pending: number; revoked: number };
  assignments: { active: number; completed30Days: number };
  jobs: { upcoming: number };
  blacklist: { blacklistedHospitals: number };
}

const AgencyDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const g = useGlobalStyles();
  const appColors = useAppColors();
  const { unreadCount } = useNotifications();
  const [data, setData] = useState<AgencyDashboardData | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [recentNurses, setRecentNurses] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      // Load profile for header name
      try {
        const profile = await ApiService.getProfile();
        setUserProfile(profile);
        // Fetch nurses (pool and list)
        try {
          const nursesRes = await ApiService.getAgencyNurses(profile?.id || '');
          const nurses = nursesRes?.nurses || [];
          setRecentNurses(nurses.slice(0, 5));
        } catch {}
      } catch (e) {
        setUserProfile(null);
      }

      const res = await ApiService.getAgencyDashboard();
      setData(res);

      // Fetch recent jobs (agency-visible jobs)
      try {
        const jobsRes: any = await ApiService.getAllJobs({ page: 1, limit: 10, requiredRole: 'AGENCY' });
        const jobs = jobsRes?.jobs || jobsRes?.data || [];
        setRecentJobs(jobs.slice(0, 5));
      } catch {}
    } catch (e) {
      setData({
        hospitals: { total: 0, items: [] },
        pool: { approved: 0, pending: 0, revoked: 0 },
        assignments: { active: 0, completed30Days: 0 },
        jobs: { upcoming: 0 },
        blacklist: { blacklistedHospitals: 0 },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={g.appBackground}>
        <StatusBar backgroundColor={appColors.background} barStyle={appColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text style={[styles.loadingText, { color: appColors.textSecondary }]}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={g.appBackground}>
      <StatusBar backgroundColor={appColors.background} barStyle={appColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} translucent={false} />
      <View style={[styles.innerContainer, { backgroundColor: appColors.background }]}>
        {/* Header */}
        <View style={[styles.simpleHeader, { backgroundColor: appColors.accentText }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerGreeting, { color: appColors.textSecondary }]}>
                Hello <Text style={[styles.headerRole, { color: appColors.primary }]}>Agency</Text>
              </Text>
              <Text style={[styles.headerName, { color: appColors.textPrimary }]}>
                {userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || 'Welcome back!' : 'Welcome back!'}
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
                  <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.headerProfileGradient}>
                    <Text style={styles.headerProfileInitials}>
                      {(userProfile ? (userProfile.firstName || userProfile.lastName || 'U') : 'U').charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appColors.primary} colors={[appColors.primary]} />}>

          <View style={styles.dashboardTitleSection}>
            <Text style={[styles.dashboardTitle, { color: appColors.textPrimary }]}>Agency Dashboard</Text>
          </View>

          {/* Top stats (styled like HR) */}
          <View style={styles.mainStatsGrid}>
            <StatCard title="Hospitals Linked" value={data?.hospitals?.total || 0} icon="hospital" appColors={appColors} />
            <StatCard title="Upcoming Jobs" value={data?.jobs?.upcoming || 0} icon="briefcase" appColors={appColors} />
          </View>

          {/* Overview row */}
          <View style={styles.overviewSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.overviewScroll}
              contentContainerStyle={styles.overviewScrollContent}
            >
              <View style={styles.iconStatsRow}>
                <IconStatItem title="Nurse Approved" value={data?.pool?.approved || 0} icon="user-check" iconColor="#10B981" />
                <IconStatItem title="Nurse Pending" value={data?.pool?.pending || 0} icon="clock" iconColor="#F59E0B" />
                <IconStatItem title="Nurse Revoked" value={data?.pool?.revoked || 0} icon="user-times" iconColor="#EF4444" />
                <IconStatItem title="Active Assignments" value={data?.assignments?.active || 0} icon="list" iconColor="#3B82F6" />
                <IconStatItem title="Completed (30d)" value={data?.assignments?.completed30Days || 0} icon="check-circle" iconColor="#059669" />
                <IconStatItem title="Blacklisted Hospitals" value={data?.blacklist?.blacklistedHospitals || 0} icon="exclamation-triangle" iconColor="#DC2626" />
              </View>
            </ScrollView>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: appColors.accentText }]} onPress={() => (navigation as any).navigate('AgencyNurses')} activeOpacity={0.85}>
                <View style={[styles.quickIconWrap, { backgroundColor: '#10B98122' }]}>
                  <FontAwesomeIcon icon="user-plus" size={16} color="#10B981" />
                </View>
                <Text style={[styles.quickTitle, { color: appColors.textPrimary }]}>Onboard Nurse</Text>
                <Text style={[styles.quickSub, { color: appColors.textSecondary }]}>Add nurse to agency</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: appColors.accentText }]} onPress={() => (navigation as any).navigate('AgencyJobs')} activeOpacity={0.85}>
                <View style={[styles.quickIconWrap, { backgroundColor: appColors.primary + '22' }]}>
                  <FontAwesomeIcon icon="briefcase" size={16} color={appColors.primary} />
                </View>
                <Text style={[styles.quickTitle, { color: appColors.textPrimary }]}>Jobs</Text>
                <Text style={[styles.quickSub, { color: appColors.textSecondary }]}>Browse and assign</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Jobs */}
          <View style={styles.listSection}>
            <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Recent Jobs</Text>
            <View style={[styles.listCard, { backgroundColor: appColors.accentText }]}>
              {recentJobs.length === 0 ? (
                <View style={styles.emptyRow}>
                  <FontAwesomeIcon icon="briefcase" size={14} color={appColors.textSecondary} />
                  <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No jobs found</Text>
                </View>
              ) : (
                recentJobs.map((j: any) => {
                  const date = j?.startDate ? new Date(j.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
                  return (
                    <TouchableOpacity key={`job-${j.id}`} style={styles.row} activeOpacity={0.8} onPress={() => (navigation as any).navigate('AgencyJobs')}>
                      <View style={styles.rowLeft}>
                        <View style={[styles.rowIcon, { backgroundColor: appColors.primary + '15' }]}>
                          <FontAwesomeIcon icon="briefcase" size={14} color={appColors.primary} />
                        </View>
                        <View style={styles.rowTextWrap}>
                          <Text style={[styles.rowTitle, { color: appColors.textPrimary }]} numberOfLines={1}>{j.title || '—'}</Text>
                          <Text style={[styles.rowSub, { color: appColors.textSecondary }]} numberOfLines={1}>{j.location || '—'} · {date}</Text>
                        </View>
                      </View>
                      <Text style={[styles.badge, { backgroundColor: appColors.textPrimary, color: appColors.accentText }]}>{(j.status || '').toString().replace('_',' ')}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>

          {/* Recent Nurses */}
          <View style={styles.listSection}>
            <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Recent Nurses</Text>
            <View style={[styles.listCard, { backgroundColor: appColors.accentText }]}>
              {recentNurses.length === 0 ? (
                <View style={styles.emptyRow}>
                  <FontAwesomeIcon icon="users" size={14} color={appColors.textSecondary} />
                  <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No nurses found</Text>
                </View>
              ) : (
                recentNurses.map((n: any) => (
                  <TouchableOpacity key={`n-${n.id}`} style={styles.row} activeOpacity={0.8} onPress={() => (navigation as any).navigate('AgencyNurses')}>
                    <View style={styles.rowLeft}>
                      <View style={[styles.rowIcon, { backgroundColor: '#10B98115' }]}>
                        <FontAwesomeIcon icon="user-nurse" size={14} color="#10B981" />
                      </View>
                      <View style={styles.rowTextWrap}>
                        <Text style={[styles.rowTitle, { color: appColors.textPrimary }]} numberOfLines={1}>{`${n.firstName || ''} ${n.lastName || ''}`.trim() || '—'}</Text>
                        <Text style={[styles.rowSub, { color: appColors.textSecondary }]} numberOfLines={1}>{n.email || '—'}</Text>
                      </View>
                    </View>
                    <Text style={[styles.badge, { backgroundColor: appColors.background, color: appColors.textPrimary }]}>{(n.role || 'NURSE')}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          {/* Powered By */}
          <View style={styles.poweredByContainer}>
            <Text style={styles.poweredByText}>Powered by</Text>
            <Image source={require('../../assets/footer_logo.png')} style={styles.companyLogo} resizeMode="contain" />
          </View>
        </ScrollView>

        <HRFooterNavigation activeRoute="Dashboard" scrollY={undefined as any} isLoading={isLoading} />
      </View>
    </SafeAreaView>
  );
};

const StatCard = ({ title, value, icon, appColors }: { title: string; value: number; icon: string; appColors: any }) => (
  <View style={styles.statCard}>
    <View style={[styles.statContainer, { backgroundColor: appColors.accentText }]}>
      <View style={styles.statIconWrapper}>
        <FontAwesomeIcon icon={icon} size={Responsive.iconSize(22)} color={appColors.textPrimary} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: appColors.textPrimary }]}>{(value || 0).toLocaleString()}</Text>
        <Text style={[styles.statTitle, { color: appColors.textPrimary }]}>{title}</Text>
      </View>
    </View>
  </View>
);

const IconStatItem = ({ title, value, icon, iconColor = '#3B82F6' }: { title: string; value: number; icon: string; iconColor?: string }) => (
  <View style={styles.iconStatItem}>
    <View style={styles.iconStatContainer}>
      <View style={[styles.iconStatIconWrapper, { backgroundColor: iconColor + '15' }]}>
        <FontAwesomeIcon icon={icon} size={Responsive.iconSize(20)} color={iconColor} />
      </View>
      <View style={styles.iconStatBadge}>
        <Text style={styles.iconStatValue}>{(value || 0).toLocaleString()}</Text>
      </View>
    </View>
    <Text style={styles.iconStatTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  simpleHeader: {
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
  },
  headerGreeting: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: 2,
  },
  headerName: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
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
  headerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 22,
    overflow: 'hidden',
    marginLeft: 8,
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
  simpleNotificationButton: {
    width: 44,
    height: 44,
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
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
  },
  dashboardTitleSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dashboardTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
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
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  overviewSection: {
    paddingHorizontal: 20,
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
    textAlign: 'center',
    lineHeight: 15,
    maxWidth: 80,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 20,
    padding: 24,
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'flex-start',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  quickIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: 1,
    letterSpacing: -0.2,
  },
  quickSub: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 2,
  },
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    marginTop: 6,
    paddingHorizontal: 14,
  },
  listSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  listCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 4,
  },
  rowSub: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 0,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    overflow: 'hidden',
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
  },
  poweredByText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    marginRight: 6,
  },
  companyLogo: {
    height: 12,
    width: 85,
  },
});

export default AgencyDashboardScreen;


