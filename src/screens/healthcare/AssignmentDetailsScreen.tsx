import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import ApiService from '../../services/api';

const AssignmentDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { assignmentId } = route.params as { assignmentId: string };
  
  const [assignment, setAssignment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAssignmentDetails();
  }, [assignmentId]);

  const loadAssignmentDetails = async () => {
    try {
      console.log('🔍 Loading assignment details for assignmentId:', assignmentId);
      const assignmentData = await ApiService.getAssignmentDetails(assignmentId);
      console.log('📋 Assignment details loaded:', assignmentData);
      setAssignment(assignmentData);
    } catch (error) {
      console.error('❌ Failed to load assignment details:', error);
      Alert.alert('Error', 'Failed to load assignment details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAssignment = async () => {
    Alert.alert(
      'Accept Assignment',
      `Are you sure you want to accept this assignment?\n\nJob: ${assignment.job?.title || 'Unknown'}\nLocation: ${assignment.job?.location || 'Unknown'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              console.log('🔧 Accepting assignment:', assignment.id);
              await ApiService.acceptAssignment(assignment.id);
              
              Alert.alert(
                'Assignment Accepted! 🎉', 
                'You have successfully accepted this assignment!\n\nHR will contact you with further details.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
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

  const handleRejectAssignment = async () => {
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
              await ApiService.rejectAssignment(assignment.id, reason.trim());
              
              Alert.alert(
                'Assignment Rejected', 
                'You have rejected this assignment. HR has been notified of your decision.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT':
        return Colors.urgent;
      case 'HIGH':
        return Colors.high;
      case 'MEDIUM':
        return Colors.medium;
      case 'LOW':
        return Colors.low;
      default:
        return Colors.primary;
    }
  };

  const getAssignmentStatusConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return { color: Colors.warning, text: 'Pending Response', icon: 'clock' };
      case 'ACCEPTED':
        return { color: Colors.success, text: 'Accepted', icon: 'check-circle' };
      case 'REJECTED':
        return { color: Colors.error, text: 'Rejected', icon: 'times-circle' };
      case 'COMPLETED':
        return { color: Colors.primary, text: 'Completed', icon: 'check-double' };
      default:
        return { color: Colors.textTertiary, text: 'Unknown', icon: 'question-circle' };
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading assignment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <FontAwesomeIcon icon="exclamation-triangle" size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Assignment Not Found</Text>
          <Text style={styles.errorText}>The assignment you're looking for doesn't exist or has been removed.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const job = assignment.job || {};
  const statusConfig = getAssignmentStatusConfig(assignment.status);
  const isPending = assignment.status?.toUpperCase() === 'PENDING';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignment Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Assignment Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <FontAwesomeIcon icon={statusConfig.icon} size={24} color={statusConfig.color} />
            <Text style={styles.statusTitle}>Assignment Status</Text>
          </View>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.text}
          </Text>
        </View>

        {/* Job Information */}
        <View style={styles.jobCard}>
          <Text style={styles.jobTitle}>{job.title || 'Unknown Job'}</Text>
          <Text style={styles.jobDescription}>{job.description || 'No description available'}</Text>
          
          <View style={styles.jobDetails}>
            <View style={styles.jobDetail}>
              <FontAwesomeIcon icon="building" size={16} color={Colors.textTertiary} />
              <Text style={styles.jobDetailText}>{job.facilityName || 'Unknown Facility'}</Text>
            </View>
            
            <View style={styles.jobDetail}>
              <FontAwesomeIcon icon="map-marker-alt" size={16} color={Colors.textTertiary} />
              <Text style={styles.jobDetailText}>{job.location || 'Unknown Location'}</Text>
            </View>
            
            <View style={styles.jobDetail}>
              <FontAwesomeIcon icon="user-md" size={16} color={Colors.textTertiary} />
              <Text style={styles.jobDetailText}>{job.department || 'Unknown Department'}</Text>
            </View>
            
            {job.specialization && (
              <View style={styles.jobDetail}>
                <FontAwesomeIcon icon="stethoscope" size={16} color={Colors.textTertiary} />
                <Text style={styles.jobDetailText}>{job.specialization}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Schedule Information */}
        <View style={styles.scheduleCard}>
          <Text style={styles.cardTitle}>Schedule</Text>
          
          <View style={styles.scheduleItem}>
            <FontAwesomeIcon icon="calendar" size={16} color={Colors.textTertiary} />
            <Text style={styles.scheduleLabel}>Start Date:</Text>
            <Text style={styles.scheduleValue}>
              {job.startDate ? formatDate(job.startDate) : 'TBD'}
            </Text>
          </View>
          
          <View style={styles.scheduleItem}>
            <FontAwesomeIcon icon="calendar" size={16} color={Colors.textTertiary} />
            <Text style={styles.scheduleLabel}>End Date:</Text>
            <Text style={styles.scheduleValue}>
              {job.endDate ? formatDate(job.endDate) : 'TBD'}
            </Text>
          </View>
          
          <View style={styles.scheduleItem}>
            <FontAwesomeIcon icon="clock" size={16} color={Colors.textTertiary} />
            <Text style={styles.scheduleLabel}>Time:</Text>
            <Text style={styles.scheduleValue}>
              {job.startTime && job.endTime ? `${formatTime(job.startTime)} - ${formatTime(job.endTime)}` : 'TBD'}
            </Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.paymentCard}>
          <Text style={styles.cardTitle}>Payment Details</Text>
          
          <View style={styles.paymentItem}>
            <FontAwesomeIcon icon="dollar-sign" size={16} color={Colors.textTertiary} />
            <Text style={styles.paymentLabel}>Hourly Rate:</Text>
            <Text style={styles.paymentValue}>${job.hourlyRate || 0}/hour</Text>
          </View>
          
          <View style={styles.paymentItem}>
            <FontAwesomeIcon icon="users" size={16} color={Colors.textTertiary} />
            <Text style={styles.paymentLabel}>Max Assignments:</Text>
            <Text style={styles.paymentValue}>{job.maxAssignments || 1}</Text>
          </View>
          
          <View style={styles.paymentItem}>
            <FontAwesomeIcon icon="flag" size={16} color={getPriorityColor(job.priority)} />
            <Text style={styles.paymentLabel}>Priority:</Text>
            <Text style={[styles.paymentValue, { color: getPriorityColor(job.priority) }]}>
              {job.priority || 'MEDIUM'}
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        {job.contactPerson && (
          <View style={styles.contactCard}>
            <Text style={styles.cardTitle}>Contact Information</Text>
            
            <View style={styles.contactItem}>
              <FontAwesomeIcon icon="user" size={16} color={Colors.textTertiary} />
              <Text style={styles.contactLabel}>Contact:</Text>
              <Text style={styles.contactValue}>{job.contactPerson.name}</Text>
            </View>
            
            <View style={styles.contactItem}>
              <FontAwesomeIcon icon="phone" size={16} color={Colors.textTertiary} />
              <Text style={styles.contactLabel}>Phone:</Text>
              <Text style={styles.contactValue}>{job.contactPerson.phone}</Text>
            </View>
            
            <View style={styles.contactItem}>
              <FontAwesomeIcon icon="envelope" size={16} color={Colors.textTertiary} />
              <Text style={styles.contactLabel}>Email:</Text>
              <Text style={styles.contactValue}>{job.contactPerson.email}</Text>
            </View>
            
            <View style={styles.contactItem}>
              <FontAwesomeIcon icon="briefcase" size={16} color={Colors.textTertiary} />
              <Text style={styles.contactLabel}>Position:</Text>
              <Text style={styles.contactValue}>{job.contactPerson.position}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {isPending && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.rejectButton}
              onPress={handleRejectAssignment}>
              <FontAwesomeIcon icon="times" size={16} color={Colors.white} />
              <Text style={styles.rejectButtonText}>Reject Assignment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={handleAcceptAssignment}>
              <FontAwesomeIcon icon="check" size={16} color={Colors.white} />
              <Text style={styles.acceptButtonText}>Accept Assignment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Assignment Info */}
        {!isPending && (
          <View style={styles.assignmentInfoCard}>
            <Text style={styles.cardTitle}>Assignment Information</Text>
            <Text style={styles.assignmentInfoText}>
              {assignment.status === 'ACCEPTED' 
                ? 'You have accepted this assignment. HR will contact you soon with further details about your shift.'
                : assignment.status === 'REJECTED' 
                ? `You rejected this assignment. Reason: ${assignment.rejectionReason || 'No reason provided'}`
                : `Assignment status: ${statusConfig.text}`
              }
            </Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
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
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  jobTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  jobDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  jobDetails: {
    gap: Spacing.sm,
  },
  jobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobDetailText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textTertiary,
    marginLeft: Spacing.sm,
  },
  scheduleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  contactCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  assignmentInfoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scheduleLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textTertiary,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
    minWidth: 80,
  },
  scheduleValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textTertiary,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
    minWidth: 120,
  },
  paymentValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  contactLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textTertiary,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
    minWidth: 80,
  },
  contactValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  acceptButton: {
    flex: 1,
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
    flex: 1,
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
  assignmentInfoText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
});

export default AssignmentDetailsScreen;
