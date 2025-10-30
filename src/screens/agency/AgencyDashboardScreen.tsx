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
            <View style={styles.iconStatsRow}>
              <IconStatItem title="Nurse Approved" value={data?.pool?.approved || 0} icon="user-check" iconColor="#10B981" />
              <IconStatItem title="Nurse Pending" value={data?.pool?.pending || 0} icon="clock" iconColor="#F59E0B" />
              <IconStatItem title="Nurse Revoked" value={data?.pool?.revoked || 0} icon="user-times" iconColor="#EF4444" />
              <IconStatItem title="Active Assignments" value={data?.assignments?.active || 0} icon="list" iconColor="#3B82F6" />
              <IconStatItem title="Completed (30d)" value={data?.assignments?.completed30Days || 0} icon="check-circle" iconColor="#059669" />
              <IconStatItem title="Blacklisted Hospitals" value={data?.blacklist?.blacklistedHospitals || 0} icon="exclamation-triangle" iconColor="#DC2626" />
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
        <FontAwesomeIcon icon={icon} size={Responsive.iconSize(26)} color={iconColor} />
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
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dashboardTitle: {
    fontSize: 22,
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
    borderColor: '#1C2A3A',
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
    borderWidth: 1,
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
    marginTop: 16,
  },
  iconStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconStatItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 95,
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
  },
  iconStatValue: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  iconStatTitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 15,
    maxWidth: 100,
  },
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 10,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  poweredByText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280',
    marginRight: 8,
  },
  companyLogo: {
    height: 15,
    width: 95,
  },
});

export default AgencyDashboardScreen;


