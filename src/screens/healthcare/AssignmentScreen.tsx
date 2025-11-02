import React, { useState, useEffect, useMemo } from 'react';
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
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { User } from '../../types';
import ApiService from '../../services/api';
import Responsive from '../../utils/responsive';
import { SkeletonJobCard } from '../../components/SkeletonComponents';

const AssignmentScreen: React.FC = () => {
  const navigation = useNavigation();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      // Set loading to false after data is set
      setIsLoading(false);
    } catch (error: any) {
      console.error('❌ Failed to load assignments:', error);
      console.error('❌ Error details:', error?.message);
      setAssignments([]);
      // Set loading to false even on error
      setIsLoading(false);
      Alert.alert('Error', `Failed to load job assignments: ${error?.message || 'Unknown error'}`);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssignments();
    setRefreshing(false);
  };

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length === 0) {
      return assignments;
    }
    return assignments.filter((a) => {
      const title = a.job?.title?.toLowerCase() || '';
      const description = a.job?.description?.toLowerCase() || '';
      const facilityName = a.job?.facilityName?.toLowerCase() || '';
      const location = a.job?.location?.toLowerCase() || '';
      const department = a.job?.department?.toLowerCase() || '';
      return title.includes(query) || 
             description.includes(query) || 
             facilityName.includes(query) || 
             location.includes(query) || 
             department.includes(query);
    });
  }, [assignments, searchQuery]);

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

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) {
      return 'just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return formatDate(dateString);
    }
  };

  const getRoleConfig = () => {
    return {
      color: Colors.primary,
      title: 'My Jobs'
    };
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
    
    // Extract data from API response structure - display exactly as received
    const facilityName = (job.facilityName || '').trim() || 'Healthcare Facility';
    const location = (job.location || '').trim() || 'Location not specified';
    
    // Display hourlyRate exactly as it comes from API
    const hourlyRate = assignment.hourlyRate || job.hourlyRate || '0';
    const hourlyRateDisplay = typeof hourlyRate === 'string' ? hourlyRate : hourlyRate.toString();
    
    // Use assignment createdAt first, then job createdAt, then current date
    const createdAt = assignment.createdAt || job.createdAt;
    const postedTime = createdAt ? getTimeAgo(createdAt) : 'just now';
    
    // Generate company initials from facility name
    const companyInitials = facilityName
      .split(' ')
      .filter((word: string) => word.length > 0)
      .map((word: string) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'HC';

    // Get job details from API
    const jobStatus = job.status || 'ACTIVE';
    const priority = job.priority || '';
    const requiredRole = job.requiredRole || '';
    const department = job.department || '';

    // Priority color mapping
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'URGENT':
          return '#EF4444';
        case 'HIGH':
          return '#F59E0B';
        case 'MEDIUM':
          return '#3B82F6';
        case 'LOW':
          return '#10B981';
        default:
          return '#6B7280';
      }
    };

    // Status color mapping
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'ACTIVE':
          return '#10B981';
        case 'CANCELLED':
          return '#EF4444';
        case 'COMPLETED':
          return '#3B82F6';
        case 'FILLED':
          return '#6B7280';
        default:
          return '#6B7280';
      }
    };
    
    return (
      <TouchableOpacity 
        style={styles.jobCard}
        onPress={() => {
          console.log('🔍 Assignment object:', assignment);
          console.log('🔍 Assignment.job:', assignment.job);
          (navigation as any).navigate('JobDetails', { 
            jobId: assignment.job?.id, 
            job: assignment.job 
          });
        }}
        activeOpacity={0.8}>
        {/* Top row: Posted time and Status */}
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTimeText}>Posted {postedTime}</Text>
          <View style={[styles.inlineStatusPill, { backgroundColor: statusConfig.color + '1A' }]}>
            <Text style={[styles.inlineStatusText, { color: statusConfig.color }]} numberOfLines={1}>
              {statusConfig.text}
            </Text>
          </View>
        </View>
        <View style={styles.cardDivider} />

        {/* Main row: Avatar + Job details */}
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{companyInitials}</Text>
          </View>
          <View style={styles.profileContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {job.title || 'Unknown Job'}
            </Text>
            {/* Subtitle row: Facility • Location */}
            <View style={styles.subtitleRow}>
              {facilityName && (
                <Text style={styles.subtitleText} numberOfLines={1}>{facilityName}</Text>
              )}
              {facilityName && location && (
                <Text style={styles.subtitleDot}> • </Text>
              )}
              {location && (
                <Text style={styles.subtitleText} numberOfLines={1}>{location}</Text>
              )}
            </View>

            {/* Compact info row: Department, Role, Rate */}
            <View style={styles.assignmentRow}>
              {department && (
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Department</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{department}</Text>
                </View>
              )}
              {requiredRole && (
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Role</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{requiredRole}</Text>
                </View>
              )}
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Rate</Text>
                <Text style={styles.infoValue} numberOfLines={1}>₹{hourlyRateDisplay}/hr</Text>
              </View>
            </View>

            {/* Priority badge if exists */}
            {priority && (
              <View style={styles.priorityRow}>
                <View style={[styles.priorityBadgeInline, { backgroundColor: getPriorityColor(priority) + '20', borderColor: getPriorityColor(priority) }]}>
                  <Text style={[styles.priorityBadgeTextInline, { color: getPriorityColor(priority) }]}>
                    {priority} Priority
                  </Text>
                </View>
              </View>
            )}

            {/* Accept/Reject buttons for pending assignments */}
            {isPending && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.rejectButton, { flex: 1, marginRight: Spacing.sm }]}
                  onPress={() => handleRejectAssignment(assignment)}>
                  <FontAwesomeIcon icon="times" size={Responsive.iconSize(16)} color={Colors.white} />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.acceptButton, { flex: 1, marginLeft: Spacing.sm }]}
                  onPress={() => handleAcceptAssignment(assignment)}>
                  <FontAwesomeIcon icon="check" size={Responsive.iconSize(16)} color={Colors.white} />
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Status info for non-pending assignments */}
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
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const roleConfig = getRoleConfig();

  return (
    <SafeAreaView style={styles.container}>
      {/* Global Header */}
      <GlobalHeader
        title="My Jobs"
        showBackButton={true}
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16 }}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {/* Search Bar */}
        {!isLoading && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <FontAwesomeIcon icon="search" size={Responsive.iconSize(18)} color={Colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search your job.."
                placeholderTextColor={Colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        )}

        {/* Job Count */}
        {!isLoading && (
          <View style={styles.jobCountContainer}>
            <Text style={styles.jobCountText}>
              {filteredAssignments.length} {filteredAssignments.length === 1 ? 'Job' : 'Jobs'} Found
            </Text>
          </View>
        )}

        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <SkeletonJobCard key={i} />
            ))}
          </>
        ) : (
          <>
            {filteredAssignments.length > 0 ? (
              filteredAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <FontAwesomeIcon icon="clipboard-list" size={Responsive.iconSize(64)} color={Colors.textTertiary} />
                <Text style={styles.emptyStateTitle}>No Job Assignments</Text>
                <Text style={styles.emptyStateText}>
                  You don't have any job assignments at the moment. HR will assign compatible jobs to you based on your profile.
                </Text>
                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: roleConfig.color }]}
                  onPress={onRefresh}>
                  <FontAwesomeIcon icon="sync" size={Responsive.iconSize(16)} color={Colors.white} />
                  <Text style={styles.primaryButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
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
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  searchContainer: {
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl || 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    paddingVertical: 0,
  },
  jobCountContainer: {
    marginBottom: Spacing.md,
  },
  jobCountText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  exportDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  exportDropdownText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginRight: Spacing.xs,
  },
  exportDropdownMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    ...Shadow.sm,
    zIndex: 1000,
  },
  exportDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  exportDropdownItemText: {
    marginLeft: Spacing.xs,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
  },
  filterOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterOutlineText: {
    marginLeft: Spacing.xs,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  // Job Card Styles (matching HRUsersScreen style)
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTimeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: -2,
  },
  avatarInitials: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: '#4C1D95',
  },
  profileContent: {
    flex: 1,
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
    flexShrink: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'nowrap',
  },
  subtitleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    flexShrink: 1,
    maxWidth: '45%',
  },
  subtitleDot: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginHorizontal: 6,
  },
  inlineStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inlineStatusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    textTransform: 'capitalize',
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
  },
  infoValue: {
    marginTop: 2,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  priorityRow: {
    marginTop: 8,
  },
  priorityBadgeInline: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  priorityBadgeTextInline: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  filterModal: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  filterTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statusChipActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  statusChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  statusChipTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.lg,
  },
  modalButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
  },
  modalButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
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
