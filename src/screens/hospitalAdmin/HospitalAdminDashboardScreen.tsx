import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, Image, ActivityIndicator, TouchableOpacity, Share, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '../../utils/icons';
import { Typography } from '../../constants/typography';
import Responsive from '../../utils/responsive';
import HRFooterNavigation from '../../components/HRFooterNavigation';
import { Colors } from '../../constants/colors';
import { useAppColors } from '../../hooks/useAppColors';
import { useNotifications } from '../../contexts/NotificationContext';
import HospitalAdminApi from '../../services/hospitalAdminApi';

const HospitalAdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const appColors = useAppColors();
  const { unreadCount } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [hospital, setHospital] = useState<any>(null);
  const [themes, setThemes] = useState<any>(null);
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dashRes, hospRes, themesRes] = await Promise.all([
        HospitalAdminApi.getDashboard(),
        HospitalAdminApi.getHospitalDetails(),
        HospitalAdminApi.getThemes(),
      ]);
      setDashboard(dashRes);
      setHospital(hospRes);
      setThemes(themesRes);
    } catch (e) {
      setDashboard(null);
      setHospital(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <ScrollView
        style={styles.scrollableContent}
        contentContainerStyle={[styles.content, { backgroundColor: appColors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
      {/* Simple Header (HR-style) */}
      <View style={styles.simpleHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>Hello <Text style={styles.headerRole}>Hospital Admin</Text></Text>
            <Text style={styles.headerName}>{hospital?.name || 'Hospital'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.simpleNotificationButton}
              onPress={() => (navigation as any).navigate('Notifications')}>
              <FontAwesomeIcon icon="bell" size={Responsive.iconSize(18)} color="#F59E0B" />
              {unreadCount > 0 && (
                <View style={styles.simpleNotificationBadge}>
                  <Text style={styles.simpleNotificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Hospital Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          {hospital?.logoUrl ? (
            <Image source={{ uri: hospital.logoUrl }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={styles.logoPlaceholder} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.hospitalName}>{hospital?.name || 'Hospital'}</Text>
            {!!hospital?.units?.length && (
              <Text style={styles.hospitalMeta}>{hospital.units.length} active units</Text>
            )}
          </View>
        </View>
      </View>
      {/* Quick Actions (match HR style) */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionWrapper} activeOpacity={0.9} onPress={() => (navigation as any).navigate('CreateJob')}>
            <View style={styles.quickActionCard}>
              <LinearGradient colors={["#3B82F6", "#2563EB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickActionGradient}>
                <FontAwesomeIcon icon="plus" size={Responsive.iconSize(22)} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickActionTitle}>Create Job</Text>
              <Text style={styles.quickActionSubtitle}>Post new opening</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionWrapper} activeOpacity={0.9} onPress={() => (navigation as any).navigate('HospitalAdminUploadLogo')}>
            <View style={styles.quickActionCard}>
              <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickActionGradient}>
                <FontAwesomeIcon icon="image" size={Responsive.iconSize(22)} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickActionTitle}>Upload Logo</Text>
              <Text style={styles.quickActionSubtitle}>Brand your hospital</Text>
            </View>
          </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionWrapper} activeOpacity={0.9} onPress={() => (navigation as any).navigate('HospitalAdminThemes')}>
                <View style={styles.quickActionCard}>
                  <LinearGradient colors={["#8B5CF6", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickActionGradient}>
                    <FontAwesomeIcon icon="palette" size={Responsive.iconSize(22)} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.quickActionTitle}>Manage Themes</Text>
                  <Text style={styles.quickActionSubtitle}>Colors & branding</Text>
                </View>
              </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <Text style={styles.subtitle}>Loading...</Text>
      ) : (
        <View>
          {/* MAIN STATS (2-column square boxes) */}
          <View style={styles.mainStatsGrid}>
            <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={() => (navigation as any).navigate('HospitalAdminJobs')}>
              <View style={styles.statContainer}>
                <View style={styles.statIconWrapper}>
                  <FontAwesomeIcon icon="briefcase" size={Responsive.iconSize(22)} color="#1C2A3A" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{(dashboard?.jobs?.total ?? 0).toLocaleString()}</Text>
                  <Text style={styles.statTitle}>Total Jobs</Text>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.statCard}>
              <View style={styles.statContainer}>
                <View style={styles.statIconWrapper}>
                  <FontAwesomeIcon icon="play" size={Responsive.iconSize(22)} color="#1C2A3A" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{(dashboard?.jobs?.active ?? 0).toLocaleString()}</Text>
                  <Text style={styles.statTitle}>Active Jobs</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={() => (navigation as any).navigate('HospitalAdminStaff')}>
              <View style={styles.statContainer}>
                <View style={styles.statIconWrapper}>
                  <FontAwesomeIcon icon="users" size={Responsive.iconSize(22)} color="#1C2A3A" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{(dashboard?.users?.total ?? 0).toLocaleString()}</Text>
                  <Text style={styles.statTitle}>Total Staff</Text>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.statCard}>
              <View style={styles.statContainer}>
                <View style={styles.statIconWrapper}>
                  <FontAwesomeIcon icon="hospital" size={Responsive.iconSize(22)} color="#1C2A3A" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{(dashboard?.units ?? hospital?.units?.length ?? 0).toLocaleString()}</Text>
                  <Text style={styles.statTitle}>Units</Text>
                </View>
              </View>
            </View>
          </View>

          {/* OVERVIEW ICON STATS (floating numbers) */}
          <View style={styles.overviewSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Overview</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.overviewScroll} contentContainerStyle={styles.overviewScrollContent}>
              <View style={styles.iconStatsRow}>
                <TouchableOpacity style={styles.iconStatItem} activeOpacity={0.7} onPress={() => (navigation as any).navigate('HospitalAdminJobs')}>
                  <View style={styles.iconStatContainer}>
                    <View style={[styles.iconStatIconWrapper, { backgroundColor: '#3B82F615' }]}>
                      <FontAwesomeIcon icon="briefcase" size={Responsive.iconSize(22)} color="#3B82F6" />
                    </View>
                    <View style={styles.iconStatBadge}><Text style={styles.iconStatValue}>{(dashboard?.jobs?.total ?? 0).toLocaleString()}</Text></View>
                  </View>
                  <Text style={styles.iconStatTitle}>Total Jobs</Text>
                </TouchableOpacity>

                <View style={styles.iconStatItem}>
                  <View style={styles.iconStatContainer}>
                    <View style={[styles.iconStatIconWrapper, { backgroundColor: '#10B98115' }]}>
                      <FontAwesomeIcon icon="play" size={Responsive.iconSize(22)} color="#10B981" />
                    </View>
                    <View style={styles.iconStatBadge}><Text style={styles.iconStatValue}>{(dashboard?.jobs?.active ?? 0).toLocaleString()}</Text></View>
                  </View>
                  <Text style={styles.iconStatTitle}>Active Jobs</Text>
                </View>

                <View style={styles.iconStatItem}>
                  <View style={styles.iconStatContainer}>
                    <View style={[styles.iconStatIconWrapper, { backgroundColor: '#8B5CF615' }]}>
                      <FontAwesomeIcon icon="user-check" size={Responsive.iconSize(22)} color="#8B5CF6" />
                    </View>
                    <View style={styles.iconStatBadge}><Text style={styles.iconStatValue}>{(dashboard?.assignments?.total ?? 0).toLocaleString()}</Text></View>
                  </View>
                  <Text style={styles.iconStatTitle}>Assignments</Text>
                </View>

                <View style={styles.iconStatItem}>
                  <View style={styles.iconStatContainer}>
                    <View style={[styles.iconStatIconWrapper, { backgroundColor: '#05966915' }]}>
                      <FontAwesomeIcon icon="check-circle" size={Responsive.iconSize(22)} color="#059669" />
                    </View>
                    <View style={styles.iconStatBadge}><Text style={styles.iconStatValue}>{(dashboard?.jobs?.completed ?? 0).toLocaleString()}</Text></View>
                  </View>
                  <Text style={styles.iconStatTitle}>Completed</Text>
                </View>

                <View style={styles.iconStatItem}>
                  <View style={styles.iconStatContainer}>
                    <View style={[styles.iconStatIconWrapper, { backgroundColor: '#7C3AED15' }]}>
                      <FontAwesomeIcon icon="hospital" size={Responsive.iconSize(22)} color="#7C3AED" />
                    </View>
                    <View style={styles.iconStatBadge}><Text style={styles.iconStatValue}>{(dashboard?.units ?? hospital?.units?.length ?? 0).toLocaleString()}</Text></View>
                  </View>
                  <Text style={styles.iconStatTitle}>Units</Text>
                </View>
              </View>
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Jobs</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => (navigation as any).navigate('HospitalAdminThemes')}>
                  <Text style={styles.viewAllText}>Manage Themes</Text>
                </TouchableOpacity>
                <View style={{ width: 12 }} />
                <TouchableOpacity onPress={() => (navigation as any).navigate('HRJobs')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
            </View>
            {(dashboard?.recentJobs || []).slice(0, 10).map((job: any, index: number) => (
              <TouchableOpacity
                key={job.id || index}
                style={styles.listItem}
                onPress={() => (navigation as any).navigate('JobDetails', { jobId: job.id })}
                activeOpacity={0.7}
              >
                <Text style={styles.listTitle}>{job.title || 'Untitled Job'}</Text>
                <Text style={styles.listSubtitle}>{job.department || job.location || ''}</Text>
              </TouchableOpacity>
            ))}
            {(!dashboard?.recentJobs || dashboard?.recentJobs?.length === 0) && (
              <Text style={styles.subtitle}>No recent jobs</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Themes</Text>
            {!themes ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <View style={styles.themeList}>
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={async () => {
                      try {
                        await HospitalAdminApi.createTheme({
                          id: 'brand_purple',
                          name: 'Brand Purple',
                          primaryColor: '#7c3aed',
                          secondaryColor: '#a78bfa',
                          backgroundColor: '#faf5ff',
                          textColor: '#4c1d95',
                          accentTextColor: '#ffffff',
                        });
                        await HospitalAdminApi.setDefaultTheme('brand_purple');
                        await load();
                      } catch {}
                    }}
                  >
                    <Text style={styles.actionButtonText}>Create Theme</Text>
                  </TouchableOpacity>
                </View>
                {(themes?.themes || themes || []).map((t: any) => (
                  <View key={t.id || t.name} style={styles.themeItem}>
                    <View style={[styles.themeDot, { backgroundColor: t.primaryColor || t.color || Colors.primary }]} />
                    <Text style={styles.listTitle}>{t.name || 'Theme'}</Text>
                    {themes?.current && (themes.current.id === t.id || themes.current === t.name) && (
                      <Text style={styles.currentTag}>Current</Text>
                    )}
                    <TouchableOpacity
                      style={styles.shareCurl}
                      onPress={async () => {
                        const base = (require('../../config/api') as any).API_BASE_URL || '';
                        const curl = `curl -X PUT \"${base}/hospital-admin/themes/default/${t.id || t.name}\" \\\n  -H \"Authorization: Bearer <HOSPITAL_ADMIN_TOKEN>\"`;
                        try { await Share.share({ message: curl }); } catch {}
                      }}
                    >
                      <Text style={styles.shareCurlText}>Share cURL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.applyTheme}
                      onPress={async () => {
                        try {
                          await HospitalAdminApi.setDefaultTheme(t.id || t.name);
                          await load();
                        } catch {}
                      }}
                    >
                      <Text style={styles.applyThemeText}>Set Default</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteTheme}
                      onPress={async () => {
                        try {
                          const isCurrent = !!(themes?.current && (themes.current.id === t.id || themes.current === t.name));
                          if (isCurrent) {
                            // Prevent deleting current default; require user to change default first
                            return;
                          }
                          await HospitalAdminApi.deleteTheme(t.id || t.name);
                          await load();
                        } catch {}
                      }}
                    >
                      <Text style={styles.deleteThemeText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {(!themes?.themes || themes?.themes?.length === 0) && (
                  <Text style={styles.subtitle}>No themes</Text>
                )}
              </View>
            )}
          </View>
        </View>
      )}
      </ScrollView>
      <HRFooterNavigation activeRoute="Dashboard" scrollY={scrollY} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  simpleHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
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
  headerLeft: { flex: 1 },
  headerRole: { fontSize: 16, fontFamily: Typography.fontFamily.medium, color: '#6366F1' },
  headerGreeting: { fontSize: 16, fontFamily: Typography.fontFamily.regular, color: '#6B7280', marginBottom: 2 },
  headerName: { fontSize: 24, fontFamily: Typography.fontFamily.bold, color: '#111827' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  simpleNotificationButton: { width: 40, height: 40, borderRadius: 22, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  simpleNotificationBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#FFFFFF' },
  simpleNotificationBadgeText: { color: '#FFFFFF', fontSize: 9, fontFamily: Typography.fontFamily.bold },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  scrollableContent: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cards: {
    gap: 12,
  },
  mainStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  statCard: {
    width: '48%',
    flexBasis: '48%',
    flexGrow: 0,
    minHeight: 100,
    marginBottom: 8,
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
    marginTop: 2,
  },
  overviewScroll: {
    marginHorizontal: -4,
  },
  overviewScrollContent: {
    paddingHorizontal: 2,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    color: '#6366F1',
  },
  quickActionsSection: {
    marginTop: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickActionWrapper: {
    width: '48%',
    marginBottom: 8,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    marginBottom: 1,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280',
    textAlign: 'center',
  },
  headerCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  hospitalMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  cardDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  listSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  themeList: {
    gap: 8,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  themeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  currentTag: {
    marginLeft: 'auto',
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  shareCurl: {
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  shareCurlText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  applyTheme: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  applyThemeText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    flex: 0,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteTheme: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteThemeText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default HospitalAdminDashboardScreen;


