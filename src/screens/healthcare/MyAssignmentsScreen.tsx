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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { JobAssignment, User } from '../../types';
import ApiService from '../../services/api';

const MyAssignmentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      // Load user profile first to determine role
      const userData = await ApiService.getProfile();
      setUser(userData);

      // Load assignments (both doctors and nurses use the same endpoint now)
      const assignmentsData = await ApiService.getMyAssignments();
      setAssignments(assignmentsData?.data || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      setAssignments([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssignments();
    setRefreshing(false);
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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACCEPTED':
        return Colors.success;
      case 'COMPLETED':
        return Colors.info;
      case 'CANCELLED':
      case 'REJECTED':
        return Colors.error;
      case 'PENDING':
        return Colors.warning;
      default:
        return Colors.textTertiary;
    }
  };

  const getRoleConfig = () => {
    if (!user) return { color: Colors.primary, title: 'My Assignments' };
    
    switch (user.role) {
      case 'DOCTOR':
        return {
          color: Colors.doctor,
          title: 'My Medical Assignments'
        };
      case 'NURSE':
        return {
          color: Colors.nurse,
          title: 'My Nursing Assignments'
        };
      default:
        return {
          color: Colors.primary,
          title: 'My Assignments'
        };
    }
  };

  const AssignmentCard = ({ assignment }: { assignment: JobAssignment }) => (
    <TouchableOpacity style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
        <Text style={styles.assignmentTitle}>{assignment.job?.title || 'Unknown Job'}</Text>
        <View style={[styles.assignmentStatus, { backgroundColor: getStatusColor(assignment.status) }]}>
          <Text style={styles.assignmentStatusText}>{assignment.status}</Text>
        </View>
      </View>
      
      <Text style={styles.assignmentDescription}>{assignment.job?.description || 'No description available'}</Text>
      
      <View style={styles.assignmentDetails}>
        <View style={styles.assignmentDetail}>
          <FontAwesomeIcon icon="map-marker-alt" size={16} color={Colors.textTertiary} />
          <Text style={styles.assignmentDetailText}>{assignment.job?.location || 'Unknown Location'}</Text>
        </View>
        
        <View style={styles.assignmentDetail}>
          <FontAwesomeIcon icon="calendar" size={16} color={Colors.textTertiary} />
          <Text style={styles.assignmentDetailText}>
            {assignment.job ? formatDate(assignment.job.startDate) : 'Date not available'}
          </Text>
        </View>
        
        <View style={styles.assignmentDetail}>
          <FontAwesomeIcon icon="clock" size={16} color={Colors.textTertiary} />
          <Text style={styles.assignmentDetailText}>
            {assignment.job ? `${formatTime(assignment.job.startTime)} - ${formatTime(assignment.job.endTime)}` : 'Time not available'}
          </Text>
        </View>
        
        <View style={styles.assignmentDetail}>
          <FontAwesomeIcon icon="dollar-sign" size={16} color={Colors.textTertiary} />
          <Text style={styles.assignmentDetailText}>${assignment.hourlyRate}/hour</Text>
        </View>
      </View>

      {assignment.status === 'ACCEPTED' && (
        <View style={styles.assignmentActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: Colors.primary }]}
            onPress={() => (navigation as any).navigate('CheckInOut')}>
            <FontAwesomeIcon icon="clock" size={16} color={Colors.white} />
            <Text style={styles.actionButtonText}>Check In/Out</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {assignments && assignments.length > 0 ? (
          assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <FontAwesomeIcon icon="calendar" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>No Assignments</Text>
            <Text style={styles.emptyStateText}>
              You don't have any assignments yet. Check the available jobs to find new opportunities.
            </Text>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: roleConfig.color }]}
              onPress={() => (navigation as any).navigate('AvailableJobs')}>
              <FontAwesomeIcon icon="search" size={16} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Find Jobs</Text>
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
    textTransform: 'capitalize',
  },
  assignmentDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  assignmentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
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
  assignmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.xs,
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
});

export default MyAssignmentsScreen;
