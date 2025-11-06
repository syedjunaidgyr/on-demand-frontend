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
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TransitionPresets } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '../../utils/icons';
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

const Tab = createBottomTabNavigator();

// Overview Tab Component
const OverviewTab: React.FC<{ user: User; hospital: any }> = ({ user, hospital }) => {
  const { loadingThemes, themes, setTheme, loadAndApplyDefaultTheme } = useTheme();
  const [themesState, setThemesState] = useState<any[]>([]);
  const [loadingThemesState, setLoadingThemesState] = useState(false);

  useEffect(() => {
    if (hospital) {
      loadThemes();
    }
  }, [hospital]);

  const loadThemes = async () => {
    try {
      setLoadingThemesState(true);
      const res = await HospitalAdminApi.getThemes();
      setThemesState(res?.themes || res || []);
    } catch {} finally {
      setLoadingThemesState(false);
    }
  };

  return (
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
          {loadingThemesState ? (
            <ActivityIndicator size="small" color="#6366F1" />
          ) : themesState && themesState.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 6 }}>
              <View key="__app_default__" style={{ marginRight: 12, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={async()=>{
                    try {
                      setTheme({
                        name: 'Default',
                        primaryColor: '#1C2A3A',
                        secondaryColor: '#3B82F6',
                        backgroundColor: '#F3F9FF',
                        textColor: '#111827',
                        accentTextColor: '#FFFFFF',
                      });
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
              {themesState.map((t: any) => (
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
    </ScrollView>
  );
};

// Details Tab Component
const DetailsTab: React.FC<{ user: User }> = ({ user }) => {
  return (
    <ScrollView 
      style={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContentContainer}>
      
      {/* Emergency Contact */}
      <View style={styles.section}>
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
  );
};

// Settings Tab Component
const SettingsTab: React.FC = () => {
  const navigation = useNavigation();
  const { logout: authLogout } = useAuth();

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
              await ApiService.logout();
              await authLogout();
            } catch (error) {
              console.error('Logout error:', error);
              await authLogout();
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContentContainer}>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        <View style={styles.infoCard}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate('ProfileSettings')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
              <FontAwesomeIcon icon="cog" size={Responsive.iconSize(20)} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>Profile Settings</Text>
            <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(16)} color="#9CA3AF" />
          </TouchableOpacity>
          
          <View style={styles.actionDivider} />
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate('EditProfile')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
              <FontAwesomeIcon icon="user-edit" size={Responsive.iconSize(20)} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>Edit Profile</Text>
            <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(16)} color="#9CA3AF" />
          </TouchableOpacity>
          
          <View style={styles.actionDivider} />
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate('ChangePassword')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' }]}>
              <FontAwesomeIcon icon="lock" size={Responsive.iconSize(20)} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>Change Password</Text>
            <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(16)} color="#9CA3AF" />
          </TouchableOpacity>
          
          <View style={styles.actionDivider} />
          
          <TouchableOpacity 
            style={[styles.actionButton, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EF4444' }]}>
              <FontAwesomeIcon icon="sign-out-alt" size={Responsive.iconSize(20)} color="#FFFFFF" />
            </View>
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

// Main Profile Screen with Tabs
const ProfileScreenWithTabs: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hospital, setHospital] = useState<any>(null);
  
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
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
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
      {/* Header with Back Button */}
      <GlobalHeader
        title="Profile"
        showBackButton={true}
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}
        backButtonStyle={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#d1d5db' }}
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

      {/* Bottom Tab Navigator */}
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
          tabBarStyle: {
            backgroundColor: '#1C2A3A',
            borderTopWidth: 0,
            paddingBottom: 8,
            paddingTop: 0,
            height: 60,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarIconStyle: {
            marginTop: -4,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: Typography.fontFamily.medium,
            marginTop: 2,
            color: '#FFFFFF',
          },
          // Using fade transition animation from the documentation
          ...TransitionPresets.FadeTransition,
        }}
      >
        <Tab.Screen
          name="Overview"
          options={{
            tabBarIcon: ({ color, size }) => (
              <FontAwesomeIcon icon="user" size={size} color={color} />
            ),
            tabBarLabel: 'Overview',
          }}
        >
          {() => <OverviewTab user={user} hospital={hospital} />}
        </Tab.Screen>

        <Tab.Screen
          name="Details"
          options={{
            tabBarIcon: ({ color, size }) => (
              <FontAwesomeIcon icon="info-circle" size={size} color={color} />
            ),
            tabBarLabel: 'Details',
          }}
        >
          {() => <DetailsTab user={user} />}
        </Tab.Screen>

        <Tab.Screen
          name="Settings"
          options={{
            tabBarIcon: ({ color, size }) => (
              <FontAwesomeIcon icon="cog" size={size} color={color} />
            ),
            tabBarLabel: 'Settings',
          }}
        >
          {() => <SettingsTab />}
        </Tab.Screen>
      </Tab.Navigator>
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
  scrollContent: {
    flex: 1,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280',
    lineHeight: 20,
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

export default ProfileScreenWithTabs;
