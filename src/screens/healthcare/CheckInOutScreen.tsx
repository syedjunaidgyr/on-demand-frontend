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
import { JobAssignment, User } from '../../types';
import ApiService from '../../services/api';

const CheckInOutScreen: React.FC = () => {
  const navigation = useNavigation();
  const [confirmedAssignments, setConfirmedAssignments] = useState<JobAssignment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadConfirmedAssignments();
  }, []);

  const loadConfirmedAssignments = async () => {
    try {
      // Load user profile first to determine role
      const userData = await ApiService.getProfile();
      setUser(userData);

      // Load assignments for the user
      const assignmentsData = await ApiService.getMyAssignments();

      // Filter for assignments that can be checked in/out (ACCEPTED or IN_PROGRESS)
      console.log('🔍 All assignments:', assignmentsData.data);
      console.log('📊 Assignment statuses:', assignmentsData.data.map(a => ({ id: a.id, status: a.status })));
      const confirmed = assignmentsData.data.filter(assignment => 
        assignment.status === 'ACCEPTED' || assignment.status === 'IN_PROGRESS'
      );
      console.log('✅ Confirmed assignments (ACCEPTED or IN_PROGRESS):', confirmed);

      // ✅ Add check-in status to each assignment
      const assignmentsWithCheckInStatus = await Promise.all(
        confirmed.map(async (assignment) => {
          try {
            // Check if there's an active check-in for this assignment
            const checkInStatus = await ApiService.getCheckInStatus(assignment.id);
            console.log('🔍 Check-in status for assignment', assignment.id, ':', checkInStatus);
            return {
              ...assignment,
              isCheckedIn: checkInStatus.isCheckedIn,
              checkInId: checkInStatus.checkInId
            };
          } catch (error) {
            console.log('Could not get check-in status for assignment:', assignment.id, error);
            // For now, let's assume they can check in (since backend endpoint might not exist)
            return {
              ...assignment,
              isCheckedIn: false,
              checkInId: null
            };
          }
        })
      );

      setConfirmedAssignments(assignmentsWithCheckInStatus);
    } catch (error) {
      console.error('Failed to load confirmed assignments:', error);
      Alert.alert('Error', 'Failed to load confirmed assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (assignment: JobAssignment) => {
    Alert.alert(
      'Check In',
      `Are you ready to check in for ${assignment.job.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const checkInData = {
                jobAssignmentId: assignment.id,
                location: {
                  latitude: 0,
                  longitude: 0,
                  address: assignment.job.location || 'Hospital Location'
                },
                notes: 'Checked in for shift',
              };
  
               // ✅ Use the unified endpoint
               await ApiService.checkIn(checkInData.jobAssignmentId, checkInData.location, checkInData.notes);
  
              Alert.alert('Success', 'Successfully checked in!');
              loadConfirmedAssignments();
            } catch (error) {
              console.error('Check-in error:', error);
              Alert.alert('Error', error.message || 'Failed to check in. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleCheckOut = async (assignment: JobAssignment) => {
    Alert.alert(
      'Check Out',
      `Are you ready to check out from ${assignment.job.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const checkOutData = {
                jobAssignmentId: assignment.id,
                location: {
                  latitude: 0, // TODO: Get actual location
                  longitude: 0, // TODO: Get actual location
                  address: assignment.job.location || 'Hospital Location'
                },
                notes: 'Checked out after shift', // ✅ Non-empty notes
              };

              // ✅ Use the unified endpoint
              await ApiService.checkOut(checkOutData.jobAssignmentId, checkOutData.location, checkOutData.notes);

              Alert.alert('Success', 'Successfully checked out!');
              loadConfirmedAssignments(); // Refresh the list
            } catch (error) {
              Alert.alert('Error', 'Failed to check out. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRoleConfig = () => {
    if (!user) return { color: Colors.primary, title: 'Check In/Out' };

    switch (user.role) {
      case 'DOCTOR':
        return {
          color: Colors.doctor,
          title: 'Doctor Check In/Out'
        };
      case 'NURSE':
        return {
          color: Colors.nurse,
          title: 'Nurse Check In/Out'
        };
      default:
        return {
          color: Colors.primary,
          title: 'Check In/Out'
        };
    }
  };

  const AssignmentCard = ({ assignment }: { assignment: JobAssignment }) => (
    <View style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
        <Text style={styles.assignmentTitle}>{assignment.job.title}</Text>
        <View style={[styles.assignmentStatus, { backgroundColor: Colors.success }]}>
          <Text style={styles.assignmentStatusText}>Active</Text>
        </View>
      </View>

      <Text style={styles.assignmentDescription}>{assignment.job.description}</Text>

      <View style={styles.assignmentDetails}>
        <View style={styles.assignmentDetail}>
          <FontAwesomeIcon icon="map-marker-alt" size={16} color={Colors.textTertiary} />
          <Text style={styles.assignmentDetailText}>{assignment.job.location}</Text>
        </View>

        <View style={styles.assignmentDetail}>
          <FontAwesomeIcon icon="calendar" size={16} color={Colors.textTertiary} />
          <Text style={styles.assignmentDetailText}>
            {formatDate(assignment.job.startDate)}
          </Text>
        </View>

        <View style={styles.assignmentDetail}>
          <FontAwesomeIcon icon="clock" size={16} color={Colors.textTertiary} />
          <Text style={styles.assignmentDetailText}>
            {formatTime(assignment.job.startTime)} - {formatTime(assignment.job.endTime)}
          </Text>
        </View>
      </View>

      <View style={styles.checkInOutActions}>
        {(() => {
          console.log('🎨 Rendering button for assignment:', assignment.id, 'status:', assignment.status, 'isCheckedIn:', assignment.isCheckedIn);
          
          // If status is IN_PROGRESS, you're already checked in - show Check Out
          if (assignment.status === 'IN_PROGRESS') {
            return (
              <TouchableOpacity
                style={[styles.checkOutButton, { backgroundColor: Colors.error }]}
                onPress={() => handleCheckOut(assignment)}
                disabled={isProcessing}>
                <FontAwesomeIcon icon="sign-out-alt" size={16} color={Colors.white} />
                <Text style={styles.checkOutButtonText}>Check Out</Text>
              </TouchableOpacity>
            );
          }
          
          // If status is ACCEPTED and not checked in, show Check In
          if (assignment.status === 'ACCEPTED' && !assignment.isCheckedIn) {
            return (
              <TouchableOpacity
                style={[styles.checkInButton, { backgroundColor: Colors.success }]}
                onPress={() => handleCheckIn(assignment)}
                disabled={isProcessing}>
                <FontAwesomeIcon icon="sign-in-alt" size={16} color={Colors.white} />
                <Text style={styles.checkInButtonText}>Check In</Text>
              </TouchableOpacity>
            );
          }
          
          // If status is ACCEPTED and checked in, show Check Out
          if (assignment.status === 'ACCEPTED' && assignment.isCheckedIn) {
            return (
              <TouchableOpacity
                style={[styles.checkOutButton, { backgroundColor: Colors.error }]}
                onPress={() => handleCheckOut(assignment)}
                disabled={isProcessing}>
                <FontAwesomeIcon icon="sign-out-alt" size={16} color={Colors.white} />
                <Text style={styles.checkOutButtonText}>Check Out</Text>
              </TouchableOpacity>
            );
          }
          
          // Default fallback
          return null;
        })()}
        
        {/* Temporary debug button - remove this later */}
        <TouchableOpacity
          style={[styles.checkInButton, { backgroundColor: Colors.warning, marginTop: 8 }]}
          onPress={() => {
            console.log('🔄 Toggling check-in status for assignment:', assignment.id);
            // This is just for testing - in real app, this would be handled by backend
            const updatedAssignments = confirmedAssignments.map(a => 
              a.id === assignment.id ? { ...a, isCheckedIn: !a.isCheckedIn } : a
            );
            setConfirmedAssignments(updatedAssignments);
          }}>
          <Text style={styles.checkInButtonText}>Toggle Status (Debug)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const roleConfig = getRoleConfig();

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: roleConfig.color }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <FontAwesomeIcon icon="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{roleConfig.title}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {confirmedAssignments.length > 0 ? (
          confirmedAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <FontAwesomeIcon icon="clock" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>No Active Assignments</Text>
            <Text style={styles.emptyStateText}>
              You don't have any active assignments that require check in/out at the moment.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: roleConfig.color }]}
              onPress={() => navigation.goBack()}>
              <FontAwesomeIcon icon="calendar" size={16} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  assignmentCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadow.sm,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  assignmentTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  assignmentStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  assignmentStatusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
  assignmentDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  assignmentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  assignmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.lg,
    marginBottom: Spacing.sm,
    minWidth: '45%',
  },
  assignmentDetailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    marginLeft: Spacing.xs,
  },
  checkInOutActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 120,
    justifyContent: 'center',
  },
  checkInButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  checkOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 120,
    justifyContent: 'center',
  },
  checkOutButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['2xl'],
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing['2xl'],
    alignItems: 'center',
  },
  processingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
});

export default CheckInOutScreen;
