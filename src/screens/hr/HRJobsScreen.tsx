import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { SkeletonJobCard, SkeletonSearchBar } from '../../components/SkeletonComponents';
import { usePermissions } from '../../hooks/usePermissions';

const HRJobsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
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
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState(false);

  // Hardcoded departments (same as registration)
  const medicalSpecialties = [
    'Emergency Medicine',
    'General Medicine',
    'General Surgery',
    'Obstetrics & Gynecology',
    'Pediatrics',
    'Orthopedics',
    'Cardiology',
    'Neurology',
    'Urology',
    'Nephrology',
    'Gastroenterology',
    'Oncology',
    'ENT',
    'Ophthalmology',
    'Dermatology',
    'Psychiatry',
    'Radiology',
    'Pathology',
    'Anesthesiology',
    'Physiotherapy',
  ];

  // Success bottom-sheet modal state (registration-style)
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successText, setSuccessText] = useState('Success');
  const { height } = Dimensions.get('window');
  const modalSlideAnim = React.useRef(new Animated.Value(height)).current;
  const checkmarkScale = React.useRef(new Animated.Value(0)).current;
  const sparkleScale1 = React.useRef(new Animated.Value(0)).current;
  const sparkleScale2 = React.useRef(new Animated.Value(0)).current;
  const sparkleScale3 = React.useRef(new Animated.Value(0)).current;
  const sparkleScale4 = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (showSuccessModal) {
      // slide up
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
      // checkmark + sparkles
      Animated.spring(checkmarkScale, { toValue: 1, useNativeDriver: true }).start();
      setTimeout(() => Animated.spring(sparkleScale1, { toValue: 1, useNativeDriver: true }).start(), 50);
      setTimeout(() => Animated.spring(sparkleScale2, { toValue: 1, useNativeDriver: true }).start(), 120);
      setTimeout(() => Animated.spring(sparkleScale3, { toValue: 1, useNativeDriver: true }).start(), 180);
      setTimeout(() => Animated.spring(sparkleScale4, { toValue: 1, useNativeDriver: true }).start(), 240);
    } else {
      // reset when closed
      modalSlideAnim.setValue(height);
      checkmarkScale.setValue(0);
      sparkleScale1.setValue(0);
      sparkleScale2.setValue(0);
      sparkleScale3.setValue(0);
      sparkleScale4.setValue(0);
    }
  }, [showSuccessModal, height, modalSlideAnim, checkmarkScale, sparkleScale1, sparkleScale2, sparkleScale3, sparkleScale4]);

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
      case 'ASSIGNED':
        return Colors.primary;
      case 'ACCEPTED':
        return Colors.primary;
      case 'CHECKED_OUT':
        return Colors.info;
      case 'IN_PROGRESS':
        return Colors.warning;
      default:
        return Colors.textTertiary;
    }
  };

  // Compute display status based on assignments
  const getDisplayStatus = (job: Job): string => {
    const assignments = (job as any).assignments || [];
    
    // If no assignments, return job's original status
    if (assignments.length === 0) {
      return job.status || 'ACTIVE';
    }

    // Check if all assignments are completed
    const allCompleted = assignments.every((a: any) => {
      const s = String(a.status || '').toUpperCase();
      return s === 'COMPLETED' || s === 'CHECKED_OUT';
    });
    if (allCompleted) {
      return 'COMPLETED';
    }

    // Check if any assignment is in progress
    const hasInProgress = assignments.some((a: any) => String(a.status || '').toUpperCase() === 'IN_PROGRESS');
    if (hasInProgress) {
      return 'IN_PROGRESS';
    }

    // Check if any assignment is accepted or assigned
    const hasAcceptedOrAssigned = assignments.some((a: any) => 
      ['ACCEPTED', 'ASSIGNED'].includes(String(a.status || '').toUpperCase())
    );
    if (hasAcceptedOrAssigned) {
      return 'ASSIGNED';
    }

    // Otherwise return job's original status
    return job.status || 'ACTIVE';
  };

  // Assignment-focused status (prefers the current user's assignment when available)
  const getAssignmentDisplayStatus = (job: Job): string => {
    const assignments = (job as any).assignments || [];
    if (assignments.length === 0) return job.status || 'ACTIVE';
    // Prefer any decisive terminal state first
    if (assignments.some((a: any) => ['COMPLETED', 'CHECKED_OUT'].includes(String(a.status || '').toUpperCase()))) return 'COMPLETED';
    if (assignments.some((a: any) => String(a.status || '').toUpperCase() === 'IN_PROGRESS')) return 'IN_PROGRESS';
    if (assignments.some((a: any) => String(a.status || '').toUpperCase() === 'ACCEPTED')) return 'ACCEPTED';
    if (assignments.some((a: any) => String(a.status || '').toUpperCase() === 'ASSIGNED')) return 'ASSIGNED';
    return job.status || 'ACTIVE';
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

  const handleCreateJob = () => {
    // Check permission before navigating
    if (!hasPermission('JOB_CREATE')) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to create jobs. Please contact your administrator.',
        [{ text: 'OK' }]
      );
      return;
    }
    (navigation as any).navigate('CreateJob');
  };

  const handleRecreateJob = (job: Job) => {
    // Prepare job data for recreation (excluding dates and times)
    const jobAny = job as any;
    const recreateData = {
      title: job.title || '',
      description: job.description || '',
      department: job.department || '',
      location: job.location || '',
      requiredRole: job.requiredRole || 'DOCTOR',
      specialization: job.specialization || '',
      hourlyRate: job.hourlyRate?.toString() || '',
      priority: job.priority || 'MEDIUM',
      maxAssignments: job.maxAssignments?.toString() || '',
      hospitalId: jobAny.hospitalId?.toString() || '',
      unitCode: jobAny.unitCode || '',
      facilityName: job.facilityName || '',
      facilityStreet: job.facilityAddress?.street || '',
      facilityCity: job.facilityAddress?.city || '',
      facilityState: job.facilityAddress?.state || '',
      facilityZipCode: job.facilityAddress?.zipCode || '',
      facilityCountry: job.facilityAddress?.country || '',
      // Contact information
      contactName: job.contactPerson?.name || '',
      contactPhone: job.contactPerson?.phone || '',
      contactEmail: job.contactPerson?.email || '',
      contactPosition: job.contactPerson?.position || '',
      // Requirements
      experience: job.requirements?.experience || '',
      skills: job.requirements?.skills?.join(', ') || '',
      boardCertified: job.requirements?.boardCertified || false,
      // Benefits
      mealAllowance: job.benefits?.mealAllowance || false,
      parking: job.benefits?.parking || false,
      malpractice: job.benefits?.malpractice || false,
      // Additional information
      notes: job.notes || '',
      // Start and end dates/times are NOT included - they will be empty
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
    };
    
    (navigation as any).navigate('CreateJob', { recreateJobData: recreateData });
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

  const JobCard = ({ job }: { job: Job }) => {
    const assignments = (job as any).assignments || [];
    const currentAssignments = assignments.length || 0;
    const pendingAssignments = assignments.filter((a: any) => a.status === 'PENDING').length || 0;
    const acceptedAssignments = assignments.filter((a: any) => a.status === 'ACCEPTED').length || 0;
    const assignedAssignments = assignments.filter((a: any) => a.status === 'ASSIGNED').length || 0;

    const initials = (job.title || 'J').trim().slice(0, 2).toUpperCase();
    const timeRange = `${formatTime(job.startTime)} - ${formatTime(job.endTime)}`;
    const dateRange = `${formatDate(job.startDate)} - ${formatDate(job.endDate)}`;
    const subtitleLeft = job.location || '—';
    const subtitleRight = timeRange;
    const displayStatus = getDisplayStatus(job);
    
    return (
      <TouchableOpacity 
        style={styles.jobCard}
        onPress={() => handleReviewCandidates(job)}
        activeOpacity={0.8}
      >
        {/* Date header with recreate button */}
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTimeText}>{dateRange}</Text>
          {displayStatus === 'COMPLETED' && (
            <TouchableOpacity 
              style={[styles.recreateButton, { marginTop: -10 }]}
              onPress={() => handleRecreateJob(job)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <FontAwesomeIcon icon="edit" size={Responsive.iconSize(16)} color={Colors.primary} />
            </TouchableOpacity>
          )}
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
              {/* Status pill */}
              <View style={[styles.inlineStatusPill, { backgroundColor: getStatusColor(displayStatus) + '1A' }]}> 
                <Text style={[styles.inlineStatusText, { color: getStatusColor(displayStatus) }]} numberOfLines={1}>
                  {displayStatus}
                </Text>
              </View>
            </View>

            {/* Progress / Stat / Charge row (3 columns) */}
            <View style={styles.assignmentRow}>
              <View style={[styles.infoCol, { marginHorizontal: 6 }]}>
                <Text style={styles.infoLabel}>Progress</Text>
                <Text style={styles.infoValue}>Accepted: {acceptedAssignments}</Text>
              </View>
              <View style={[styles.infoCol, { marginHorizontal: 6 }]}>
                <Text style={styles.infoLabel}>Stat</Text>
                <View style={[styles.priorityPill, { backgroundColor: getPriorityColor(job.priority) + '1A' }]}>
                  <Text style={[styles.priorityPillText, { color: getPriorityColor(job.priority) }]} numberOfLines={1}>
                    {job.priority}
                  </Text>
                </View>
              </View>
              <View style={[styles.infoCol, { marginHorizontal: 6 }]}>
                <Text style={styles.infoLabel}>Charge</Text>
                <Text style={styles.infoValue}>₹{job.hourlyRate}/hr</Text>
              </View>
            </View>

            {/* Department row */}
            <View style={styles.departmentRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{job.department || '—'}</Text>
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


  // Compute filtered jobs for display
  const displayJobs = jobs.filter((j) => {
    try {
      // Broad text search across job card fields
      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const addr = (j as any)?.facilityAddress || {};
        const bucket = [
          j.id?.toString() || '',
          j.title || '',
          j.description || '',
          j.department || '',
          j.location || '',
          j.requiredRole || '',
          j.specialization || '',
          j.priority || '',
          j.status || '',
          j.facilityName || '',
          addr.street || '', addr.city || '', addr.state || '', addr.country || '', addr.zipCode || '',
          (j as any)?.unitCode || '',
          j.hourlyRate != null ? String(j.hourlyRate) : '',
          j.startTime || '', j.endTime || '',
          j.startDate ? new Date(j.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
          j.endDate ? new Date(j.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        ].join(' ').toLowerCase();
        if (!bucket.includes(q)) return false;
      }
      // Status filter (use computed display status so COMPLETED works based on assignments)
      if (filterStatus) {
        const computed = getDisplayStatus(j).toUpperCase();
        if (computed !== filterStatus.toUpperCase()) return false;
      }
      // Priority filter
      if (filterPriority && (j.priority || '').toUpperCase() !== filterPriority.toUpperCase()) return false;
      // Department filter
      if (filterDepartment && (j.department || '').toLowerCase() !== filterDepartment.toLowerCase()) return false;
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => setShowSearch(prev => !prev)} style={styles.headerIconButton}>
              <FontAwesomeIcon icon="search" size={20} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFilterVisible(true)} style={styles.headerIconButton}>
              <FontAwesomeIcon icon="filter" size={20} color="#111827" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Bar */}
      {isLoading && jobs.length === 0 ? (
        <SkeletonSearchBar />
      ) : (
        showSearch ? (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <FontAwesomeIcon icon="search" size={16} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search jobs (title, location, department, etc.)"
                placeholderTextColor={Colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <FontAwesomeIcon icon="times" size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null
      )}

      {/* Jobs List */}
      {isLoading && jobs.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}>
          {[...Array(5)].map((_, i) => (
            <SkeletonJobCard key={i} />
          ))}
        </ScrollView>
      ) : (
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
      )}

      {/* Floating Action Button */}
      {isLoading ? (
        <View style={[styles.fab, { backgroundColor: Colors.borderLight }]}>
          <View style={styles.fabContent}>
            <View style={styles.fabIconSkeleton} />
            <View style={styles.fabTextSkeleton} />
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={handleCreateJob} 
          activeOpacity={0.8}
        >
          <View style={styles.fabContent}>
            <FontAwesomeIcon icon="plus" size={Responsive.iconSize(20)} color={Colors.white} />
            <Text style={styles.fabText}>Add Job</Text>
          </View>
        </TouchableOpacity>
      )}
      
      <HRFooterNavigation 
        activeRoute="Jobs" 
        scrollY={scrollY}
        isLoading={isLoading}
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
        onShowSuccess={(text: string) => {
          setSuccessText(text || 'Success');
          setShowSuccessModal(true);
          setTimeout(() => {
            setShowSuccessModal(false);
          }, 1500);
        }}
      />

      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        from={filterFrom}
        to={filterTo}
        status={filterStatus}
        priority={filterPriority}
        department={filterDepartment}
        onChangeFrom={setFilterFrom}
        onChangeTo={setFilterTo}
        onChangeStatus={setFilterStatus}
        onChangePriority={setFilterPriority}
        onChangeDepartment={setFilterDepartment}
        departments={medicalSpecialties}
        onClear={() => {
          setFilterFrom('');
          setFilterTo('');
          setFilterStatus('');
          setFilterPriority('');
          setFilterDepartment('');
        }}
      />

      {/* Registration-style Success Bottom Sheet */}
      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowSuccessModal(false)} />
          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ translateY: modalSlideAnim }] }
            ]}
          >
            <View style={styles.modalIconContainer}>
              <Animated.View style={[styles.sparkle, styles.sparkle1, { transform: [{ scale: sparkleScale1 }] }]}>
                <FontAwesomeIcon icon="star" size={20} color="#FFD700" />
              </Animated.View>
              <Animated.View style={[styles.sparkle, styles.sparkle2, { transform: [{ scale: sparkleScale2 }] }]}>
                <FontAwesomeIcon icon="star" size={18} color="#C0C0C0" />
              </Animated.View>
              <Animated.View style={[styles.sparkle, styles.sparkle3, { transform: [{ scale: sparkleScale3 }] }]}>
                <FontAwesomeIcon icon="star" size={18} color="#FFB6C1" />
              </Animated.View>
              <Animated.View style={[styles.sparkle, styles.sparkle4, { transform: [{ scale: sparkleScale4 }] }]}>
                <FontAwesomeIcon icon="star" size={16} color="#87CEEB" />
              </Animated.View>
              <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
                <FontAwesomeIcon icon="check-circle" size={Responsive.iconSize(64)} color="#4CAF50" />
              </Animated.View>
            </View>
            <Text style={styles.successModalTitle}>Success</Text>
            <Text style={styles.modalMessage}>{successText}</Text>
            <TouchableOpacity style={styles.modalDoneButton} onPress={() => setShowSuccessModal(false)}>
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
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
  onShowSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  job: Job | null;
  assignments: any[];
  loading: boolean;
  onAssignedSuccess?: () => void;
  onShowSuccess?: (text: string) => void;
  onSheetScroll?: (e: any) => void;
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
      case 'ASSIGNED':
        return Colors.primary;
      case 'IN_PROGRESS':
        return Colors.warning;
      default:
        return Colors.textTertiary;
    }
  };

  // Compute display status based on assignments
  const getDisplayStatus = (job: Job | null): string => {
    if (!job) return 'ACTIVE';
    const assignments = (job as any).assignments || [];
    
    // If no assignments, return job's original status
    if (assignments.length === 0) {
      return job.status || 'ACTIVE';
    }

    // Check if all assignments are completed
    const allCompleted = assignments.every((a: any) => a.status === 'COMPLETED');
    if (allCompleted) {
      return 'COMPLETED';
    }

    // Check if any assignment is in progress
    const hasInProgress = assignments.some((a: any) => a.status === 'IN_PROGRESS');
    if (hasInProgress) {
      return 'IN_PROGRESS';
    }

    // Check if any assignment is accepted or assigned
    const hasAcceptedOrAssigned = assignments.some((a: any) => 
      a.status === 'ACCEPTED' || a.status === 'ASSIGNED'
    );
    if (hasAcceptedOrAssigned) {
      return 'ASSIGNED';
    }

    // Otherwise return job's original status
    return job.status || 'ACTIVE';
  };

  const accepted = (assignments || []).filter(a => a?.status === 'ACCEPTED');
  const [isSelecting, setIsSelecting] = React.useState(false);
  const displayStatus = getDisplayStatus(job);

  // Swipe down to close
  const dragY = React.useRef(new Animated.Value(0)).current;
  const isClosingRef = React.useRef(false);
  const scrollOffsetRef = React.useRef(0);
  const [sheetDragActive, setSheetDragActive] = React.useState(false);
  React.useEffect(() => {
    if (!visible) {
      dragY.setValue(0);
      isClosingRef.current = false;
    }
  }, [visible, dragY]);
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only take over when at top of scroll and dragging downward
        return scrollOffsetRef.current <= 0 && Math.abs(gesture.dy) > Math.abs(gesture.dx) && gesture.dy > 5;
      },
      onPanResponderGrant: () => {
        setSheetDragActive(true);
      },
      onPanResponderMove: (_, gesture) => {
        if (isClosingRef.current) return;
        if (gesture.dy > 0) {
          dragY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (isClosingRef.current) return;
        if (gesture.dy > 120 || gesture.vy > 0.9) {
          isClosingRef.current = true;
          Animated.timing(dragY, { toValue: 600, duration: 180, useNativeDriver: true }).start(() => {
            onClose();
            dragY.setValue(0);
            isClosingRef.current = false;
            setSheetDragActive(false);
          });
        } else {
          Animated.spring(dragY, { toValue: 0, bounciness: 4, useNativeDriver: true }).start(() => setSheetDragActive(false));
        }
      },
    })
  ).current;

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
              const text = `${f} ${l} has been assigned to this job.`.trim();
              // Close the assign sheet first, then show success from parent
                onClose();
              onShowSuccess && onShowSuccess(text);
                onAssignedSuccess && onAssignedSuccess();
            } catch (e: any) {
              const text = e?.message || 'Unable to select candidate.';
              // Close the assign sheet first, then show error message in the same success modal style
              onClose();
              onShowSuccess && onShowSuccess(text);
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
        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: dragY }] }]} {...panResponder.panHandlers}>
          <View style={styles.sheetHandle} />
          
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView 
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={!sheetDragActive}
              onScroll={(e) => {
                const nativeEvent = e.nativeEvent;
                scrollOffsetRef.current = nativeEvent.contentOffset.y;
                // propagate to external listener if provided
                if (typeof onSheetScroll === 'function') {
                  try { onSheetScroll(e); } catch {}
                }
              }}
              scrollEventThrottle={16}>
              
              {/* Header + replicated AssignmentScreen layout */}
              {job && (() => {
                const facilityName = (job as any).facilityName || '';
                const location = job.location || '';
                const department = job.department || '';
                const requiredRole = (job as any).requiredRole || '';
                const hourlyRate = (job as any).hourlyRate || '0';
                const startDate = job.startDate ? localFormatDate(job.startDate as any) : '—';
                const endDate = job.endDate ? localFormatDate(job.endDate as any) : '—';
                const startTime = job.startTime ? localFormatTime(job.startTime as any) : '—';
                const endTime = job.endTime ? localFormatTime(job.endTime as any) : '—';
                const address = (job as any).facilityAddress || {};
                const contact = (job as any).contactPerson || {};
                const requirements = (job as any).requirements || {};
                const skills: string[] = Array.isArray(requirements.skills)
                  ? requirements.skills
                  : typeof requirements.skills === 'string' && requirements.skills
                    ? (requirements.skills as string).split(',').map(s => s.trim()).filter(Boolean)
                    : [];
                const priority = job.priority || '';
                const displayStatus = getDisplayStatus(job);
                return (
                  <>
                    {/* Modal header row with centered title (no extra X icon) */}
                    <View style={styles.modalHeaderTop}>
                      <Text style={styles.modalHeaderTitle}>Job Details</Text>
                    </View>

                    {/* Main title */}
                    <Text style={styles.sheetTitleText}>{job.title || 'Job Details'}</Text>

                    {/* Dark pills: Department • Role • Rate */}
                    <View style={styles.darkPillsRow}>
                      {!!department && (
                        <View style={styles.darkPill}><Text style={styles.darkPillText}>{department}</Text></View>
                      )}
                      {!!requiredRole && (
                        <View style={styles.darkPill}><Text style={styles.darkPillText}>{requiredRole}</Text></View>
                      )}
                      <View style={styles.ratePill}><Text style={styles.ratePillText}>₹{typeof hourlyRate === 'string' ? hourlyRate : String(hourlyRate)}/hr</Text></View>
                    </View>
                    <View style={styles.sheetDivider} />

                    {/* Job Info (Start/End, Location/Facility, Department/Role) */}
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
                    {!!job.description && (
                      <View style={{ marginTop: 8, marginBottom: 16 }}>
                        <Text style={styles.metaLabel}>About the Role</Text>
                        <Text style={styles.descText}>{job.description}</Text>
                      </View>
                    )}

                    {/* Qualification */}
                    {(skills.length > 0 || requirements.experience) && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={styles.metaLabel}>Qualification</Text>
                        <View style={{ marginTop: 6 }}>
                          {!!requirements.experience && (
                            <View style={styles.bulletRow}>
                              <View style={styles.bulletDot} />
                              <Text style={styles.descText}>{requirements.experience}</Text>
                            </View>
                          )}
                          {skills.map((s, idx) => (
                            <View key={`sk-${idx}`} style={styles.bulletRow}>
                              <View style={styles.bulletDot} />
                              <Text style={styles.descText}>{s}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Priority & Status in one line with labels */}
                    {(priority || displayStatus) && (
                      <View style={[styles.modalSection, { marginTop: 4 }]}> 
                        <View style={styles.singleRow}>
                          {!!priority && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                              <Text style={[styles.metaLabel, { marginBottom: 0, marginRight: 6 }]}>Priority</Text>
                              <View style={[styles.modalPriorityBadge, { backgroundColor: getPriorityColor(priority) + '1A' }]}>
                                <Text style={[styles.modalPriorityBadgeText, { color: getPriorityColor(priority) }]}>{priority}</Text>
                              </View>
                            </View>
                          )}
                          {!!displayStatus && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={[styles.metaLabel, { marginBottom: 0, marginRight: 6 }]}>Status</Text>
                              <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(displayStatus) + '1A' }]}>
                                <Text style={[styles.modalStatusBadgeText, { color: getStatusColor(displayStatus) }]}>{displayStatus}</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Benefits */}
                    {!!(job as any).benefits && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={styles.metaLabel}>Benefits</Text>
                        {Object.entries((job as any).benefits).map(([key, val]) => (
                          <View key={`benefit-${key}`} style={styles.bulletRow}>
                            <View style={styles.bulletDot} />
                            <Text style={styles.descText}>{key}: {val ? 'Yes' : 'No'}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Notes */}
                    {!!(job as any).notes && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={styles.metaLabel}>Notes</Text>
                        <Text style={styles.descText}>{(job as any).notes}</Text>
                      </View>
                    )}

                    {/* Facility Address */}
                    {Object.keys(address || {}).length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={styles.metaLabel}>Facility Address</Text>
                        <Text style={styles.descText}>
                          {[address.street, address.city, address.state, address.zipCode, address.country].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    )}

                    {/* Contact */}
                    {(contact.name || contact.phone || contact.email) && (
                      <View style={{ marginBottom: 20 }}>
                        <Text style={styles.metaLabel}>Contact</Text>
                        {!!contact.name && <Text style={styles.descText}>{contact.name}</Text>}
                        {!!contact.phone && <Text style={styles.descText}>{contact.phone}</Text>}
                        {!!contact.email && <Text style={styles.descText}>{contact.email}</Text>}
                      </View>
                    )}

                    {/* Candidates Section (kept) */}
                    <View style={styles.modalCandidatesSection}>
                      <Text style={styles.modalCandidatesTitle}>Candidates</Text>
                      {accepted.length === 0 ? (
                        <View style={styles.modalEmptyCandidates}>
                          <Text style={styles.sheetInfoText}>No accepted candidates yet.</Text>
                        </View>
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
                            <View key={`acc-${idx}`} style={styles.modalCandidateCard}>
                              <View style={styles.modalCandidateHeader}>
                                <View style={styles.modalCandidateInfo}>
                                  <FontAwesomeIcon icon="user" size={16} color={Colors.textSecondary} style={styles.modalIcon} />
                                  <View style={styles.modalInfoContent}>
                                    <Text style={styles.modalInfoLabel}>Candidate</Text>
                                    <Text style={styles.modalInfoValue} numberOfLines={1}>{fullName}</Text>
                                  </View>
                                </View>
                                <Text style={[styles.assignmentStatus, { color: Colors.success }]}>ACCEPTED</Text>
                              </View>

                              <View style={styles.modalCandidateDetails}>
                                <View style={styles.modalInfoRow}>
                                  <FontAwesomeIcon icon="briefcase" size={16} color={Colors.textSecondary} style={styles.modalIcon} />
                                  <View style={styles.modalInfoContent}>
                                    <Text style={styles.modalInfoLabel}>Role</Text>
                                    <Text style={styles.modalInfoValue} numberOfLines={1}>{displayRole}</Text>
                                  </View>
                                </View>

                                <View style={styles.modalInfoRow}>
                                  <FontAwesomeIcon icon="phone" size={16} color={Colors.textSecondary} style={styles.modalIcon} />
                                  <View style={styles.modalInfoContent}>
                                    <Text style={styles.modalInfoLabel}>Phone</Text>
                                    <Text style={styles.modalInfoValue} numberOfLines={1}>{phone}</Text>
                                  </View>
                                </View>

                                <View style={styles.modalInfoRow}>
                                  <FontAwesomeIcon icon="envelope" size={16} color={Colors.textSecondary} style={styles.modalIcon} />
                                  <View style={styles.modalInfoContent}>
                                    <Text style={styles.modalInfoLabel}>Email</Text>
                                    <Text style={styles.modalInfoValue} numberOfLines={1}>{email}</Text>
                                  </View>
                                </View>

                                {acceptedAt && (
                                  <View style={styles.modalInfoRow}>
                                    <FontAwesomeIcon icon="calendar-check" size={16} color={Colors.textSecondary} style={styles.modalIcon} />
                                    <View style={styles.modalInfoContent}>
                                      <Text style={styles.modalInfoLabel}>Accepted</Text>
                                      <Text style={styles.modalInfoValue}>{new Date(acceptedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                                    </View>
                                  </View>
                                )}
                              </View>

                              <TouchableOpacity 
                                style={styles.modalSelectButton}
                                onPress={() => handleSelectCandidate(a)}
                                disabled={isSelecting}
                              >
                                {isSelecting ? (
                                  <ActivityIndicator size="small" color={Colors.white} />
                                ) : (
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <FontAwesomeIcon icon="check" size={16} color={Colors.white} style={{ marginRight: 8 }} />
                                    <Text style={styles.modalSelectButtonText}>Select Candidate</Text>
                                  </View>
                                )}
                              </TouchableOpacity>
                            </View>
                          );
                        })
                      )}
                    </View>
                  </>
                );
              })()}
            </ScrollView>
          )}

          {!loading && (
          <TouchableOpacity style={styles.sheetCloseButton} onPress={onClose}>
            <Text style={styles.sheetCloseText}>Close</Text>
          </TouchableOpacity>
          )}
        </Animated.View>
        {/* Removed green fullscreen confirmation; success handled by parent bottom-sheet */}
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
  department,
  departments,
  onChangeFrom,
  onChangeTo,
  onChangeStatus,
  onChangePriority,
  onChangeDepartment,
  onClear,
}: {
  visible: boolean;
  onClose: () => void;
  from: string;
  to: string;
  status: string;
  priority: string;
  department: string;
  departments: string[];
  onChangeFrom: (v: string) => void;
  onChangeTo: (v: string) => void;
  onChangeStatus: (v: string) => void;
  onChangePriority: (v: string) => void;
  onChangeDepartment: (v: string) => void;
  onClear: () => void;
}) => {
  const statuses = ['ACTIVE', 'COMPLETED'];
  const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

  const [showFromPicker, setShowFromPicker] = React.useState(false);
  const [showToPicker, setShowToPicker] = React.useState(false);
  const [deptOpen, setDeptOpen] = React.useState(false);

  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

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
              <TouchableOpacity style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
                activeOpacity={0.7}
                onPress={() => setShowFromPicker(true)}>
                <FontAwesomeIcon icon="calendar" size={16} color={Colors.textSecondary} />
                <Text style={{ marginLeft: 8, color: from ? Colors.textPrimary : Colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm }}>
                  {from || 'From date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
                activeOpacity={0.7}
                onPress={() => setShowToPicker(true)}>
                <FontAwesomeIcon icon="calendar" size={16} color={Colors.textSecondary} />
                <Text style={{ marginLeft: 8, color: to ? Colors.textPrimary : Colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm }}>
                  {to || 'To date'}
                </Text>
              </TouchableOpacity>
            </View>
            {showFromPicker && (
              <DateTimePicker
                value={from ? new Date(from) : new Date()}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowFromPicker(false);
                  if (date) onChangeFrom(formatYMD(date));
                }}
              />
            )}
            {showToPicker && (
              <DateTimePicker
                value={to ? new Date(to) : new Date()}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowToPicker(false);
                  if (date) onChangeTo(formatYMD(date));
                }}
              />
            )}

            <Text style={[styles.filterLabel, { marginTop: 12 }]}>Department</Text>
            <View>
              <TouchableOpacity
                onPress={() => setDeptOpen(prev => !prev)}
                style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                activeOpacity={0.7}
              >
                <Text style={{ color: department ? Colors.textPrimary : Colors.textSecondary, fontFamily: Typography.fontFamily.regular }}>
                  {department || 'All departments'}
                </Text>
                <FontAwesomeIcon icon={deptOpen ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
              {deptOpen && (
                <View style={styles.dropdownList}>
                  <TouchableOpacity onPress={() => { onChangeDepartment(''); setDeptOpen(false); }} style={styles.dropdownOption}>
                    <Text style={styles.dropdownOptionText}>All</Text>
                  </TouchableOpacity>
                  {departments.map((d, idx) => (
                    <TouchableOpacity key={`${d}-${idx}`} onPress={() => { onChangeDepartment(d); setDeptOpen(false); }} style={styles.dropdownOption}>
                      <Text style={styles.dropdownOptionText}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
    paddingTop: Responsive.verticalScale(Spacing.md),
    paddingBottom: Responsive.verticalScale(12),
  },
  searchContainer: {
    paddingHorizontal: Responsive.scale(Spacing.md),
    paddingBottom: Responsive.verticalScale(Spacing.xs),
    backgroundColor: Colors.background,
    marginTop: Responsive.verticalScale(Spacing.md),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'] || BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    paddingVertical: 0,
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
    marginTop: Spacing.sm,
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
  recreateButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginHorizontal: -6,
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
  departmentRow: {
    marginTop: Spacing.sm,
  },
  cardActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.md,
  },
  assignButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    gap: 8,
  },
  assignButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
  },
  jobDetailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  jobDetailsButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  // removed action button variants
  fab: {
    position: 'absolute',
    bottom: Responsive.verticalScale(60),
    right: Responsive.scale(Spacing.md),
    height: Responsive.verticalScale(50),
    minWidth: Responsive.scale(50),
    paddingHorizontal: Responsive.scale(16),
    borderRadius: Responsive.scale(25),
    backgroundColor: Colors.primary,
    ...Shadow.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Responsive.scale(8),
  },
  fabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
  },
  fabIconSkeleton: {
    width: Responsive.iconSize(20),
    height: Responsive.iconSize(20),
    borderRadius: Responsive.iconSize(10),
    backgroundColor: Colors.border,
  },
  fabTextSkeleton: {
    width: 64,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
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
    paddingTop: 0,
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
  // Additional styles to replicate AssignmentScreen modal layout
  sheetTitleText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    flex: 1,
    flexWrap: 'wrap',
    marginTop: 16,
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
    textAlign: 'center',
    alignSelf: 'center',
    flex: 1,
  },
  modalHeaderCloseIcon: {
    position: 'absolute',
    right: 0,
    top: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  darkPillsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 4, justifyContent: 'flex-start', alignItems: 'center' },
  darkPill: { backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginTop: 6 },
  darkPillText: { color: '#fff', fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium },
  ratePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: Colors.success,
    backgroundColor: 'transparent',
  },
  ratePillText: {
    color: Colors.success,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  row2: { flexDirection: 'row', marginHorizontal: -8, marginBottom: 12 },
  col: { flex: 1, marginHorizontal: 8 },
  metaLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  descText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textSecondary, marginTop: 7, marginRight: 8 },
  singleRow: { flexDirection: 'row', alignItems: 'center' },
  sheetContent: {
    paddingBottom: 24,
  },
  modalHeader: {
    marginBottom: 24,
    paddingBottom: 16,
  },
  modalHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    paddingTop: 8,
    paddingRight: 36,
  },
  modalTitle: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginRight: 12,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  modalCloseIcon: {
    padding: 4,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalIcon: {
    marginRight: 12,
    marginTop: 2,
    width: 20,
  },
  modalInfoContent: {
    flex: 1,
  },
  modalInfoLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  modalCandidatesSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  modalCandidatesTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  modalEmptyCandidates: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalCandidateCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalCandidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCandidateInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  modalCandidateDetails: {
    marginBottom: 16,
  },
  modalSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  modalSelectButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
  },
  modalTwoColRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  modalCol: {
    flex: 1,
    marginHorizontal: 8,
  },
  modalStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  modalStatusBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalPriorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  modalPriorityBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    marginHorizontal: 4,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    backgroundColor: Colors.white,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownOptionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
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
    marginRight: 8,
    marginTop: 4,
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
    marginRight: 5,
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
    marginLeft: 5,
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
    borderColor: '#1C2A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  sheetCloseText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: '#1C2A3A',
  },
  // Registration-style modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    width: '100%',
  },
  successModalTitle: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalIconContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    position: 'relative',
  },
  sparkle: { position: 'absolute' },
  sparkle1: { top: 10, left: 10 },
  sparkle2: { bottom: 15, left: 8 },
  sparkle3: { top: 15, right: 8 },
  sparkle4: { bottom: 10, right: 10 },
  modalMessage: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.regular,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  modalDoneButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
    minWidth: 140,
    marginBottom: 0,
  },
  modalDoneButtonText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});

export default HRJobsScreen;

