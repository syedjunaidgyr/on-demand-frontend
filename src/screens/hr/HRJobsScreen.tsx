import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import LinearGradient from 'react-native-linear-gradient';
import GlobalHeader from '../../components/GlobalHeader';
import HRFooterNavigation from '../../components/HRFooterNavigation';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { Job } from '../../types';
import ApiService from '../../services/api';
import Responsive from '../../utils/responsive';

const HRJobsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  
  // Add scroll position tracking for footer transparency
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const [hasMore, setHasMore] = useState(true);
  const [assignVisible, setAssignVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async (pageNum = 1, refresh = false) => {
    try {
      console.log('🔧 Loading HR jobs...');
      const response = await ApiService.getAllJobs({
        page: pageNum,
        limit: 10,
      });

      console.log('📦 HR Jobs response:', response);

      // Handle different response formats
      const jobsData = response.jobs || response.data || [];
      const pagination = response.pagination || response;

      console.log('📋 Jobs data:', jobsData);
      console.log('📊 Jobs count:', jobsData.length);

      if (refresh || pageNum === 1) {
        setJobs(jobsData);
      } else {
        setJobs(prev => [...prev, ...jobsData]);
      }

      setHasMore(pagination.page < pagination.pages);
    } catch (error) {
      console.error('❌ Failed to load jobs:', error);
      Alert.alert('Error', 'Failed to load jobs. Please try again.');
      if (refresh || pageNum === 1) {
        setJobs([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadJobs(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadJobs(nextPage);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return Colors.success;
      case 'CANCELLED':
        return Colors.error;
      case 'COMPLETED':
        return Colors.info;
      case 'FILLED':
        return Colors.warning;
      default:
        return Colors.textTertiary;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) return '—';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    if (isNaN(hour)) return '—';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const mins = (minutes ?? '00').slice(0, 2);
    return `${displayHour}:${mins} ${ampm}`;
  };

  const handleJobPress = async (job: Job) => {
    try {
      setSelectedJob(job);
      setAssignVisible(true);
      setLoadingAssignments(true);
      const allAssignmentsResponse = await ApiService.getJobAssignments(job.id.toString());
      const allAssignments = allAssignmentsResponse.assignments || allAssignmentsResponse.data || allAssignmentsResponse || [];
      setAssignments(Array.isArray(allAssignments) ? allAssignments : []);
    } catch (error) {
      console.error('❌ Failed to load assignments:', error);
      Alert.alert('Error', 'Failed to load candidate details. Please try again.');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleCreateJob = () => {
    (navigation as any).navigate('CreateJob');
  };

  const handleAssignJobToStaff = async (job: Job) => {
    try {
      console.log('🔍 Assigning job to staff:', job.id, job.title);
      // Navigate to staff selection screen or show staff list
      // For now, let's show an alert with instructions
      Alert.alert(
        'Assign Job to Staff',
        `To assign "${job.title}" to staff members:\n\n1. Go to Staff Management\n2. Select compatible staff\n3. Send them job assignments\n4. Wait for them to accept\n5. Then review candidates here`,
        [
          { text: 'OK' },
          { 
            text: 'Go to Staff', 
            onPress: () => {
              // Navigate to staff management screen
              console.log('Navigate to staff management');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Failed to assign job to staff:', error);
      Alert.alert('Error', `Failed to assign job: ${error.message}`);
    }
  };

  const handleReviewCandidates = async (job: Job) => {
    try {
      console.log('🔍 HR reviewing candidates for job:', job.id, job.title);
      console.log('📊 Job assignments count:', job.assignments?.length || 0);
      console.log('📊 Job assignments:', job.assignments);
      
      // Get ALL assignments for this job and filter for accepted ones
      console.log('🔍 Getting ALL assignments for job:', job.id);
      const allAssignmentsResponse = await ApiService.getJobAssignments(job.id.toString());
      console.log('📦 All assignments response:', allAssignmentsResponse);
      
      // Filter for accepted assignments
      const allAssignments = allAssignmentsResponse.assignments || allAssignmentsResponse.data || allAssignmentsResponse || [];
      console.log('📋 All assignments array:', allAssignments);
      
      const acceptedAssignments = allAssignments.filter((assignment: any) => assignment.status === 'ACCEPTED');
      console.log('📋 Filtered accepted assignments:', acceptedAssignments);
      console.log('📋 Accepted assignments count:', acceptedAssignments?.length || 0);
      
      if (!acceptedAssignments || acceptedAssignments.length === 0) {
        Alert.alert(
          'No Accepted Candidates', 
          `No staff members have accepted this job yet.\n\nCurrent assignments:\n${allAssignments.map((a: any) => `- ${a.user?.firstName || 'Unknown'} ${a.user?.lastName || ''}: ${a.status}`).join('\n')}\n\nYou need staff to accept assignments first.`,
          [
            { text: 'OK' },
            { 
              text: 'Assign Job to Staff', 
              onPress: () => {
                console.log('Navigate to assign job to staff');
              }
            }
          ]
        );
        return;
      }
      
      (navigation as any).navigate('JobAssignment', { 
        jobId: job.id, 
        acceptedAssignments: acceptedAssignments 
      });
    } catch (error) {
      console.error('❌ Failed to load accepted assignments:', error);
      console.error('❌ Job details:', job);
      Alert.alert('Error', `Failed to load accepted assignments: ${error.message}`);
    }
  };

  const JobCard = ({ job }: { job: Job }) => {
    const currentAssignments = job.assignments?.length || 0;
    const pendingAssignments = job.assignments?.filter(a => a.status === 'PENDING').length || 0;
    const acceptedAssignments = job.assignments?.filter(a => a.status === 'ACCEPTED').length || 0;
    const assignedAssignments = job.assignments?.filter(a => a.status === 'ASSIGNED').length || 0;

    const initials = (job.title || 'J').trim().slice(0, 2).toUpperCase();
    const timeRange = `${formatTime(job.startTime)} - ${formatTime(job.endTime)}`;
    const dateRange = `${formatDate(job.startDate)} - ${formatDate(job.endDate)}`;
    const subtitleLeft = job.location || '—';
    const subtitleRight = timeRange;
    
    return (
      <TouchableOpacity style={styles.jobCard} onPress={() => handleJobPress(job)}>
        {/* Date header with edit button */}
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTimeText}>{dateRange}</Text>
          <TouchableOpacity style={styles.editTopButton} onPress={() => handleJobPress(job)}>
            <FontAwesomeIcon icon="edit" size={Responsive.iconSize(16)} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.cardDivider} />

        {/* Profile row */}
        <View style={styles.profileRow}>
          <View style={styles.profileContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{job.title}</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitleText} numberOfLines={1}>{subtitleLeft}</Text>
              <Text style={styles.subtitleDot}> • </Text>
              <Text style={styles.subtitleText} numberOfLines={1}>{subtitleRight}</Text>
              <Text style={styles.subtitleDot}> • </Text>
              <View style={[styles.inlineStatusPill, { backgroundColor: getStatusColor(job.status) + '1A' }]}>
                <Text style={[styles.inlineStatusText, { color: getStatusColor(job.status) }]} numberOfLines={1}>
                  {job.status}
                </Text>
              </View>
            </View>

            {/* Progress / Stat / Charge row (3 columns) */}
            <View style={styles.assignmentRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Progress</Text>
                <Text style={styles.infoValue}>Accepted: {acceptedAssignments}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Stat</Text>
                <View style={[styles.priorityPill, { backgroundColor: getPriorityColor(job.priority) + '1A' }]}>
                  <Text style={[styles.priorityPillText, { color: getPriorityColor(job.priority) }]} numberOfLines={1}>
                    {job.priority}
                  </Text>
                </View>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Charge</Text>
                <Text style={styles.infoValue}>₹{job.hourlyRate}/hr</Text>
              </View>
            </View>
          </View>
        </View>

        
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  if (isLoading && jobs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Compute filtered jobs for display
  const displayJobs = jobs.filter((j) => {
    try {
      // Status filter
      if (filterStatus && (j.status || '').toUpperCase() !== filterStatus.toUpperCase()) return false;
      // Priority filter
      if (filterPriority && (j.priority || '').toUpperCase() !== filterPriority.toUpperCase()) return false;
      // Date range filter (by startDate)
      if (filterFrom) {
        const from = new Date(filterFrom);
        const start = j.startDate ? new Date(j.startDate) : null;
        if (start && !isNaN(from.getTime())) {
          if (start < new Date(from.getFullYear(), from.getMonth(), from.getDate())) return false;
        }
      }
      if (filterTo) {
        const to = new Date(filterTo);
        const start = j.startDate ? new Date(j.startDate) : null;
        if (start && !isNaN(to.getTime())) {
          const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59);
          if (start > toEnd) return false;
        }
      }
      return true;
    } catch {
      return true;
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" translucent={false} />
      <GlobalHeader 
        title="Job Management"
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16 }}
        rightComponent={
          <TouchableOpacity onPress={() => setFilterVisible(true)} style={styles.headerIconButton}>
            <FontAwesomeIcon icon="filter" size={20} color="#111827" />
          </TouchableOpacity>
        }
      />

      {/* Jobs List */}
      <FlatList
        data={displayJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateJob}>
        <FontAwesomeIcon icon="plus" size={24} color={Colors.white}  />
      </TouchableOpacity>
      
      <HRFooterNavigation 
        activeRoute="Jobs" 
        scrollY={scrollY}
        todaysJobsCount={jobs.filter(j => {
          try {
            if (!j.startDate) return false;
            const d = new Date(j.startDate);
            const t = new Date();
            return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
          } catch {
            return false;
          }
        }).length}
      />
      <AssignBottomSheet
        visible={assignVisible}
        onClose={() => setAssignVisible(false)}
        job={selectedJob}
        assignments={assignments}
        loading={loadingAssignments}
        onAssignedSuccess={() => {
          // Close modal and refresh jobs list
          setAssignVisible(false);
          loadJobs(1, true);
        }}
      />

      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        from={filterFrom}
        to={filterTo}
        status={filterStatus}
        priority={filterPriority}
        onChangeFrom={setFilterFrom}
        onChangeTo={setFilterTo}
        onChangeStatus={setFilterStatus}
        onChangePriority={setFilterPriority}
        onClear={() => {
          setFilterFrom('');
          setFilterTo('');
          setFilterStatus('');
          setFilterPriority('');
        }}
      />
    </SafeAreaView>
  );
};

const AssignBottomSheet = ({
  visible,
  onClose,
  job,
  assignments,
  loading,
  onAssignedSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  job: Job | null;
  assignments: any[];
  loading: boolean;
  onAssignedSuccess?: () => void;
}) => {
  const localFormatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const localFormatTime = (timeString: string) => {
    if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) return '—';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    if (isNaN(hour)) return '—';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const mins = (minutes ?? '00').slice(0, 2);
    return `${displayHour}:${mins} ${ampm}`;
  };

  const accepted = (assignments || []).filter(a => a?.status === 'ACCEPTED');
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');

  const handleSelectCandidate = async (assignment: any) => {
    if (!job) return;
    const staff = assignment.staff || assignment.user || {};
    Alert.alert(
      'Select Candidate',
      `Select ${staff.firstName || ''} ${staff.lastName || ''} for this job?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select',
          onPress: async () => {
            try {
              setIsSelecting(true);
              await ApiService.selectCandidate(job.id.toString(), assignment.id?.toString());
              const f = staff.firstName || '';
              const l = staff.lastName || '';
              setConfirmText(`${f} ${l} has been assigned to this job.`.trim());
              setConfirmVisible(true);
              setTimeout(() => {
                setConfirmVisible(false);
                onClose();
                onAssignedSuccess && onAssignedSuccess();
              }, 1500);
            } catch (e: any) {
              setConfirmText(e?.message || 'Unable to select candidate.');
              setConfirmVisible(true);
              setTimeout(() => setConfirmVisible(false), 1500);
            } finally {
              setIsSelecting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={styles.sheetBackdropTouchable} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Review Candidates</Text>
          {/* <Text style={styles.sheetSubtitle} numberOfLines={2}>
            {job ? job.title : ''}
          </Text> */}
          <View style={styles.sheetDivider} />
          {loading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.sheetContent}>
              {/* Job details card */}
              {job && (
                <>
                  <Text style={styles.sheetSectionTitle}>Job Details</Text>
                  <View style={styles.jobDetailCard}>
                  <Text style={styles.jobDetailTitle} numberOfLines={2}>{job.title || '—'}</Text>
                  {!!job.description && (
                    <Text style={styles.jobDetailDescription} numberOfLines={3}>{job.description}</Text>
                  )}
                  <View style={styles.jobDetailGrid}>
                    {!!job.facilityName && (
                      <View style={styles.jobDetailItemRow}>
                        <Text style={styles.jobDetailLabel}>Facility</Text>
                        <Text style={styles.jobDetailValue} numberOfLines={1}>{job.facilityName}</Text>
                      </View>
                    )}
                    {!!job.location && (
                      <View style={styles.jobDetailItemRow}>
                        <Text style={styles.jobDetailLabel}>Location</Text>
                        <Text style={styles.jobDetailValue} numberOfLines={1}>{job.location}</Text>
                      </View>
                    )}
                    {!!job.department && (
                      <View style={styles.jobDetailItemRow}>
                        <Text style={styles.jobDetailLabel}>Department</Text>
                        <Text style={styles.jobDetailValue} numberOfLines={1}>{job.department}</Text>
                      </View>
                    )}
                    {!!job.specialization && (
                      <View style={styles.jobDetailItemRow}>
                        <Text style={styles.jobDetailLabel}>Specialization</Text>
                        <Text style={styles.jobDetailValue} numberOfLines={1}>{job.specialization}</Text>
                      </View>
                    )}
                    <View style={styles.jobDetailItemRow}>
                      <Text style={styles.jobDetailLabel}>Dates</Text>
                      <Text style={styles.jobDetailValue} numberOfLines={1}>
                        {`${(job.startDate ? localFormatDate(job.startDate as any) : '—')} - ${(job.endDate ? localFormatDate(job.endDate as any) : '—')}`}
                      </Text>
                    </View>
                    <View style={styles.jobDetailItemRow}>
                      <Text style={styles.jobDetailLabel}>Time</Text>
                      <Text style={styles.jobDetailValue} numberOfLines={1}>
                        {`${(job.startTime ? localFormatTime(job.startTime as any) : '—')} - ${(job.endTime ? localFormatTime(job.endTime as any) : '—')} • ${(job.status || '—')}`}
                      </Text>
                    </View>
                    
                    <View style={styles.jobDetailItemRow}>
                      <Text style={styles.jobDetailLabel}>Progress</Text>
                      <Text style={styles.jobDetailValue} numberOfLines={1}>
                        {`Accepted: ${(accepted.length || 0)} • ${job.hourlyRate ? `₹${job.hourlyRate}/hr` : '—'}`}
                      </Text>
                    </View>
                    <View style={styles.jobDetailItemRow}>
                      <Text style={styles.jobDetailLabel}>Priority</Text>
                      <Text style={styles.jobDetailValue}>{job.priority || '—'}</Text>
                    </View>
                    
                  </View>
                </View>
                </>
              )}

              <View style={{ marginBottom: 12 }}>
                {accepted.length === 0 ? (
                  <Text style={styles.sheetInfoText}>No accepted candidates yet.</Text>
                ) : (
                  accepted.map((a, idx) => {
                    const firstName = a?.user?.firstName || 'Unknown';
                    const lastName = a?.user?.lastName || '';
                    const fullName = `${firstName} ${lastName}`.trim();
                    const phone = a?.user?.phone || a?.user?.mobile || '—';
                    const email = a?.user?.email || '—';
                    const role = a?.user?.role || a?.user?.profession || '—';
                    const specialization = a?.user?.specialization || '';
                    const displayRole = specialization ? `${role} • ${specialization}` : role;
                    const acceptedAt = a?.updatedAt || a?.acceptedAt || a?.createdAt || undefined;
                    return (
                      <View key={`acc-${idx}`} style={styles.candidateCard}>
                        <View style={styles.candidateHeader}>
                          <Text style={styles.candidateName} numberOfLines={1}>{fullName}</Text>
                          <Text style={[styles.assignmentStatus, { color: Colors.success }]}>ACCEPTED</Text>
                        </View>
                        <Text style={styles.candidateRole} numberOfLines={1}>{displayRole}</Text>
                        <View style={styles.candidateInfoRow}>
                          <Text style={styles.candidateInfoLabel}>Phone:</Text>
                          <Text style={styles.candidateInfoValue} numberOfLines={1}>{phone}</Text>
                        </View>
                        <View style={styles.candidateInfoRow}>
                          <Text style={styles.candidateInfoLabel}>Email:</Text>
                          <Text style={styles.candidateInfoValue} numberOfLines={1}>{email}</Text>
                        </View>
                        {acceptedAt && (
                          <View style={styles.candidateInfoRow}>
                            <Text style={styles.candidateInfoLabel}>Accepted:</Text>
                            <Text style={styles.candidateInfoValue}>{new Date(acceptedAt).toLocaleString()}</Text>
                          </View>
                        )}
                        <TouchableOpacity 
                          style={styles.selectButton}
                          onPress={() => handleSelectCandidate(a)}
                          disabled={isSelecting}
                        >
                          {isSelecting ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                          ) : (
                            <>
                              <FontAwesomeIcon icon="check" size={16} color={Colors.white} />
                              <Text style={styles.selectButtonText}>Select Candidate</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          )}
          <TouchableOpacity style={styles.sheetCloseButton} onPress={onClose}>
            <Text style={styles.sheetCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
        {/* Centered confirmation popup */}
        {confirmVisible && (
          <View style={styles.fullscreenSuccessOverlay}>
            <View style={styles.fullscreenRightContent}>
              <FontAwesomeIcon icon="check-circle" size={40} color="#FFFFFF" />
              <Text style={styles.fullscreenSuccessTitle}>Success</Text>
              <Text style={styles.fullscreenSuccessMessage} numberOfLines={2}>{confirmText}</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const FilterBottomSheet = ({
  visible,
  onClose,
  from,
  to,
  status,
  priority,
  onChangeFrom,
  onChangeTo,
  onChangeStatus,
  onChangePriority,
  onClear,
}: {
  visible: boolean;
  onClose: () => void;
  from: string;
  to: string;
  status: string;
  priority: string;
  onChangeFrom: (v: string) => void;
  onChangeTo: (v: string) => void;
  onChangeStatus: (v: string) => void;
  onChangePriority: (v: string) => void;
  onClear: () => void;
}) => {
  const statuses = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'FILLED'];
  const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={styles.sheetBackdropTouchable} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Filters</Text>
          <View style={styles.sheetDivider} />

          <ScrollView contentContainerStyle={styles.sheetContent}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.filterRow}>
              <TextInput
                value={from}
                onChangeText={onChangeFrom}
                placeholder="From (YYYY-MM-DD)"
                placeholderTextColor={Colors.textSecondary}
                style={styles.input}
              />
              <TextInput
                value={to}
                onChangeText={onChangeTo}
                placeholder="To (YYYY-MM-DD)"
                placeholderTextColor={Colors.textSecondary}
                style={styles.input}
              />
            </View>

            <Text style={[styles.filterLabel, { marginTop: 12 }]}>Status</Text>
            <View style={styles.chipsRow}>
              {statuses.map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => onChangeStatus(status === s ? '' : s)}
                  style={[styles.chip, status === s && { backgroundColor: Colors.primary }]}>
                  <Text style={[styles.chipText, status === s && { color: Colors.white }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterLabel, { marginTop: 12 }]}>Priority</Text>
            <View style={styles.chipsRow}>
              {priorities.map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => onChangePriority(priority === p ? '' : p)}
                  style={[styles.chip, priority === p && { backgroundColor: Colors.primary }]}>
                  <Text style={[styles.chipText, priority === p && { color: Colors.white }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.filterActionsRow}>
            <TouchableOpacity style={styles.clearButton} onPress={onClear}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={onClose}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  header: {
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -20,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.white,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
  createButton: {
    width: Responsive.scale(40),
    height: Responsive.verticalScale(40),
    borderRadius: Responsive.scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: Responsive.scale(Spacing.md),
    paddingTop: Responsive.verticalScale(Spacing.sm),
    paddingBottom: Responsive.verticalScale(80),
  },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editTopButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarInitials: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: '#4C1D95',
  },
  profileContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
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
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'capitalize',
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
  cardRateText: {
    marginTop: 6,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  chargeText: {
    marginLeft: 'auto',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  // removed action buttons styles
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  jobTitleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  jobTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  jobRate: {
    alignItems: 'flex-end',
  },
  rateAmount: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  rateLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  jobDetails: {
    marginBottom: Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  jobDetailCol: {
    width: '48%',
  },
  jobDetailFull: {
    width: '100%',
  },
  jobDetailText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  // footer removed
  assignmentText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },
  pendingText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.warning,
  },
  acceptedText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.success,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  priorityPill: {
    marginTop: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityPillText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'capitalize',
  },
  // removed action button variants
  fab: {
    position: 'absolute',
    bottom: Responsive.verticalScale(Spacing['2xl']),
    right: Responsive.scale(Spacing.lg),
    width: Responsive.scale(56),
    height: Responsive.verticalScale(56),
    borderRadius: Responsive.scale(28),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.lg,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetBackdropTouchable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    maxHeight: '75%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  sheetSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  sheetContent: {
    paddingBottom: 16,
  },
  jobDetailCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  jobDetailTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  jobDetailDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  jobDetailGrid: {
    gap: 6,
  },
  jobDetailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobDetailLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textTertiary,
    width: 96,
  },
  jobDetailValue: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  sheetInfoText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  sheetSectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  filterLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  filterActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  clearButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  applyButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  candidateCard: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  candidateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  candidateName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  candidateRole: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  candidateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  candidateInfoLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
    width: 70,
  },
  candidateInfoValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flex: 1,
  },
  assignmentName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flex: 1,
    paddingRight: 10,
  },
  assignmentStatus: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  selectButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.success,
    gap: 8,
  },
  selectButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
  },
  sheetPrimaryButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  sheetPrimaryText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  sheetCloseButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  sheetCloseText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerCard: {
    width: '80%',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  centerTitle: {
    marginTop: 8,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  centerMessage: {
    marginTop: 6,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  centerButton: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  centerButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  fullscreenSuccessOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  fullscreenRightContent: {
    alignItems: 'flex-end',
    gap: 6,
  },
  fullscreenSuccessTitle: {
    fontSize: Typography.fontSize['2xl'] || 20,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  fullscreenSuccessMessage: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: '#FFFFFF',
    textAlign: 'right',
    maxWidth: '80%',
  },
});

export default HRJobsScreen;
