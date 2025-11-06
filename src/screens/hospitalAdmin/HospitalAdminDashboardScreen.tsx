import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, Image, ActivityIndicator, TouchableOpacity, Share, Animated, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '../../utils/icons';
import { Typography } from '../../constants/typography';
import Responsive from '../../utils/responsive';
import { useGlobalStyles } from '../../theme/globalStyles';
import { Colors } from '../../constants/colors';
import { useAppColors } from '../../hooks/useAppColors';
import { useNotifications } from '../../contexts/NotificationContext';
import HospitalAdminApi from '../../services/hospitalAdminApi';
import ApiService from '../../services/api';
import { getFinalApiUrl } from '../../config/api';
import { usePermissions } from '../../hooks/usePermissions';

const HospitalAdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const g = useGlobalStyles();
  const appColors = useAppColors();
  const { unreadCount } = useNotifications();
  const { hasPermission, loading: permissionsLoading, permissions } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [hospital, setHospital] = useState<any>(null);
  const [themes, setThemes] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const overviewScrollRef = React.useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      try {
        const profile = await ApiService.getProfile();
        setUserProfile(profile);
      } catch (profileError) {
        setUserProfile(null);
      }

      const [dashRes, themesRes] = await Promise.all([
        HospitalAdminApi.getDashboard(),
        HospitalAdminApi.getThemes(),
      ]);
      setDashboard(dashRes);
      setHospital((dashRes as any)?.hospital || null);
      setThemes(themesRes);
    } catch (e) {
      setDashboard(null);
      setHospital(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      load();
    });
    return unsubscribe;
  }, [navigation, load]);

  // Debug: Log permissions and checks when ready
  useEffect(() => {
    if (!permissionsLoading) {
      try {
        console.log('[HospitalAdminDashboard] permissions.hospital =', (permissions?.hospital || []).map(p => p.code));
        console.log('[HospitalAdminDashboard] hasPermission(JOB_CREATE) =', hasPermission('JOB_CREATE'));
        console.log('[HospitalAdminDashboard] hasPermission(HOSPITAL_READ) =', hasPermission('HOSPITAL_READ'));
      } catch (e) {
        // no-op
      }
    }
  }, [permissionsLoading, permissions, hasPermission]);

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
     STAT CARD (exact match from HR dashboard)
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
      <View style={[styles.statContainer, { backgroundColor: appColors.accentText }]}>
        <View style={styles.statIconWrapper}>
          <FontAwesomeIcon icon={icon} size={Responsive.iconSize(22)} color="#1C2A3A" />
        </View>
        <View style={styles.statContent}>
          <Text style={[styles.statValue, { color: appColors.textPrimary }]}>{value.toLocaleString()}</Text>
          <Text style={[styles.statTitle, { color: appColors.textPrimary }]}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  /* --------------------------------------------------------------
     IconStatItem (exact match from HR dashboard)
  -------------------------------------------------------------- */
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
     QuickAction (exact match from HR dashboard)
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
        <Animated.View style={[styles.quickActionCard, { backgroundColor: appColors.accentText, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickActionGradient}>
            <FontAwesomeIcon icon={icon} size={Responsive.iconSize(18)} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.quickActionTitle, { color: appColors.textPrimary }]} numberOfLines={2} ellipsizeMode="tail">{title}</Text>
          <Text style={[styles.quickActionSubtitle, { color: appColors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">{subtitle}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  /* --------------------------------------------------------------
     LOADING SCREEN
  -------------------------------------------------------------- */
  if (isLoading) {
    return (
      <SafeAreaView style={g.appBackground}>
        <StatusBar backgroundColor={appColors.background} barStyle={appColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* --------------------------------------------------------------
     MAIN RENDER
  -------------------------------------------------------------- */
  return (
    <SafeAreaView style={g.appBackground}>
      <StatusBar backgroundColor={appColors.background} barStyle={appColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} translucent={false} />

      <View style={[styles.innerContainer, { backgroundColor: appColors.background }]}>
        {/* Simple Header */}
        <View style={[styles.simpleHeader, { backgroundColor: appColors.accentText }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerGreeting, { color: appColors.textSecondary }]}>
                Hello <Text style={[styles.headerRole, { color: appColors.primary }]}>Hospital Admin</Text>
              </Text>
              <Text style={[styles.headerName, { color: appColors.textPrimary }]}>
                {userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() : hospital?.name || 'Hospital'}!
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
                      {userProfile
                        ? (userProfile.firstName || userProfile.lastName || 'H').charAt(0).toUpperCase()
                        : 'H'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

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
            <Text style={[styles.dashboardTitle, { color: appColors.textPrimary }]}>Hospital Admin Dashboard</Text>
          </View>

          {/* Hospital Header Card */}
          {hospital && (
            <View style={[styles.headerCard, { backgroundColor: appColors.accentText }]}>
              <View style={styles.headerRow}>
                {(() => {
                  const candidate = (hospital as any);
                  const logoPath = candidate?.logoUrl || candidate?.logoPath || candidate?.logo || candidate?.assets?.logoUrl || null;
                  // Construct full URL if it's a relative path
                  let logoUri = logoPath as string | null;
                  if (logoUri && !logoUri.startsWith('http')) {
                    const baseUrl = getFinalApiUrl().replace('/api/v1', '');
                    logoUri = logoUri.startsWith('/') 
                      ? `${baseUrl}${logoUri}` 
                      : `${baseUrl}/${logoUri}`;
                  }
                  return logoUri ? (
                    <Image 
                      source={{ uri: logoUri }} 
                      style={styles.logo} 
                      resizeMode="contain"
                      onError={(e) => {
                        console.error('Logo load error:', e);
                      }}
                    />
                  ) : (
                    <View style={styles.logoPlaceholder} />
                  );
                })()}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hospitalName, { color: appColors.textPrimary }]}>{hospital?.name || 'Hospital'}</Text>
                  {!!hospital?.units?.length && (
                    <Text style={[styles.hospitalMeta, { color: appColors.textSecondary }]}>{hospital.units.length} active units</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* MAIN STATS */}
          <View style={styles.mainStatsGrid}>
            <StatCard
              title="Total Jobs"
              value={dashboard?.jobs?.total || 0}
              icon="briefcase"
              onPress={() => (navigation as any).navigate('HospitalAdminJobs')}
            />
            <StatCard
              title="Total Staff"
              value={dashboard?.users?.total || 0}
              icon="users"
              onPress={() => (navigation as any).navigate('HospitalAdminStaff')}
            />
          </View>

          {/* Overview Stats */}
          <View style={styles.overviewSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Overview</Text>
              <TouchableOpacity onPress={scrollToEnd} style={styles.scrollToEndButton}>
                <Text style={styles.viewAllText}>See All</Text>
                <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(14)} color="#6366F1" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={overviewScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              style={styles.overviewScroll}
              contentContainerStyle={styles.overviewScrollContent}>
              <View style={styles.iconStatsRow}>
                <IconStatItem title="Total Jobs" value={dashboard?.jobs?.total || 0} icon="briefcase" iconColor="#3B82F6" onPress={() => (navigation as any).navigate('HospitalAdminJobs')} />
                <IconStatItem title="Active Jobs" value={dashboard?.jobs?.active || 0} icon="play" iconColor="#10B981" />
                <IconStatItem title="Assignments" value={dashboard?.assignments?.total || 0} icon="user-check" iconColor="#8B5CF6" />
                <IconStatItem title="Completed" value={dashboard?.jobs?.completed || 0} icon="check-circle" iconColor="#059669" />
                <IconStatItem title="Total Staff" value={dashboard?.users?.total || 0} icon="users" iconColor="#6366F1" onPress={() => (navigation as any).navigate('HospitalAdminStaff')} />
                <IconStatItem title="Units" value={dashboard?.units || hospital?.units?.length || 0} icon="hospital" iconColor="#7C3AED" />
              </View>
            </ScrollView>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {!permissionsLoading && hasPermission('HOSPITAL_READ') && (
                <QuickAction title="Hospital Details" subtitle="View & edit hospital" icon="hospital" gradient={['#06B6D4', '#0891B2']} onPress={() => (navigation as any).navigate('HospitalAdminHospital')} />
              )}
              {!permissionsLoading && hasPermission('JOB_CREATE') && (
                <QuickAction title="Create Job" subtitle="Post new opening" icon="plus" gradient={['#3B82F6', '#2563EB']} onPress={() => (navigation as any).navigate('CreateJob')} />
              )}
              {!permissionsLoading && hasPermission('HOSPITAL_MANAGE_UNITS') && (
                <QuickAction title="Manage Units" subtitle="Create & edit units" icon="building" gradient={['#F59E0B', '#D97706']} onPress={() => (navigation as any).navigate('HospitalAdminUnits')} />
              )}
              {!permissionsLoading && hasPermission('HOSPITAL_MANAGE_THEMES') && (
                <QuickAction title="Manage Themes" subtitle="Create & edit themes" icon="palette" gradient={['#8B5CF6', '#7C3AED']} onPress={() => (navigation as any).navigate('HospitalAdminThemes')} />
              )}
              {!permissionsLoading && hasPermission('PERMISSION_VIEW') && (
                <QuickAction title="Permissions" subtitle="View & grant permissions" icon="shield-alt" gradient={['#6366F1', '#4F46E5']} onPress={() => (navigation as any).navigate('PermissionManagement')} />
              )}
              {!permissionsLoading && hasPermission('SPECIALIZATION_MANAGE') && (
                <QuickAction title="Specializations" subtitle="Manage specializations" icon="stethoscope" gradient={['#14B8A6', '#0D9488']} onPress={() => (navigation as any).navigate('SpecializationManagement')} />
              )}
              {!permissionsLoading && hasPermission('HOSPITAL_UPDATE') && (
                <QuickAction title="Upload Logo" subtitle="Brand your hospital" icon="image" gradient={['#10B981', '#059669']} onPress={() => (navigation as any).navigate('HospitalAdminUploadLogo')} />
              )}
              {!permissionsLoading && hasPermission('AGENCY_BLACKLIST') && (
                <QuickAction title="Agency Blacklist" subtitle="Manage agencies" icon="ban" gradient={['#EF4444', '#DC2626']} onPress={() => (navigation as any).navigate('AgencyBlacklist')} />
              )}
              {!permissionsLoading && hasPermission('AGENCY_BLACKLIST') && (
                <QuickAction title="Create Agency" subtitle="Register new agency" icon="user-plus" gradient={['#10B981', '#059669']} onPress={() => (navigation as any).navigate('HospitalAdminCreateAgency')} />
              )}
              {!permissionsLoading && hasPermission('AGENCY_BLACKLIST') && (
                <QuickAction title="Onboard Agency" subtitle="Onboard agency to hospital" icon="handshake" gradient={['#3B82F6', '#2563EB']} onPress={() => (navigation as any).navigate('HospitalAdminOnboardAgency')} />
              )}
            </View>
          </View>

          {/* Recent Jobs */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Recent Jobs</Text>
              <TouchableOpacity onPress={() => (navigation as any).navigate('HospitalAdminJobs')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.listCard, { backgroundColor: appColors.accentText }]}>
              {dashboard?.recentJobs && dashboard.recentJobs.length > 0 ? (
                dashboard.recentJobs.slice(0, 3).map((job: any, index: number) => (
                  <TouchableOpacity
                    key={job.id}
                    style={[styles.listItem, index === Math.min(2, dashboard.recentJobs.length - 1) && styles.listItemLast]}
                    onPress={() => (navigation as any).navigate('JobDetails', { jobId: job.id })}
                    activeOpacity={0.7}>
                    <View style={styles.listIconWrapper}>
                      <LinearGradient colors={[appColors.primary, appColors.secondary]} style={styles.listIcon}>
                        <FontAwesomeIcon icon="briefcase" size={Responsive.iconSize(18)} color="#FFFFFF" />
                      </LinearGradient>
                    </View>
                    <View style={styles.listContent}>
                      <Text style={[styles.listTitle, { color: appColors.textPrimary }]} numberOfLines={1}>{job.title || 'Untitled Job'}</Text>
                      <Text style={[styles.listSubtitle, { color: appColors.textSecondary }]} numberOfLines={1}>{job.department || job.location || ''}</Text>
                      {job.priority && (
                        <View style={styles.listFooter}>
                          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) + '20' }]}>
                            <Text style={[styles.priorityText, { color: getPriorityColor(job.priority) }]}>{job.priority}</Text>
                          </View>
                          {job.hourlyRate && (
                            <Text style={[styles.listRate, { color: appColors.textPrimary }]}>₹{job.hourlyRate}/hr</Text>
                          )}
                        </View>
                      )}
                    </View>
                    {job.createdAt && (
                      <Text style={[styles.listTime, { color: appColors.textSecondary }]}>{formatDate(job.createdAt)}</Text>
                    )}
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
          </View>

      </ScrollView>

      {/* Powered By */}
      <View style={styles.poweredByContainer}>
        <Text style={styles.poweredByText}>Powered by</Text>
        <Image source={require('../../assets/footer_logo.png')} style={styles.companyLogo} resizeMode="contain" />
      </View>

      </View>
    </SafeAreaView>
  );
};

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
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  hospitalName: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
  },
  hospitalMeta: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
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
    backgroundColor: '#FFFFFF',
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
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    marginTop: 0,
  },
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
});

export default HospitalAdminDashboardScreen;


