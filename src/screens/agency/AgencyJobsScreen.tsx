import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Animated,
  TextInput,
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../../services/api';
import { Typography } from '../../constants/typography';
import { FontAwesomeIcon } from '../../utils/icons';
import { Colors } from '../../constants/colors';
import Responsive from '../../utils/responsive';
import GlobalHeader from '../../components/GlobalHeader';
import { Job } from '../../types';
import { useAuth } from '../../navigation/AppNavigator';

const AgencyJobsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [jobAssignmentsMap, setJobAssignmentsMap] = useState<Record<string, any[]>>({});
  const [acceptingJobId, setAcceptingJobId] = useState<string | number | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (jobs.length > 0 && user?.id) {
      loadJobAssignments();
    }
  }, [jobs, user?.id]);

  const loadJobs = async (pageNum = 1, refresh = false) => {
    try {
      const response = await ApiService.getAllJobs({
        page: pageNum,
        limit: 10,
        requiredRole: 'AGENCY',
      });
      const jobsData = (response as any).jobs || (response as any).data || [];
      const pagination = (response as any).pagination || (response as any);
      const normalized = jobsData.map((j: any) => ({
        ...j,
        hourlyRate: typeof j.hourlyRate === 'string' ? parseFloat(j.hourlyRate) : j.hourlyRate,
      }));
      if (refresh || pageNum === 1) {
        setJobs(normalized);
      } else {
        setJobs(prev => [...prev, ...normalized]);
      }
      setHasMore(pagination?.page < pagination?.pages);
    } catch (error) {
      Alert.alert('Error', 'Failed to load jobs. Please try again.');
      if (refresh || pageNum === 1) setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadJobAssignments = async () => {
    try {
      const assignmentsMap: Record<string, any[]> = {};
      // Fetch assignments for all jobs in parallel
      const promises = jobs.map(async (job) => {
        try {
          const response = await ApiService.getAgencyJobAssignments(job.id.toString());
          const assignments = (response as any).assignments || (response as any).data || (Array.isArray(response) ? response : []);
          assignmentsMap[job.id.toString()] = Array.isArray(assignments) ? assignments : [];
        } catch (error) {
          console.error(`Failed to load assignments for job ${job.id}:`, error);
          assignmentsMap[job.id.toString()] = [];
        }
      });
      await Promise.all(promises);
      setJobAssignmentsMap(assignmentsMap);
    } catch (error) {
      console.error('Failed to load job assignments:', error);
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
      case 'URGENT': return '#EF4444';
      case 'HIGH': return '#F59E0B';
      case 'MEDIUM': return '#3B82F6';
      case 'LOW': return '#10B981';
      default: return Colors.primary;
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'ACTIVE': return Colors.success;
      case 'CANCELLED': return Colors.error;
      case 'COMPLETED': return Colors.info;
      case 'ASSIGNED': return Colors.warning;
      case 'IN_PROGRESS': return Colors.high;
      default: return Colors.textTertiary;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) return '—';
    const [h, m] = timeString.split(':');
    const hour = parseInt(h, 10);
    if (isNaN(hour)) return '—';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const mins = (m ?? '00').slice(0, 2);
    return `${displayHour}:${mins} ${ampm}`;
  };

  const handleJobPress = async (job: Job) => {
    try {
      setSelectedJob(job);
      setAssignVisible(true);
      setLoadingAssignments(true);
      const allAssignmentsResponse = await ApiService.getAgencyJobAssignments(job.id.toString());
      const allAssignments = (allAssignmentsResponse as any).assignments || (allAssignmentsResponse as any).data || (allAssignmentsResponse as any) || [];
      setAssignments(Array.isArray(allAssignments) ? allAssignments : []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load candidate details. Please try again.');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleAcceptJob = async (jobId: string | number, assignmentId: string | number) => {
    try {
      setAcceptingJobId(assignmentId);
      await ApiService.respondToAssignment(String(assignmentId), 'ACCEPT');
      Alert.alert('Success', 'Job accepted successfully.');
      // Refresh assignments for this job
      try {
        const response = await ApiService.getAgencyJobAssignments(String(jobId));
        const assignments = (response as any).assignments || (response as any).data || (Array.isArray(response) ? response : []);
        setJobAssignmentsMap(prev => ({
          ...prev,
          [String(jobId)]: Array.isArray(assignments) ? assignments : []
        }));
      } catch (error) {
        console.error('Failed to refresh assignments:', error);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to accept job. Please try again.');
    } finally {
      setAcceptingJobId(null);
    }
  };

  const handleAcceptJobWithoutAssignment = async (jobId: string | number) => {
    try {
      setAcceptingJobId(jobId);
      // First, fetch assignments for this job
      const response = await ApiService.getAgencyJobAssignments(String(jobId));
      const assignments = (response as any).assignments || (response as any).data || (Array.isArray(response) ? response : []);
      const allAssignments = Array.isArray(assignments) ? assignments : [];
      
      // Update the map
      setJobAssignmentsMap(prev => ({
        ...prev,
        [String(jobId)]: allAssignments
      }));
      
      // Find assignment for current user
      const currentUserAssignment = allAssignments.find((a: any) => {
        const assignmentUserId = a.userId || a.user?.id || a.agencyId || a.agency?.id || a.assignedBy;
        return String(assignmentUserId) === String(user?.id);
      });
      
      if (currentUserAssignment && currentUserAssignment.id) {
        // If found, accept it
        await handleAcceptJob(jobId, currentUserAssignment.id);
      } else {
        Alert.alert('Info', 'No assignment found for this job. Please contact support.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load assignments. Please try again.');
    } finally {
      setAcceptingJobId(null);
    }
  };

  const JobCard = ({ job }: { job: Job }) => {
    const dateRange = `${formatDate(job.startDate)} - ${formatDate(job.endDate)}`;
    const timeRange = `${formatTime(job.startTime)} - ${formatTime(job.endTime)}`;
    const subtitleLeft = job.location || '—';
    const subtitleRight = timeRange;
    const acceptedAssignments = (((job as any).assignments || []) as any[]).filter((a: any) => a.status === 'ACCEPTED').length || 0;
    const isActive = String(job.status || '').toUpperCase() === 'ACTIVE';
    
    // Find assignment for this job for the current agency user
    const jobAssignments = jobAssignmentsMap[job.id.toString()] || [];
    const currentUserAssignment = jobAssignments.find((a: any) => {
      const assignmentUserId = a.userId || a.user?.id || a.agencyId || a.agency?.id || a.assignedBy;
      return String(assignmentUserId) === String(user?.id);
    });
    
    // Debug logging
    if (isActive) {
      console.log(`Job ${job.id}: assignments=${jobAssignments.length}, currentUser=${user?.id}, foundAssignment=${!!currentUserAssignment}`);
      if (currentUserAssignment) {
        console.log(`  Assignment: id=${currentUserAssignment.id}, status=${currentUserAssignment.status}`);
      }
    }
    
    const assignmentStatus = currentUserAssignment ? String(currentUserAssignment.status || '').toUpperCase() : null;
    const isAccepted = assignmentStatus === 'ACCEPTED';
    const isPending = assignmentStatus === 'PENDING';
    const hasNoAssignment = !currentUserAssignment;
    const assignmentId = currentUserAssignment?.id;
    
    // Show Accept Job button if:
    // 1. Job is active AND (has no assignment OR assignment is pending)
    // 2. Show Assign Nurse button if assignment is accepted

    return (
      <TouchableOpacity style={styles.jobCard} onPress={() => handleJobPress(job)}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTimeText}>{dateRange}</Text>
          <TouchableOpacity style={styles.editTopButton} onPress={() => handleJobPress(job)}>
            <FontAwesomeIcon icon="edit" size={Responsive.iconSize(16)} color={'#6B7280'} />
          </TouchableOpacity>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.profileRow}>
          <View style={styles.profileContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{job.title}</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitleText} numberOfLines={1}>{subtitleLeft}</Text>
              <Text style={styles.subtitleDot}> • </Text>
              <Text style={styles.subtitleText} numberOfLines={1}>{subtitleRight}</Text>
              <Text style={styles.subtitleDot}> • </Text>
              <View style={[styles.inlineStatusPill, { backgroundColor: getStatusColor(job.status) + '1A' }]}>
                <Text style={[styles.inlineStatusText, { color: getStatusColor(job.status) }]} numberOfLines={1}>{job.status}</Text>
              </View>
            </View>
            <View style={styles.assignmentRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Progress</Text>
                <Text style={styles.infoValue}>Accepted: {acceptedAssignments}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Stat</Text>
                <View style={[styles.priorityPill, { backgroundColor: getPriorityColor(job.priority) + '1A' }]}>
                  <Text style={[styles.priorityPillText, { color: getPriorityColor(job.priority) }]} numberOfLines={1}>{job.priority}</Text>
                </View>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Charge</Text>
                <Text style={styles.infoValue}>₹{job.hourlyRate}/hr</Text>
              </View>
            </View>
            {isActive && (
              <View style={{ marginTop: 10, flexDirection: 'row' }}>
                {isAccepted ? (
                  <TouchableOpacity
                    style={styles.assignBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      (navigation as any).navigate('AgencyAssignNurse', { jobId: String(job.id), hourlyRate: Number(job.hourlyRate) || undefined, mode: 'FULL' });
                    }}
                  >
                    <FontAwesomeIcon icon="user-plus" size={16} color={Colors.white} />
                    <Text style={styles.assignBtnTxt}>Assign Nurse</Text>
                  </TouchableOpacity>
                ) : (isPending && assignmentId) || hasNoAssignment ? (
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (assignmentId) {
                        handleAcceptJob(job.id, assignmentId);
                      } else {
                        // If no assignment found, try to fetch it first
                        handleAcceptJobWithoutAssignment(job.id);
                      }
                    }}
                    disabled={acceptingJobId === assignmentId || acceptingJobId === job.id}
                  >
                    {(acceptingJobId === assignmentId || acceptingJobId === job.id) ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <FontAwesomeIcon icon="check" size={16} color={Colors.white} />
                        <Text style={styles.acceptBtnTxt}>Accept Job</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Compute filtered jobs for display
  const displayJobs = jobs.filter((j) => {
    try {
      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const title = (j.title || '').toLowerCase();
        if (!title.includes(q)) return false;
      }
      if (filterStatus && (j.status || '').toUpperCase() !== filterStatus.toUpperCase()) return false;
      if (filterPriority && (j.priority || '').toUpperCase() !== filterPriority.toUpperCase()) return false;
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
        onBackPress={() => (navigation as any).goBack?.()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16 }}
        rightComponent={
          <TouchableOpacity onPress={() => setFilterVisible(true)} style={styles.headerIconButton}>
            <FontAwesomeIcon icon="filter" size={20} color="#111827" />
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesomeIcon icon="search" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title"
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesomeIcon icon="times" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Jobs List */}
      <FlatList
        data={displayJobs}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <JobCard job={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoading ? (
          <View style={styles.footerLoader}><ActivityIndicator size="small" color={Colors.primary} /></View>
        ) : null}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />


      <AssignBottomSheet
        visible={assignVisible}
        onClose={() => setAssignVisible(false)}
        job={selectedJob}
        assignments={assignments}
        loading={loadingAssignments}
        onAssignedSuccess={() => {
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
  const { user } = useAuth();
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

  // Show only nurses assigned by this agency (exclude the agency self-assignment)
  const agencyCandidates = (assignments || []).filter((a: any) => {
    // Exclude agency users
    const role = a?.user?.role || a?.user?.profession;
    const isAgencyUser = String(role || '').toUpperCase() === 'AGENCY';
    if (isAgencyUser) return false;
    
    // Only show candidates assigned by this agency
    const agencyId = user?.id;
    const assignedByThisAgency = String(a?.assignedBy || '') === String(agencyId);
    const agencyIdMatch = String(a?.agencyId || '') === String(agencyId);
    
    // Return true only if assigned by this agency
    return assignedByThisAgency || agencyIdMatch;
  });
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
              await ApiService.selectCandidateForAgency(job.id.toString(), assignment.id?.toString());
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
          <View style={styles.sheetDivider} />
          {loading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.sheetContent}>
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
                        {`Candidates: ${(agencyCandidates.length || 0)} • ${job.hourlyRate ? `₹${job.hourlyRate}/hr` : '—'}`}
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
                {agencyCandidates.length === 0 ? (
                  <Text style={styles.sheetInfoText}>No candidates assigned by agency yet.</Text>
                ) : (
                  agencyCandidates.map((a, idx) => {
                    const firstName = a?.user?.firstName || 'Unknown';
                    const lastName = a?.user?.lastName || '';
                    const fullName = `${firstName} ${lastName}`.trim();
                    const phone = a?.user?.phone || a?.user?.mobile || '—';
                    const email = a?.user?.email || '—';
                    const role = a?.user?.role || a?.user?.profession || '—';
                    const specialization = a?.user?.specialization || '';
                    const displayRole = specialization ? `${role} • ${specialization}` : role;
                    const acceptedAt = a?.acceptedAt || a?.updatedAt || a?.createdAt || undefined;
                    const status = (a?.status || '').toUpperCase();
                    return (
                      <View key={`acc-${idx}`} style={styles.candidateCard}>
                        <View style={styles.candidateHeader}>
                          <Text style={styles.candidateName} numberOfLines={1}>{fullName}</Text>
                          <Text style={[styles.assignmentStatus, { color: status === 'ACCEPTED' ? Colors.success : status === 'ASSIGNED' ? Colors.warning : Colors.textSecondary }]}>{status}</Text>
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
                        {status === 'PENDING' && (
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
                        )}
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
  const statuses = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'FILLED', 'ASSIGNED', 'IN_PROGRESS'];
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
                  style={[styles.chip, status === s && { backgroundColor: Colors.primary }]}
                >
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
                  style={[styles.chip, priority === p && { backgroundColor: Colors.primary }]}
                >
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
  container: { flex: 1, backgroundColor: Colors.background },
  listContainer: { paddingHorizontal: Responsive.scale(12), paddingTop: Responsive.verticalScale(8), paddingBottom: Responsive.verticalScale(80) },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: Colors.textSecondary, fontFamily: Typography.fontFamily.medium },
  searchContainer: { paddingHorizontal: Responsive.scale(12), paddingBottom: Responsive.verticalScale(8), backgroundColor: Colors.background, marginTop: Responsive.verticalScale(8) },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.borderLight, minHeight: 48 },
  searchInput: { flex: 1, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular, color: Colors.textPrimary, marginLeft: 8, paddingVertical: 0 },
  jobCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTimeText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textTertiary, marginBottom: 6 },
  cardDivider: { height: 1, backgroundColor: Colors.borderLight, marginBottom: 8 },
  editTopButton: { paddingHorizontal: 8, paddingVertical: 6 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  profileContent: { flex: 1 },
  cardTitle: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: 4, flexShrink: 1 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'nowrap' },
  subtitleText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, flexShrink: 1, maxWidth: '45%' },
  subtitleDot: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginHorizontal: 6 },
  inlineStatusPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  inlineStatusText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, textTransform: 'capitalize' },
  assignmentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: Colors.textTertiary },
  infoValue: { marginTop: 2, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary },
  priorityPill: { marginTop: 2, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  priorityPillText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.bold, textTransform: 'capitalize' },
  assignBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  assignBtnTxt: { color: Colors.white, fontFamily: Typography.fontFamily.bold, marginLeft: 8 },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.success, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  acceptBtnTxt: { color: Colors.white, fontFamily: Typography.fontFamily.bold, marginLeft: 8 },
  fab: { position: 'absolute', bottom: Responsive.verticalScale(24 * 2), right: Responsive.scale(16), width: Responsive.scale(56), height: Responsive.verticalScale(56), borderRadius: Responsive.scale(28), backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  headerIconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  // bottom sheet styles (mirrored)
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetBackdropTouchable: { flex: 1 },
  sheetContainer: { backgroundColor: Colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, maxHeight: '75%' },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, marginBottom: 8 },
  sheetTitle: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary },
  sheetDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 12 },
  sheetContent: { paddingBottom: 16 },
  jobDetailCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight },
  jobDetailTitle: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: 6 },
  jobDetailDescription: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, marginBottom: 10 },
  jobDetailGrid: { gap: 6 },
  jobDetailItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  jobDetailLabel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.bold, color: Colors.textTertiary, width: 96 },
  jobDetailValue: { flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, marginLeft: 8 },
  sheetInfoText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
  sheetSectionTitle: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: 6 },
  candidateCard: { borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 10, padding: 10, marginBottom: 8 },
  candidateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  candidateName: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, flex: 1, marginRight: 8 },
  candidateRole: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary, marginBottom: 6 },
  candidateInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  candidateInfoLabel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: Colors.textTertiary, width: 70 },
  candidateInfoValue: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.textPrimary, flex: 1 },
  assignmentStatus: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.bold },
  selectButton: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.success, gap: 8 },
  selectButtonText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: Colors.white },
  sheetCloseButton: { height: 44, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  sheetCloseText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary },
  fullscreenSuccessOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 24 },
  fullscreenRightContent: { alignItems: 'flex-end', gap: 6 },
  fullscreenSuccessTitle: { fontSize: Typography.fontSize['2xl'] || 20, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  fullscreenSuccessMessage: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: '#FFFFFF', textAlign: 'right', maxWidth: '80%' },
  filterLabel: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, marginBottom: 6 },
  filterRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: Colors.borderLight, paddingHorizontal: 12, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.textPrimary, backgroundColor: Colors.white },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.background },
  chipText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary },
  filterActionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  clearButton: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  clearButtonText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary },
  applyButton: { flex: 1, height: 44, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  applyButtonText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.white },
});

export default AgencyJobsScreen;


