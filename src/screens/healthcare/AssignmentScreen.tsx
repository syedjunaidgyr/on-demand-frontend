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
import * as ExportUtils from '../../utils/exportUtils';

const AssignmentScreen: React.FC = () => {
  const navigation = useNavigation();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingAssignmentId, setExportingAssignmentId] = useState<number | null>(null);
  const [showExportAllMenu, setShowExportAllMenu] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterTitle, setFilterTitle] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showAssignmentExportMenuForId, setShowAssignmentExportMenuForId] = useState<number | null>(null);

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

  const filteredAssignments = useMemo(() => {
    const titleQuery = filterTitle.trim().toLowerCase();
    const statusFilter = filterStatus?.toUpperCase() || '';
    return assignments.filter((a) => {
      const title = a.job?.title?.toLowerCase() || '';
      const status = (a.status || '').toUpperCase();
      const byTitle = titleQuery.length === 0 || title.includes(titleQuery);
      const byStatus = statusFilter.length === 0 || status === statusFilter;
      return byTitle && byStatus;
    });
  }, [assignments, filterTitle, filterStatus]);

  const handleExportAssignment = async (assignmentId: number, format: 'pdf' | 'excel') => {
    try {
      setExportingAssignmentId(assignmentId);
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (!assignment) {
        Alert.alert('Export', 'Assignment not found');
        return;
      }

      const data = {
        id: assignment.id,
        jobTitle: assignment.job?.title || '',
        facilityName: assignment.job?.facilityName || assignment.job?.location || '',
        department: assignment.job?.department || '',
        status: assignment.status || '',
        hourlyRate: assignment.job?.hourlyRate ?? '',
        startDate: assignment.job?.startDate || '',
        endDate: assignment.job?.endDate || '',
      };
      const fileName = `Assignment_${assignment.id}`;

      if (format === 'pdf') {
        await ExportUtils.generateAndSavePDF(
          [data],
          fileName,
          ['id', 'jobTitle', 'facilityName', 'department', 'status', 'hourlyRate', 'startDate', 'endDate'],
          `Assignment #${assignment.id}`
        );
      } else {
        await ExportUtils.exportToXLSXFile(
          [data],
          fileName,
          ['id', 'jobTitle', 'facilityName', 'department', 'status', 'hourlyRate', 'startDate', 'endDate']
        );
      }
    } catch (error) {
      console.error('Export assignment failed:', error);
      Alert.alert('Export Failed', 'Could not export assignment');
    } finally {
      setExportingAssignmentId(null);
    }
  };

  const handleExportAllAssignments = async (format: 'pdf' | 'excel') => {
    try {
      const list = filteredAssignments;
      if (!list || list.length === 0) {
        Alert.alert('Nothing to export', 'No assignments match the current filters');
        return;
      }
      const rows = list.map((a) => ({
        id: a.id,
        jobTitle: a.job?.title || '',
        facilityName: a.job?.facilityName || a.job?.location || '',
        department: a.job?.department || '',
        status: a.status || '',
        hourlyRate: a.job?.hourlyRate ?? '',
        startDate: a.job?.startDate || '',
        endDate: a.job?.endDate || '',
      }));
      const fileName = 'All_Assignments';
      if (format === 'pdf') {
        await ExportUtils.generateAndSavePDF(
          rows,
          fileName,
          ['id', 'jobTitle', 'facilityName', 'department', 'status', 'hourlyRate', 'startDate', 'endDate'],
          'All Assignments'
        );
      } else {
        await ExportUtils.exportToXLSXFile(
          rows,
          fileName,
          ['id', 'jobTitle', 'facilityName', 'department', 'status', 'hourlyRate', 'startDate', 'endDate']
        );
      }
    } catch (error) {
      console.error('Export all assignments failed:', error);
      Alert.alert('Export Failed', 'Could not export assignments');
    }
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
          <View style={styles.cardExportMenuRow}>
            <TouchableOpacity
              style={styles.exportDropdownButton}
              onPress={() => setShowAssignmentExportMenuForId(prev => prev === assignment.id ? null : assignment.id)}
              disabled={exportingAssignmentId === assignment.id}
            >
              {exportingAssignmentId === assignment.id ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.exportDropdownText}>Export</Text>
                  <FontAwesomeIcon icon={showAssignmentExportMenuForId === assignment.id ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
            {showAssignmentExportMenuForId === assignment.id && (
              <View style={[styles.exportDropdownMenu, { right: 0 }]}> 
                <TouchableOpacity
                  style={styles.exportDropdownItem}
                  onPress={() => { setShowAssignmentExportMenuForId(null); handleExportAssignment(assignment.id, 'pdf'); }}
                >
                  <FontAwesomeIcon icon="file-pdf" size={14} color={Colors.textPrimary} />
                  <Text style={styles.exportDropdownItemText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exportDropdownItem}
                  onPress={() => { setShowAssignmentExportMenuForId(null); handleExportAssignment(assignment.id, 'excel'); }}
                >
                  <FontAwesomeIcon icon="file-excel" size={14} color={Colors.textPrimary} />
                  <Text style={styles.exportDropdownItemText}>Excel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.assignmentDescription}>{job.description || 'No description available'}</Text>
        
        <View style={styles.assignmentDetails}>
          <View style={styles.assignmentDetail}>
            <FontAwesomeIcon icon="map-marker-alt" size={Responsive.iconSize(16)} color={Colors.textTertiary} />
            <Text style={styles.assignmentDetailText}>{job.location || 'Unknown Location'}</Text>
          </View>
          
          <View style={styles.assignmentDetail}>
            <FontAwesomeIcon icon="calendar" size={Responsive.iconSize(16)} color={Colors.textTertiary} />
            <Text style={styles.assignmentDetailText}>
              {job.startDate ? formatDate(job.startDate) : 'TBD'}
            </Text>
          </View>
          
          <View style={styles.assignmentDetail}>
            <FontAwesomeIcon icon="clock" size={Responsive.iconSize(16)} color={Colors.textTertiary} />
            <Text style={styles.assignmentDetailText}>
              {job.startTime && job.endTime ? `${formatTime(job.startTime)} - ${formatTime(job.endTime)}` : 'TBD'}
            </Text>
          </View>
          
          <View style={styles.assignmentDetail}>
            <FontAwesomeIcon icon="dollar-sign" size={Responsive.iconSize(16)} color={Colors.textTertiary} />
            <Text style={styles.assignmentDetailText}>${job.hourlyRate || 0}/hour</Text>
          </View>
        </View>

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
            <FontAwesomeIcon icon="arrow-left" size={Responsive.iconSize(24)} color={Colors.white} />
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
        {/* Export and Filter Row */}
        <View style={styles.toolsRow}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={styles.exportDropdownButton}
              onPress={() => setShowExportAllMenu(v => !v)}
              disabled={filteredAssignments.length === 0}
            >
              <Text style={styles.exportDropdownText}>Export All</Text>
              <FontAwesomeIcon icon={showExportAllMenu ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.white} />
            </TouchableOpacity>
            {showExportAllMenu && (
              <View style={styles.exportDropdownMenu}>
                <TouchableOpacity
                  style={styles.exportDropdownItem}
                  onPress={() => { setShowExportAllMenu(false); handleExportAllAssignments('pdf'); }}
                >
                  <FontAwesomeIcon icon="file-pdf" size={14} color={Colors.textPrimary} />
                  <Text style={styles.exportDropdownItemText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exportDropdownItem}
                  onPress={() => { setShowExportAllMenu(false); handleExportAllAssignments('excel'); }}
                >
                  <FontAwesomeIcon icon="file-excel" size={14} color={Colors.textPrimary} />
                  <Text style={styles.exportDropdownItemText}>Excel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.filterOutlineButton}
            onPress={() => setShowFilterModal(true)}
          >
            <FontAwesomeIcon icon="filter" size={14} color={Colors.textPrimary} />
            <Text style={styles.filterOutlineText}>Filter</Text>
          </TouchableOpacity>
        </View>

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
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <Text style={styles.filterTitle}>Filter Assignments</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Job Title</Text>
              <TextInput
                placeholder="Search by title"
                placeholderTextColor={Colors.textTertiary}
                style={styles.textInput}
                value={filterTitle}
                onChangeText={setFilterTitle}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusChipsRow}>
                {['', 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'].map((s) => (
                  <TouchableOpacity
                    key={s || 'ALL'}
                    style={[
                      styles.statusChip,
                      (filterStatus || '') === s && styles.statusChipActive,
                    ]}
                    onPress={() => setFilterStatus(s || null)}
                  >
                    <Text style={[
                      styles.statusChipText,
                      (filterStatus || '') === s && styles.statusChipTextActive,
                    ]}>
                      {s || 'All'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colors.background }]}
                onPress={() => { setFilterTitle(''); setFilterStatus(null); }}
              >
                <Text style={[styles.modalButtonText, { color: Colors.textPrimary }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: Colors.white }]}>Apply</Text>
              </TouchableOpacity>
            </View>
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
  cardExportMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
