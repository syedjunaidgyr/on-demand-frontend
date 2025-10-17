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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { User } from '../../types';
import ApiService from '../../services/api';
import { useAuth } from '../../navigation/AppNavigator';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { logout: authLogout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DOCTOR':
        return Colors.doctor;
      case 'NURSE':
        return Colors.nurse;
      case 'HR':
        return Colors.hr;
      case 'ADMIN':
        return Colors.admin;
      default:
        return Colors.primary;
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
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <FontAwesomeIcon icon="exclamation-triangle" size={48} color={Colors.error}  />
          <Text style={styles.errorText}>Failed to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { backgroundColor: getRoleColor(user.role) }]}>
            <FontAwesomeIcon icon={getRoleIcon(user.role)} size={40} color={Colors.white}  />
          </View>
          <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <FontAwesomeIcon icon="envelope" size={20} color={Colors.textTertiary}  />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <FontAwesomeIcon icon="phone" size={20} color={Colors.textTertiary}  />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <FontAwesomeIcon icon="building" size={20} color={Colors.textTertiary}  />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue}>{user.department}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <FontAwesomeIcon icon="map-marker-alt" size={20} color={Colors.textTertiary}  />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{user.location}</Text>
              </View>
            </View>

            {user.specialization && (
              <View style={styles.infoRow}>
                <FontAwesomeIcon icon="stethoscope" size={20} color={Colors.textTertiary}  />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Specialization</Text>
                  <Text style={styles.infoValue}>{user.specialization}</Text>
                </View>
              </View>
            )}

            {user.licenseNumber && (
              <View style={styles.infoRow}>
                <FontAwesomeIcon icon="user" size={20} color={Colors.textTertiary}  />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>License Number</Text>
                  <Text style={styles.infoValue}>{user.licenseNumber}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <FontAwesomeIcon icon="user" size={20} color={Colors.textTertiary}  />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{user.emergencyContact?.name || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <FontAwesomeIcon icon="phone" size={20} color={Colors.textTertiary}  />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user.emergencyContact?.phone || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <FontAwesomeIcon icon="users" size={20} color={Colors.textTertiary}  />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Relationship</Text>
                <Text style={styles.infoValue}>{user.emergencyContact?.relationship || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <FontAwesomeIcon icon="home" size={20} color={Colors.textTertiary}  />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Street</Text>
                <Text style={styles.infoValue}>{user.address?.street || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <FontAwesomeIcon icon="building" size={20} color={Colors.textTertiary}  />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>City</Text>
                <Text style={styles.infoValue}>{user.address?.city || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <FontAwesomeIcon icon="map-marker-alt" size={20} color={Colors.textTertiary}  />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>State</Text>
                <Text style={styles.infoValue}>{user.address?.state || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <FontAwesomeIcon icon="envelope" size={20} color={Colors.textTertiary}  />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>ZIP Code</Text>
                <Text style={styles.infoValue}>{user.address?.zipCode || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton}>
            <FontAwesomeIcon icon="edit" size={20} color={Colors.primary}  />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
            <FontAwesomeIcon icon="arrow-right" size={20} color={Colors.textTertiary}  />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <FontAwesomeIcon icon="lock" size={20} color={Colors.primary}  />
            <Text style={styles.actionButtonText}>Change Password</Text>
            <FontAwesomeIcon icon="arrow-right" size={20} color={Colors.textTertiary}  />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
              <FontAwesomeIcon icon="sign-out-alt" size={20} color={Colors.error}  />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Logout</Text>
            <FontAwesomeIcon icon="arrow-right" size={20} color={Colors.textTertiary}  />
          </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.error,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
  section: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  actionButtonText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
  },
  logoutButton: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  logoutButtonText: {
    color: Colors.error,
  },
});

export default ProfileScreen;
