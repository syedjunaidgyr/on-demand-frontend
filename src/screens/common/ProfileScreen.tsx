import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import LinearGradient from 'react-native-linear-gradient';
import GlobalHeader from '../../components/GlobalHeader';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { User } from '../../types';
import ApiService from '../../services/api';
import { useAuth } from '../../navigation/AppNavigator';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { logout: authLogout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;
  const isLargeScreen = screenHeight > 800;
  const isVerySmallScreen = screenHeight < 600;

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await ApiService.getProfile();
      setUser(userData);
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
              // Navigation will be handled by AppNavigator
            } catch (error) {
              console.error('Logout error:', error);
              // Even if there's an error, try to logout from auth context
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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <FontAwesomeIcon icon="exclamation-triangle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load profile</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button and Settings */}
      <GlobalHeader
        title="Profile"
        showBackButton={true}
        backgroundColor="#1C2A3A"
        titleColor="#FFFFFF"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => (navigation as any).navigate('ProfileSettings')}>
              <FontAwesomeIcon icon="cog" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleLogout}>
              <FontAwesomeIcon icon="sign-out-alt" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Profile Info Section with Curved Bottom */}
      <View style={styles.profileInfoSection}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
        </View>
      </View>

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
        <View style={styles.section}>
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
    </View>
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
      <FontAwesomeIcon icon={icon} size={18} color="#1C2A3A" />
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    marginTop: -25,
    backgroundColor: '#FFFFFF',
    // Ensure proper scrolling on all devices
    minHeight: Dimensions.get('window').height * 0.6,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
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
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6B7280', // Changed to match email label color
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827', // Changed to text color
    marginBottom: 4,
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
    paddingVertical: 10,
    marginTop: 45,
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
