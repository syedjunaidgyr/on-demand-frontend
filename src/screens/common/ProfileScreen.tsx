import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import LinearGradient from 'react-native-linear-gradient';
import GlobalHeader from '../../components/GlobalHeader';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { User } from '../../types';
import ApiService from '../../services/api';
import HospitalAdminApi from '../../services/hospitalAdminApi';
import { useTheme } from '../../contexts/ThemeContext';
import { getFinalApiUrl } from '../../config/api';
import { useAuth } from '../../navigation/AppNavigator';
import Responsive from '../../utils/responsive';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { logout: authLogout } = useAuth();
  const { setTheme, loadAndApplyDefaultTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hospital, setHospital] = useState<any>(null);
  const [themes, setThemes] = useState<any[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(false);
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = Responsive.getScreenWidth() < 375;
  const isLargeScreen = Responsive.getScreenHeight() > 800;
  const isVerySmallScreen = Responsive.getScreenHeight() < 600;

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await ApiService.getProfile();
      setUser(userData);
      if (userData?.role === 'HOSPITAL_ADMIN') {
        try {
          const dash = await HospitalAdminApi.getDashboard();
          setHospital(dash?.hospital || null);
        } catch {}
        try {
          setLoadingThemes(true);
          const res = await HospitalAdminApi.getThemes();
          setThemes(res?.themes || res || []);
        } catch {} finally {
          setLoadingThemes(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call API logout first (this will clear storage even if API fails)
              await ApiService.logout();
              // Then call auth context logout to update UI state
              await authLogout();
              // Navigation will switch to Auth stack via auth state; no manual reset needed
            } catch (error) {
              console.error('Logout error:', error);
              // Even if there's an error, try to logout from auth context; navigator will switch automatically
              await authLogout();
            }
          },
        },
      ]
    );
  };

  const getRoleGradient = (role: string): string[] => {
    switch (role) {
      case 'DOCTOR':
        return ['#3B82F6', '#2563EB'];
      case 'NURSE':
        return ['#10B981', '#059669'];
      case 'HR':
        return ['#8B5CF6', '#7C3AED'];
      case 'ADMIN':
        return ['#EF4444', '#DC2626'];
      default:
        return ['#6366F1', '#4F46E5'];
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DOCTOR':
        return '#3B82F6';
      case 'NURSE':
        return '#10B981';
      case 'HR':
        return '#8B5CF6';
      case 'ADMIN':
        return '#EF4444';
      default:
        return '#6366F1';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DOCTOR':
        return 'user-md';
      case 'NURSE':
        return 'stethoscope';
      case 'HR':
        return 'users';
      case 'ADMIN':
        return 'cog';
      default:
        return 'user';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <FontAwesomeIcon icon="exclamation-triangle" size={Responsive.iconSize(48)} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button and Settings */}
      <GlobalHeader
        title="Profile"
        showBackButton={true}
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}
        backButtonStyle={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#d1d5db' }}
        rightComponent={
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => (navigation as any).navigate('ThemeSettings')}>
              <FontAwesomeIcon icon="palette" size={Responsive.iconSize(20)} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => (navigation as any).navigate('ProfileSettings')}>
              <FontAwesomeIcon icon="cog" size={Responsive.iconSize(20)} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleLogout}>
              <FontAwesomeIcon icon="sign-out-alt" size={Responsive.iconSize(20)} color="#111827" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Hospital badge (logo + name) for Hospital Admins */}
      {hospital && (
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {(() => {
              const c: any = hospital;
              const logoPath = c?.logoUrl || c?.logoPath || c?.logo || c?.assets?.logoUrl || null;
              let logoUri = logoPath as string | null;
              if (logoUri && !logoUri.startsWith('http')) {
                const base = getFinalApiUrl().replace('/api/v1', '');
                logoUri = logoUri.startsWith('/') ? `${base}${logoUri}` : `${base}/${logoUri}`;
              }
              return logoUri ? (
                <Image source={{ uri: logoUri }} style={{ width: 36, height: 36, borderRadius: 6 }} resizeMode="contain" />
              ) : (
                <View style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: '#EEF2FF' }} />
              );
            })()}
            <Text style={{ fontSize: 16, fontFamily: Typography.fontFamily.bold, color: '#111827' }} numberOfLines={1}>
              {hospital?.name || 'Hospital'}
            </Text>
          </View>
        </View>
      )}

      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoCard}>
            <InfoItem 
              icon="envelope" 
              iconColor="#3B82F6"
              label="Email" 
              value={user.email} 
            />
            <InfoItem 
              icon="phone" 
              iconColor="#10B981"
              label="Phone" 
              value={user.phone} 
            />
            <InfoItem 
              icon="building" 
              iconColor="#8B5CF6"
              label="Department" 
              value={user.department} 
            />
            <InfoItem 
              icon="map-marker-alt" 
              iconColor="#F59E0B"
              label="Location" 
              value={user.location}
              isLast={!user.specialization && !user.licenseNumber}
            />
            {user.specialization && (
              <InfoItem 
                icon="stethoscope" 
                iconColor="#EC4899"
                label="Specialization" 
                value={user.specialization}
                isLast={!user.licenseNumber}
              />
            )}
            {user.licenseNumber && (
              <InfoItem 
                icon="id-card" 
                iconColor="#06B6D4"
                label="License Number" 
                value={user.licenseNumber}
                isLast
              />
            )}
          </View>
        </View>

        {/* Theme quick apply (Hospital Admin) */}
        {hospital && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Theme</Text>
            {loadingThemes ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : themes && themes.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 6 }}>
                {/* App Default Theme tile */}
                <View key="__app_default__" style={{ marginRight: 12, alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={async()=>{
                      try {
                        // Apply hardcoded app default
                        setTheme({
                          name: 'Default',
                          primaryColor: '#1C2A3A',
                          secondaryColor: '#3B82F6',
                          backgroundColor: '#F3F9FF',
                          textColor: '#111827',
                          accentTextColor: '#FFFFFF',
                        });
                        // Persist as user preference if supported
                        try { await ApiService.updateUserTheme('default'); } catch {}
                        Alert.alert('Success','Default app theme applied');
                      } catch (e:any) {
                        Alert.alert('Error', e?.response?.data?.message||e?.message||'Failed to apply default theme');
                      }
                    }}
                    style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: '#1C2A3A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
                    activeOpacity={0.8}
                  >
                    <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#3B82F6' }} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }} numberOfLines={1}>Default</Text>
                </View>
                {themes.map((t: any) => (
                  <View key={String(t.id || t.name)} style={{ marginRight: 12, alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => setTheme({ name: t.name, primaryColor: t.primaryColor, secondaryColor: t.secondaryColor, backgroundColor: t.backgroundColor, textColor: t.textColor, accentTextColor: t.accentTextColor })}
                      style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: t.primaryColor || '#3B82F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
                      activeOpacity={0.8}
                    >
                      <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: t.secondaryColor || '#2563EB' }} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }} numberOfLines={1}>{t.name}</Text>
                    <TouchableOpacity onPress={async()=>{ try{ await ApiService.updateUserTheme(String(t.id || t.name)); setTheme({ name: t.name, primaryColor: t.primaryColor, secondaryColor: t.secondaryColor, backgroundColor: t.backgroundColor, textColor: t.textColor, accentTextColor: t.accentTextColor }); Alert.alert('Success','Theme applied to your profile'); }catch(e:any){ Alert.alert('Error', e?.response?.data?.message||e?.message||'Failed to apply theme'); } }}>
                      <Text style={{ fontSize: 12, color: '#111827', marginTop: 2 }}>Use this</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async()=>{ try{ await HospitalAdminApi.setDefaultTheme(t.id || t.name); await loadAndApplyDefaultTheme(); Alert.alert('Success','Default theme set'); }catch(e:any){ Alert.alert('Error', e?.response?.data?.message||e?.message||'Failed'); } }}>
                      <Text style={{ fontSize: 12, color: '#6366F1', marginTop: 4 }}>Set default</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={{ fontSize: 14, color: '#6B7280' }}>No themes available</Text>
            )}
          </View>
        )}

        {/* Emergency Contact */}
        <View style={[styles.section, { marginTop: -4 }]}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          <View style={styles.infoCard}>
            <InfoItem 
              icon="user" 
              iconColor="#EF4444"
              label="Name" 
              value={user.emergencyContact?.name || 'Not provided'} 
            />
            <InfoItem 
              icon="phone" 
              iconColor="#10B981"
              label="Phone" 
              value={user.emergencyContact?.phone || 'Not provided'} 
            />
            <InfoItem 
              icon="users" 
              iconColor="#8B5CF6"
              label="Relationship" 
              value={user.emergencyContact?.relationship || 'Not provided'}
              isLast
            />
          </View>
        </View>

        {/* Address */}
        <View style={[styles.section, { marginTop: -4, marginBottom: 0 }]}>
          <Text style={styles.sectionTitle}>Address</Text>
          
          <View style={styles.infoCard}>
            <InfoItem 
              icon="home" 
              iconColor="#F59E0B"
              label="Street" 
              value={user.address?.street || 'Not provided'} 
            />
            <InfoItem 
              icon="building" 
              iconColor="#3B82F6"
              label="City" 
              value={user.address?.city || 'Not provided'} 
            />
            <InfoItem 
              icon="map-marker-alt" 
              iconColor="#8B5CF6"
              label="State" 
              value={user.address?.state || 'Not provided'} 
            />
            <InfoItem 
              icon="map-marker-alt" 
              iconColor="#06B6D4"
              label="ZIP Code" 
              value={user.address?.zipCode || 'Not provided'}
              isLast
            />
          </View>
        </View>

        {/* Powered By Section */}
        <View style={styles.poweredByContainer}>
          <Text style={styles.poweredByText}>Powered by</Text>
          <Image
            source={require('../../assets/footer_logo.png')}
            style={styles.companyLogo}
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// InfoItem Component
const InfoItem = ({ 
  icon, 
  iconColor, 
  label, 
  value, 
  isLast = false 
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  isLast?: boolean;
}) => (
  <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
    <View style={styles.infoIconContainer}>
      <FontAwesomeIcon icon={icon} size={Responsive.iconSize(18)} color="#1C2A3A" />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    // Ensure it fits all screen sizes
    minHeight: Dimensions.get('window').height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    color: '#EF4444',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfoSection: {
    backgroundColor: '#1C2A3A',
    paddingTop: 0,
    paddingBottom: 10,
    marginTop: -20,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
    marginTop: 10,
  },
  avatarCircle: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1C2A3A',
    // Responsive size for different screen sizes
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoImage: {
    // Responsive size for different screen sizes
    width: 90,
    height: 90,
  },
  userName: {
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    // Responsive font size for different screen sizes
    fontSize: 22,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  roleText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    flex: 1,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    // Ensure proper scrolling on all devices
    minHeight: Dimensions.get('window').height * 0.6,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  infoRowLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827', // Changed to text color
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280', // Changed to label color
    lineHeight: 20,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Typography.fontFamily.medium,
    color: '#111827',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 80,
  },
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    marginTop: 4,
  },
  poweredByText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280',
    marginRight: -25,
  },
  companyLogo: {
    height: 15,
    width: 95,
  },
});

export default ProfileScreen;
