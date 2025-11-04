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
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);

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

  // Priority color mapping (screen-level so it can be used in the bottom sheet as well)
  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
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
          setSelectedAssignment(assignment);
          setDetailsVisible(true);
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

        {/* Main row: Job details */}
        <View style={styles.profileRow}>
          <View style={styles.profileContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {job.title || 'Unknown Job'}
            </Text>
            {/* Subtitle row: Facility • Location */}
            <View style={styles.subtitleRow}>
              {facilityName && (
                <Text style={styles.subtitleText} numberOfLines={2}>{facilityName}</Text>
              )}
              {facilityName && location && (
                <Text style={styles.subtitleDot}> • </Text>
              )}
              {location && (
                <Text style={styles.subtitleText} numberOfLines={2}>{location}</Text>
              )}
            </View>

            {/* Compact info row: Priority, Role, Rate */}
            <View style={styles.assignmentRow}>
              {priority && (
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Priority</Text>
                  <Text style={[styles.infoValue, { color: getPriorityColor(priority) }]}>{priority}</Text>
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
          
            {/* Department label on one line, value on next (match Dashboard) */}
            {department ? (
              <View style={styles.priorityRow}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{department}</Text>
              </View>
            ) : null}

            {/* Card-level action buttons removed per request (actions stay in modal) */}

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

      {/* Job Details Bottom Sheet */}
      <Modal visible={detailsVisible} transparent animationType="slide" onRequestClose={() => setDetailsVisible(false)}>
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity style={styles.sheetBackdropTouchable} onPress={() => setDetailsVisible(false)} />
          <View style={styles.sheetContainer}>
            {selectedAssignment ? (
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} scrollEnabled={true}>
                {(() => {
                   const job = selectedAssignment.job || {};
                   const facilityName = (job.facilityName || '').trim();
                   const location = (job.location || '').trim();
                   const department = job.department || '';
                   const requiredRole = job.requiredRole || '';
                   const hourlyRate = selectedAssignment.hourlyRate || job.hourlyRate || '0';
                   const startDate = job.startDate ? formatDate(job.startDate) : '—';
                   const endDate = job.endDate ? formatDate(job.endDate) : '—';
                   const startTime = job.startTime ? formatTime(job.startTime) : '—';
                   const endTime = job.endTime ? formatTime(job.endTime) : '—';
                   const status = job.status || 'ACTIVE';
                   const priority = job.priority || '';
                   const address = job.facilityAddress || {};
                   const contact = job.contactPerson || {};
                   const requirements = job.requirements || {};
                   const skills: string[] = Array.isArray(requirements.skills) ? requirements.skills : [];
                   const trusted = job?.benefits?.malpractice ? true : false;
                   return (
                     <>
                      {/* Modal Header */}
                      <View style={styles.modalHeaderTop}>
                        <TouchableOpacity onPress={() => setDetailsVisible(false)} style={styles.modalBackButton}>
                          <FontAwesomeIcon icon="arrow-left" size={18} color={Colors.textPrimary} />
                  </TouchableOpacity>
                        <Text style={styles.modalHeaderTitle}>Job Details</Text>
                        <View style={{ width: 24 }} />
                      </View>
                      {/* Job Title */}
                      <Text style={styles.sheetTitleText}>{job.title || 'Job Details'}</Text>

                      {/* Dark Pills: Department • Role • Charge */}
                      <View style={styles.darkPillsRow}>
                        {!!department && (
                          <View style={styles.darkPill}><Text style={styles.darkPillText}>{department}</Text></View>
                        )}
                        {!!requiredRole && (
                          <View style={styles.darkPill}><Text style={styles.darkPillText}>{requiredRole}</Text></View>
                        )}
                        <View style={styles.darkPill}><Text style={styles.darkPillText}>₹{typeof hourlyRate === 'string' ? hourlyRate : hourlyRate.toString()}</Text></View>
                      </View>
                       <View style={styles.sheetDivider} />

                      {/* Job Info (first) */}
                      <View style={{ marginBottom: 16 }}>
                        <Text style={styles.metaLabel}>Job Info</Text>
                        <View style={styles.row2}>
                          <View style={styles.col}>
                            <Text style={styles.metaLabel}>Start</Text>
                            <Text style={styles.descText}>{startDate}, {startTime}</Text>
                          </View>
                          <View style={styles.col}>
                            <Text style={styles.metaLabel}>End</Text>
                            <Text style={styles.descText}>{endDate}, {endTime}</Text>
                          </View>
                        </View>
                        <View style={styles.row2}>
                          <View style={styles.col}>
                            <Text style={styles.metaLabel}>Location</Text>
                            <Text style={styles.descText} numberOfLines={1}>{location || '—'}</Text>
                          </View>
                          <View style={styles.col}>
                            <Text style={styles.metaLabel}>Facility</Text>
                            <Text style={styles.descText} numberOfLines={1}>{facilityName || '—'}</Text>
                          </View>
                        </View>
                        <View style={styles.row2}>
                          <View style={styles.col}>
                            <Text style={styles.metaLabel}>Department</Text>
                            <Text style={styles.descText} numberOfLines={1}>{department || '—'}</Text>
                          </View>
                          <View style={styles.col}>
                            <Text style={styles.metaLabel}>Role</Text>
                            <Text style={styles.descText} numberOfLines={1}>{requiredRole || '—'}</Text>
                          </View>
                        </View>
                      </View>

                      {/* About the Role */}
                       {job.description ? (
                         <View style={{ marginTop: 16, marginBottom: 16 }}>
                           <Text style={styles.metaLabel}>About the Role</Text>
                           <Text style={styles.descText}>{job.description}</Text>
                         </View>
                       ) : null}

                       {/* Qualifications / Requirements */}
                       {(skills.length > 0 || requirements.experience) && (
                         <View style={{ marginBottom: 16 }}>
                           <Text style={styles.metaLabel}>Qualification</Text>
                           <View style={{ marginTop: 6 }}>
                             {requirements.experience ? (
                               <View style={styles.bulletRow}>
                                 <View style={styles.bulletDot} />
                                 <Text style={styles.descText}>{requirements.experience}</Text>
                               </View>
                             ) : null}
                             {skills.map((s, idx) => (
                               <View key={`sk-${idx}`} style={styles.bulletRow}>
                                 <View style={styles.bulletDot} />
                                 <Text style={styles.descText}>{s}</Text>
                               </View>
                ))}
              </View>
            </View>
                       )}

                      

                      {/* (Duplicate Job Info removed) */}

                      {/* Benefits */}
                      {job.benefits && (
                        <View style={{ marginBottom: 16 }}>
                          <Text style={styles.metaLabel}>Benefits</Text>
                          {Object.entries(job.benefits).map(([key, val]) => (
                            <View key={`benefit-${key}`} style={styles.bulletRow}>
                              <View style={styles.bulletDot} />
                              <Text style={styles.descText}>{key}: {val ? 'Yes' : 'No'}</Text>
                            </View>
                ))}
              </View>
                      )}

                      {/* Notes */}
                      {!!job.notes && (
                        <View style={{ marginBottom: 16 }}>
                          <Text style={styles.metaLabel}>Notes</Text>
                          <Text style={styles.descText}>{job.notes}</Text>
            </View>
                      )}

                      {/* Hospital */}
                      {job.hospital && (
                        <View style={{ marginBottom: 16 }}>
                          <Text style={styles.metaLabel}>Hospital</Text>
                          <Text style={styles.descText}>{job.hospital.name} ({job.hospital.code})</Text>
                          {job.hospital.address && (
                            <Text style={styles.descText}>
                              {[job.hospital.address.street, job.hospital.address.city, job.hospital.address.state, job.hospital.address.zipCode].filter(Boolean).join(', ')}
                            </Text>
                          )}
                        </View>
                      )}

                      {/* Contact Person (moved after Hospital) */}
                      {(contact.name || contact.phone || contact.email) && (
                        <View style={{ marginBottom: 20 }}>
                          <Text style={styles.metaLabel}>Contact</Text>
                          {!!contact.name && <Text style={styles.descText}>{contact.name}</Text>}
                          {!!contact.phone && <Text style={styles.descText}>{contact.phone}</Text>}
                          {!!contact.email && <Text style={styles.descText}>{contact.email}</Text>}
                        </View>
                      )}

                      {/* Removed: Creator and Assignment sections per request */}
                     </>
                   );
                 })()}
              </ScrollView>
            ) : null}
            
            {/* Fixed Actions at Bottom */}
            {selectedAssignment && (
              <View style={styles.sheetActionsRow}>
                <TouchableOpacity style={[styles.sheetRejectButton]} onPress={() => { setDetailsVisible(false); handleRejectAssignment(selectedAssignment); }}>
                  <Text style={[styles.sheetButtonText, { color: Colors.error, marginLeft: 0 }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sheetAcceptButton]} onPress={() => { setDetailsVisible(false); handleAcceptAssignment(selectedAssignment); }}>
                  <Text style={styles.sheetButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

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
    marginBottom: 10,
    flexWrap: 'nowrap',
  },
  subtitleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    flexShrink: 1,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 10,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  infoLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  infoValue: {
    marginTop: 2,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    flexShrink: 1,
    flexWrap: 'wrap',
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
  // Bottom sheet styles (reuse existing design language)
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    flexDirection: 'column',
  },
  sheetBackdropTouchable: { flex: 1 },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    minHeight: '80%',
    maxHeight: '92%',
    display: 'flex',
    flexDirection: 'column',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 6,
  },
  sheetTitleText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    flex: 1,
    flexWrap: 'wrap',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  modalHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 8,
  },
  modalBackButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  modalAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: '#4C1D95',
  },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  headerSubText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  headerDot: { color: Colors.textSecondary, marginHorizontal: 6 },
  headerRateBold: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary, fontFamily: Typography.fontFamily.bold },
  trustedRow: { flexDirection: 'row', alignItems: 'center' },
  trustedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 6 },
  trustedText: { fontSize: Typography.fontSize.sm, color: '#22C55E', fontFamily: Typography.fontFamily.medium },
  darkPillsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 4, justifyContent: 'flex-start', alignItems: 'center' },
  darkPill: { backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginTop: 6 },
  darkPillText: { color: '#fff', fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, marginBottom: 8 },
  pill: { backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginTop: 6, borderWidth: 1, borderColor: Colors.borderLight },
  pillText: { fontSize: Typography.fontSize.xs, color: Colors.textPrimary, fontFamily: Typography.fontFamily.medium },
  row2: { flexDirection: 'row', marginHorizontal: -8, marginBottom: 12 },
  col: { flex: 1, marginHorizontal: 8 },
  singleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  metaLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  descText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textSecondary, marginTop: 7, marginRight: 8 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  sheetAcceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    gap: 8,
  },
  sheetRejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: 8,
  },
  sheetButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
    marginLeft: 8,
  },
});

export default AssignmentScreen;
