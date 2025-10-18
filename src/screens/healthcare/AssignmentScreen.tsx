import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { User } from '../../types';
import ApiService from '../../services/api';

const AssignmentScreen: React.FC = () => {
  const navigation = useNavigation();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      console.log('🔍 Loading assignments...');
      
      // Load user profile first to determine role
      const userData = await ApiService.getProfile();
      console.log('👤 User data:', userData);
      setUser(userData);

      // Load job assignments using existing API method
      console.log('📋 Calling getMyAssignments API...');
      const assignmentsResponse = await ApiService.getMyAssignments();
      console.log('📦 Assignments response:', assignmentsResponse);
      console.log('📋 Assignments data:', assignmentsResponse.data);
      setAssignments(assignmentsResponse.data || []);
    } catch (error) {
      console.error('❌ Failed to load assignments:', error);
      console.error('❌ Error details:', error.message);
      Alert.alert('Error', `Failed to load job assignments: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssignments();
    setRefreshing(false);
  };

  const handleAcceptAssignment = async (assignment: any) => {
    Alert.alert(
      'Accept Assignment',
      `Are you sure you want to accept this assignment?\n\nJob: ${assignment.job?.title || 'Unknown'}\nLocation: ${assignment.job?.location || 'Unknown'}\nStart Date: ${assignment.job?.startDate ? formatDate(assignment.job.startDate) : 'Unknown'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              console.log('🔧 Accepting assignment:', assignment.id);
              await ApiService.respondToAssignment(assignment.id, 'ACCEPT');
              
              Alert.alert(
                'Assignment Accepted! 🎉', 
                'You have successfully accepted this assignment!\n\nHR will contact you with further details.',
                [{ text: 'OK', onPress: () => loadAssignments() }]
              );
            } catch (error: any) {
              console.error('❌ Failed to accept assignment:', error);
              Alert.alert(
                'Accept Failed', 
                error.message || 'Unable to accept assignment. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleRejectAssignment = async (assignment: any) => {
    // Show input dialog for rejection reason
    Alert.prompt(
      'Reject Assignment',
      `Please provide a reason for rejecting this assignment:\n\nJob: ${assignment.job?.title || 'Unknown'}\nLocation: ${assignment.job?.location || 'Unknown'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason?: string) => {
            if (!reason || reason.trim().length === 0) {
              Alert.alert('Error', 'Please provide a reason for rejection.');
              return;
            }

            try {
              console.log('🔧 Rejecting assignment:', assignment.id, 'with reason:', reason);
              await ApiService.respondToAssignment(assignment.id, 'REJECT', reason.trim());
              
              Alert.alert(
                'Assignment Rejected', 
                'You have rejected this assignment. HR has been notified of your decision.',
                [{ text: 'OK', onPress: () => loadAssignments() }]
              );
            } catch (error: any) {
              console.error('❌ Failed to reject assignment:', error);
              Alert.alert(
                'Reject Failed', 
                error.message || 'Unable to reject assignment. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
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
    if (!user) return { color: Colors.primary, title: 'Job Assignments' };
    
    switch (user.role) {
      case 'DOCTOR':
        return {
          color: Colors.doctor,
          title: 'Medical Job Assignments'
        };
      case 'NURSE':
        return {
          color: Colors.nurse,
          title: 'Nursing Job Assignments'
        };
      default:
        return {
          color: Colors.primary,
          title: 'Job Assignments'
        };
    }
  };

  const getAssignmentStatusConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return { color: Colors.warning, text: 'Pending Response' };
      case 'ACCEPTED':
        return { color: Colors.primary, text: 'Accepted - You Got the Job!' };
      case 'REJECTED':
        return { color: Colors.error, text: 'Rejected' };
      case 'COMPLETED':
        return { color: Colors.info, text: 'Completed' };
      default:
        return { color: Colors.textTertiary, text: 'Unknown' };
    }
  };

  const AssignmentCard = ({ assignment }: { assignment: any }) => {
    const job = assignment.job || {};
    const statusConfig = getAssignmentStatusConfig(assignment.status);
    const isPending = assignment.status?.toUpperCase() === 'PENDING';
    
    return (
      <TouchableOpacity 
        style={styles.assignmentCard}
        onPress={() => {
          console.log('🔍 Assignment object:', assignment);
          console.log('🔍 Assignment.job:', assignment.job);
          (navigation as any).navigate('JobDetails', { 
            jobId: assignment.job?.id, 
            job: assignment.job 
          });
        }}>
        <View style={styles.assignmentHeader}>
          <Text style={styles.assignmentTitle}>{job.title || 'Unknown Job'}</Text>
          <View style={[styles.assignmentStatus, { backgroundColor: statusConfig.color }]}>
            <Text style={styles.assignmentStatusText}>{statusConfig.text}</Text>
          </View>
        </View>
        
        <Text style={styles.assignmentDescription}>{job.description || 'No description available'}</Text>
        
        <View style={styles.assignmentDetails}>
          <View style={styles.assignmentDetail}>
            <FontAwesomeIcon icon="map-marker-alt" size={16} color={Colors.textTertiary} />
            <Text style={styles.assignmentDetailText}>{job.location || 'Unknown Location'}</Text>
          </View>
          
          <View style={styles.assignmentDetail}>
            <FontAwesomeIcon icon="calendar" size={16} color={Colors.textTertiary} />
            <Text style={styles.assignmentDetailText}>
              {job.startDate ? formatDate(job.startDate) : 'TBD'}
            </Text>
          </View>
          
          <View style={styles.assignmentDetail}>
            <FontAwesomeIcon icon="clock" size={16} color={Colors.textTertiary} />
            <Text style={styles.assignmentDetailText}>
              {job.startTime && job.endTime ? `${formatTime(job.startTime)} - ${formatTime(job.endTime)}` : 'TBD'}
            </Text>
          </View>
          
          <View style={styles.assignmentDetail}>
            <FontAwesomeIcon icon="dollar-sign" size={16} color={Colors.textTertiary} />
            <Text style={styles.assignmentDetailText}>${job.hourlyRate || 0}/hour</Text>
          </View>
        </View>

        {isPending && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.rejectButton, { flex: 1, marginRight: Spacing.sm }]}
              onPress={() => handleRejectAssignment(assignment)}>
              <FontAwesomeIcon icon="times" size={16} color={Colors.white} />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.acceptButton, { flex: 1, marginLeft: Spacing.sm }]}
              onPress={() => handleAcceptAssignment(assignment)}>
              <FontAwesomeIcon icon="check" size={16} color={Colors.white} />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isPending && (
          <View style={styles.assignmentInfo}>
            <Text style={styles.assignmentInfoText}>
              {assignment.status === 'ACCEPTED' 
                ? 'Congratulations! You have been selected for this job. HR will contact you with further details.'
                : assignment.status === 'REJECTED' 
                ? `Rejected: ${assignment.rejectionReason || 'No reason provided'}`
                : 'Assignment status: ' + statusConfig.text
              }
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading job assignments...</Text>
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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {assignments.length > 0 ? (
          assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <FontAwesomeIcon icon="clipboard-list" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>No Job Assignments</Text>
            <Text style={styles.emptyStateText}>
              You don't have any job assignments at the moment. HR will assign compatible jobs to you based on your profile.
            </Text>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: roleConfig.color }]}
              onPress={onRefresh}>
              <FontAwesomeIcon icon="sync" size={16} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  assignmentCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  assignmentTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.md,
  },
  assignmentStatus: {
    paddingHorizontal: Spacing.md,
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
    lineHeight: 22,
    marginBottom: Spacing.lg,
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
  actionButtons: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.success,
  },
  acceptButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.error,
  },
  rejectButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  assignmentInfo: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
  },
  assignmentInfoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
});

export default AssignmentScreen;
