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
  const { unreadCount } = useNotifications();
  const [data, setData] = useState<AgencyDashboardData | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      } catch (e) {
        setUserProfile(null);
      }

      const res = await ApiService.getAgencyDashboard();
      setData(res);
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
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" translucent={false} />
      <View style={styles.innerContainer}>
        {/* Header */}
        <View style={styles.simpleHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerGreeting}>Hello <Text style={styles.headerRole}>Agency</Text></Text>
              <Text style={styles.headerName}>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" colors={["#6366F1"]} />}>

          <View style={styles.dashboardTitleSection}>
            <Text style={styles.dashboardTitle}>Agency Dashboard</Text>
          </View>

          {/* Top stats (styled like HR) */}
          <View style={styles.mainStatsGrid}>
            <StatCard title="Hospitals Linked" value={data?.hospitals?.total || 0} icon="hospital" />
            <StatCard title="Upcoming Jobs" value={data?.jobs?.upcoming || 0} icon="briefcase" />
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
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity style={styles.quickActionCard} onPress={() => (navigation as any).navigate('AgencyNurses')} activeOpacity={0.85}>
                <View style={[styles.quickIconWrap, { backgroundColor: '#10B98122' }]}>
                  <FontAwesomeIcon icon="user-plus" size={16} color="#10B981" />
                </View>
                <Text style={styles.quickTitle}>Onboard Nurse</Text>
                <Text style={styles.quickSub}>Add nurse to agency</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard} onPress={() => (navigation as any).navigate('AgencyJobs')} activeOpacity={0.85}>
                <View style={[styles.quickIconWrap, { backgroundColor: '#2563EB22' }]}>
                  <FontAwesomeIcon icon="briefcase" size={16} color="#2563EB" />
                </View>
                <Text style={styles.quickTitle}>Agency Jobs</Text>
                <Text style={styles.quickSub}>Browse and assign</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Powered By */}
          <View style={styles.poweredByContainer}>
            <Text style={styles.poweredByText}>Powered by</Text>
            <Image source={require('../../assets/footer_logo.png')} style={styles.companyLogo} resizeMode="contain" />
          </View>
        </ScrollView>

        <HRFooterNavigation activeRoute="Dashboard" scrollY={undefined as any} />
      </View>
    </SafeAreaView>
  );
};

const StatCard = ({ title, value, icon }: { title: string; value: number; icon: string }) => (
  <View style={styles.statCard}>
    <View style={styles.statContainer}>
      <View style={styles.statIconWrapper}>
        <FontAwesomeIcon icon={icon} size={Responsive.iconSize(22)} color="#1C2A3A" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{(value || 0).toLocaleString()}</Text>
        <Text style={styles.statTitle}>{title}</Text>
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
    backgroundColor: '#F3F9FF',
  },
  innerContainer: {
    flex: 1,
    backgroundColor: '#F3F9FF',
  },
  simpleHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 6 : 0,
    paddingHorizontal: 14,
    paddingBottom: 10,
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
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
    marginBottom: 1,
  },
  headerName: {
    fontSize: 18,
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 50,
    // Removed border to avoid outline around notification button
  },
  headerProfileImage: {
    width: 44,
    height: 44,
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280',
  },
  dashboardTitleSection: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 2,
  },
  dashboardTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    letterSpacing: -0.3,
  },
  mainStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 6,
    marginBottom: 0,
  },
  statCard: {
    flex: 1,
    minHeight: 78,
  },
  statContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1C2A3A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1C2A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
    color: '#1C2A3A',
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: '#1C2A3A',
    marginTop: 1,
    letterSpacing: 0.1,
  },
  overviewSection: {
    paddingHorizontal: 14,
    marginTop: 10,
  },
  overviewScroll: {
    marginHorizontal: -14,
  },
  overviewScrollContent: {
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  iconStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconStatItem: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 78,
  },
  iconStatContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  iconStatIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconStatBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#1C2A3A',
    borderRadius: 10,
    minWidth: 24,
    height: 20,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iconStatValue: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  iconStatTitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 13,
    maxWidth: 92,
  },
  quickActionsSection: {
    paddingHorizontal: 14,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    marginBottom: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'flex-start',
  },
  quickIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickTitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
  },
  quickSub: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280',
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
  poweredByText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280',
    marginRight: 6,
  },
  companyLogo: {
    height: 12,
    width: 85,
  },
});

export default AgencyDashboardScreen;


