import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Shadow, BorderRadius } from '../../constants/spacing';
import ApiService from '../../services/api';
import HRFooterNavigation from '../../components/HRFooterNavigation';
import GlobalHeader from '../../components/GlobalHeader';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

interface ReportFilters {
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  department: string;
  location: string;
  userId?: string;
  jobId?: string;
}

interface Job {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  department: string;
  location: string;
  specialization?: string;
  status?: string;
}

interface Assignment {
  id: number;
  jobId: number;
  userId: number;
  status: string;
  assignedBy: number;
  acceptedAt?: string;
  confirmedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  totalHours: string;
  hourlyRate: string;
  totalPayment: string;
  notes?: string;
  rating?: number;
  feedback?: string;
  isDirectAssignment: boolean;
  requestForExtension: boolean;
  extensionRequestReason?: string;
  createdAt: string;
  updatedAt: string;
  job?: Job;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    department: string;
    specialization: string;
    location: string;
  };
  assigner?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  checkIns?: any[];
}

interface Report {
  id: number;
  title: string;
  type: string;
  summary: any;
  totalRecords: number;
  generatedAt: string;
}

const ReportsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedReportType, setSelectedReportType] = useState('job-lists');
  const [filters, setFilters] = useState<ReportFilters>({
    title: '',
    startDate: '',
    endDate: '',
    status: '',
    department: '',
    location: '',
  });
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobSelector, setShowJobSelector] = useState(false);
  const [showJobDetailModal, setShowJobDetailModal] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any>(null);
  const [loadingJobDetails, setLoadingJobDetails] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showAssignmentDetailModal, setShowAssignmentDetailModal] = useState(false);
  const [selectedAssignmentDetails, setSelectedAssignmentDetails] = useState<any>(null);
  const [loadingAssignmentDetails, setLoadingAssignmentDetails] = useState(false);

  const reportTypes = [
    { key: 'job-lists', label: 'Job Lists', icon: 'list' },
    { key: 'assignment-lists', label: 'Assignment Lists', icon: 'users' },
    // { key: 'job-postings', label: 'Job Postings', icon: 'briefcase' },
    // { key: 'assignments', label: 'Assignments', icon: 'users' },
    // { key: 'attendance', label: 'Attendance', icon: 'clock' },
    // { key: 'no-shows', label: 'No-Shows', icon: 'times-circle' },
    // { key: 'financial', label: 'Financial', icon: 'dollar-sign' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'PENDING', label: 'Pending' },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load departments, locations, jobs, and assignments
      const [departmentsData, locationsData, jobsData, assignmentsData] = await Promise.all([
        ApiService.getDepartments(),
        ApiService.getLocations(),
        ApiService.getAllJobsForReports(),
        ApiService.getAllAssignments(),
      ]);
      console.log('Departments data:', departmentsData);
      console.log('Locations data:', locationsData);
      console.log('Jobs data:', jobsData);
      console.log('Assignments data:', assignmentsData);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      // Ensure arrays are always set even if API fails
      setDepartments([]);
      setLocations([]);
      setJobs([]);
      setAssignments([]);
    }
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    setShowJobSelector(false);
    
    // Auto-fill report fields with job data
    setFilters({
      ...filters,
      title: `${job.title} Report`,
      startDate: job.startDate.split('T')[0], // Convert ISO date to YYYY-MM-DD
      endDate: job.endDate.split('T')[0], // Convert ISO date to YYYY-MM-DD
      department: job.department,
      location: job.location,
      jobId: job.id.toString(),
    });
  };

  const handleClearJobSelection = () => {
    setSelectedJob(null);
    setFilters({
      ...filters,
      title: '',
      startDate: '',
      endDate: '',
      department: '',
      location: '',
      jobId: '',
    });
  };

  const handleJobClick = async (jobId: number) => {
    try {
      setLoadingJobDetails(true);
      console.log('📊 Fetching job details for ID:', jobId);
      const response = await ApiService.getJobById(jobId.toString());
      console.log('✅ Job details fetched:', response);
      
      // Handle nested response structure - extract job data from response.job
      const jobDetails = response.job || response;
      console.log('📋 Extracted job details:', jobDetails);
      
      setSelectedJobDetails(jobDetails);
      setShowJobDetailModal(true);
    } catch (error: any) {
      console.error('❌ Failed to fetch job details:', error);
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setLoadingJobDetails(false);
    }
  };

  const handleAssignmentClick = async (assignmentId: number) => {
    try {
      setLoadingAssignmentDetails(true);
      console.log('📊 Fetching assignment details for ID:', assignmentId);
      const response = await ApiService.getAssignmentById(assignmentId.toString());
      console.log('✅ Assignment details fetched:', response);
      
      // Handle nested response structure - extract assignment data from response.assignment
      const assignmentDetails = response.assignment || response;
      console.log('📋 Extracted assignment details:', assignmentDetails);
      
      setSelectedAssignmentDetails(assignmentDetails);
      setShowAssignmentDetailModal(true);
    } catch (error: any) {
      console.error('❌ Failed to fetch assignment details:', error);
      Alert.alert('Error', 'Failed to load assignment details');
    } finally {
      setLoadingAssignmentDetails(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!filters.title.trim()) {
      Alert.alert('Error', 'Please enter a report title');
      return;
    }

    if (!filters.startDate || !filters.endDate) {
      Alert.alert('Error', 'Please select both start and end dates');
      return;
    }

    setIsGenerating(true);
    try {
      // Convert DD-MM-YYYY to YYYY-MM-DD for API
      const normalizeDate = (value: string) => {
        const ddmmyyyy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (ddmmyyyy) {
          const [, dd, mm, yyyy] = ddmmyyyy;
          return `${yyyy}-${mm}-${dd}`; // convert DD-MM-YYYY to YYYY-MM-DD for API
        }
        return value;
      };

      let response;
      let requestData = {
        title: filters.title,
        parameters: {
          startDate: filters.startDate ? normalizeDate(filters.startDate) : undefined,
          endDate: filters.endDate ? normalizeDate(filters.endDate) : undefined,
          ...(filters.status && { status: filters.status }),
          ...(filters.department && { department: filters.department }),
          ...(filters.location && { location: filters.location }),
          ...(filters.userId && { userId: filters.userId }),
          ...(filters.jobId && { jobId: filters.jobId }),
        },
        fileFormat: 'JSON',
      };

      switch (selectedReportType) {
        case 'job-postings':
          response = await ApiService.generateJobPostingsReport(requestData);
          break;
        case 'assignments':
          response = await ApiService.generateJobAssignmentsReport(requestData);
          break;
        case 'attendance':
          response = await ApiService.generateAttendanceReport(requestData);
          break;
        case 'no-shows':
          response = await ApiService.generateNoShowJobsReport(requestData);
          break;
        case 'financial':
          response = await ApiService.generateFinancialReport(requestData);
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Add the new report to the list
      const newReport: Report = {
        id: response.report.id,
        title: response.report.title,
        type: response.report.type,
        summary: response.report.summary,
        totalRecords: response.report.totalRecords,
        generatedAt: response.report.generatedAt,
      };

      setRecentReports(prev => [newReport, ...prev]);

      Alert.alert('Success', 'Report generated successfully!');

      // Reset form
      setFilters({
        title: '',
        startDate: '',
        endDate: '',
        status: '',
        department: '',
        location: '',
      });
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      Alert.alert('Error', error.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return Colors.success;
      case 'ASSIGNED':
        return Colors.warning;
      case 'COMPLETED':
        return Colors.primary;
      case 'CANCELLED':
        return Colors.error;
      case 'PENDING':
        return Colors.textSecondary;
      default:
        return Colors.textSecondary;
    }
  };

  const formatReportType = (type: string) => {
    switch (type) {
      case 'JOB_POSTINGS':
        return 'Job Postings';
      case 'JOB_ASSIGNMENTS':
        return 'Job Assignments';
      case 'ATTENDANCE':
        return 'Attendance';
      case 'NO_SHOW_JOBS':
        return 'No-Show Jobs';
      case 'FINANCIAL':
        return 'Financial';
      default:
        return type;
    }
  };

  const formatReportSummary = (summary: any, reportType: string) => {
    if (!summary) return '';
    
    switch (reportType) {
      case 'JOB_POSTINGS':
        return `Jobs: ${summary.totalJobs || 0} | Assignments: ${summary.totalAssignments || 0}`;
      case 'JOB_ASSIGNMENTS':
        return `Assignments: ${summary.totalAssignments || 0} | Hours: ${summary.totalHours || 0}`;
      case 'ATTENDANCE':
        return `Check-ins: ${summary.totalCheckIns || 0} | Hours: ${summary.totalWorkHours || 0}`;
      case 'NO_SHOW_JOBS':
        return `No-shows: ${summary.totalNoShows || 0} | Lost: $${summary.totalExpectedPayment || 0}`;
      case 'FINANCIAL':
        return `Total Payout: $${summary.totalPayoutAmount || 0} | Completed: ${summary.completedPayments || 0}`;
      default:
        return `Records: ${summary.totalRecords || 0}`;
    }
  };

  const parseDateString = (dateString: string): Date => {
    // Expecting DD-MM-YYYY; fallback to today
    const match = dateString.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`; // YYYY-MM-DD format
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (selectedDate) {
      setFilters({ ...filters, startDate: formatDate(selectedDate) });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      setFilters({ ...filters, endDate: formatDate(selectedDate) });
    }
  };

  const renderReportCard = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => {
        // Navigate to report details
        (navigation as any).navigate('ReportDetails', { reportId: item.id });
      }}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{item.title}</Text>
        <Text style={styles.reportType}>{formatReportType(item.type)}</Text>
      </View>
      <Text style={styles.reportDate}>{formatDateTime(item.generatedAt)}</Text>
      <View style={styles.reportStats}>
        <Text style={styles.reportStatsText}>
          Total Records: {item.totalRecords}
        </Text>
        {item.summary && (
          <Text style={styles.reportStatsText}>
            {formatReportSummary(item.summary, item.type)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <GlobalHeader 
        title="Reports"
        backgroundColor={Colors.primary}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.filterButton}>
            <FontAwesomeIcon icon="filter" size={20} color={Colors.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Report Type Tabs */}
        <View style={styles.tabsContainer}>
          <FlatList
            data={reportTypes}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
            renderItem={({ item: type }) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.tab,
                selectedReportType === type.key && styles.tabActive,
              ]}
              onPress={() => setSelectedReportType(type.key)}
            >
              <FontAwesomeIcon
                icon={type.icon}
                size={16}
                color={
                  selectedReportType === type.key
                    ? Colors.white
                    : Colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  selectedReportType === type.key && styles.tabTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
            )}
            keyExtractor={(item) => item.key}
          />
        </View>

        {/* Job Lists View */}
        {selectedReportType === 'job-lists' ? (
          <View style={styles.jobListsContainer}>
            <Text style={styles.sectionTitle}>All Jobs</Text>
            {jobs.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesomeIcon icon="briefcase" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyStateText}>No jobs found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Jobs will appear here when they are created
                </Text>
              </View>
            ) : (
              <FlatList
                data={jobs}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.jobCard}
                    onPress={() => handleJobClick(item.id)}
                  >
                    <View style={styles.jobCardHeader}>
                      <Text style={styles.jobCardTitle}>{item.title}</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status || 'ACTIVE') }
                      ]}>
                        <Text style={styles.statusText}>{item.status || 'ACTIVE'}</Text>
                      </View>
                    </View>
                    <Text style={styles.jobCardDepartment}>{item.department}</Text>
                    <Text style={styles.jobCardLocation}>{item.location}</Text>
                    <Text style={styles.jobCardDates}>
                      {item.startDate.split('T')[0]} to {item.endDate.split('T')[0]}
                    </Text>
                    <View style={styles.jobCardFooter}>
                      <FontAwesomeIcon icon="chevron-right" size={16} color={Colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}
          </View>
        ) : selectedReportType === 'assignment-lists' ? (
          <View style={styles.jobListsContainer}>
            <Text style={styles.sectionTitle}>All Assignments</Text>
            {assignments.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesomeIcon icon="users" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyStateText}>No assignments found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Assignments will appear here when they are created
                </Text>
              </View>
            ) : (
              <FlatList
                data={assignments}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.jobCard}
                    onPress={() => handleAssignmentClick(item.id)}
                  >
                    <View style={styles.jobCardHeader}>
                      <Text style={styles.jobCardTitle}>
                        {item.job?.title || `Assignment #${item.id}`}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) }
                      ]}>
                        <Text style={styles.statusText}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.jobCardDepartment}>
                      {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown User'}
                    </Text>
                    <Text style={styles.jobCardLocation}>
                      {item.job?.department || 'N/A'} • {item.job?.location || 'N/A'}
                    </Text>
                    <Text style={styles.jobCardDates}>
                      Created: {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    <View style={styles.jobCardFooter}>
                      <FontAwesomeIcon icon="chevron-right" size={16} color={Colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}
          </View>
        ) : (
          <>
            {/* Generate Report Card */}
            <View style={styles.generateCard}>
          <Text style={styles.generateTitle}>Generate Report</Text>

          {/* Job Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Select Job</Text>
            {selectedJob ? (
              <View style={styles.selectedJobContainer}>
                <View style={styles.selectedJobInfo}>
                  <Text style={styles.selectedJobTitle}>{selectedJob.title}</Text>
                  <Text style={styles.selectedJobDetails}>
                    {selectedJob.department} • {selectedJob.location}
                  </Text>
                  <Text style={styles.selectedJobDates}>
                    {selectedJob.startDate.split('T')[0]} to {selectedJob.endDate.split('T')[0]}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.clearJobButton}
                  onPress={handleClearJobSelection}
                >
                  <FontAwesomeIcon icon="times" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.jobSelectorButton}
                onPress={() => setShowJobSelector(true)}
              >
                <Text style={styles.jobSelectorText}>Select a job</Text>
                <FontAwesomeIcon icon="chevron-down" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Title Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Report Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter report title"
              value={filters.title}
              onChangeText={(text) =>
                setFilters({ ...filters, title: text })
              }
            />
          </View>

          {/* Date Range Picker */}
          <View style={styles.dateContainer}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateButtonText} numberOfLines={1}>
                  {filters.startDate ? filters.startDate : 'Start Date'}
                </Text>
                <View style={styles.startDateButtonIcon}>
                  <FontAwesomeIcon icon="calendar" size={16} color={Colors.textPrimary} />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.dateInputContainer}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateButtonText} numberOfLines={1}>
                  {filters.endDate ? filters.endDate : 'End Date'}
                </Text>
                <View style={styles.dateButtonIcon}>
                  <FontAwesomeIcon icon="calendar" size={16} color={Colors.textPrimary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Pickers */}
          {showStartDatePicker && (
            <DateTimePicker
              value={filters.startDate ? parseDateString(filters.startDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
              maximumDate={filters.endDate ? parseDateString(filters.endDate) : undefined}
            />
          )}
          {showEndDatePicker && (
            <DateTimePicker
              value={filters.endDate ? parseDateString(filters.endDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndDateChange}
              minimumDate={filters.startDate ? parseDateString(filters.startDate) : undefined}
            />
          )}

          {/* Status Filter */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.pickerContainer}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerOption,
                    filters.status === option.value && styles.pickerOptionActive,
                  ]}
                  onPress={() => setFilters({ ...filters, status: option.value })}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      filters.status === option.value && styles.pickerOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Department Filter */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Department</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  filters.department === '' && styles.pickerOptionActive,
                ]}
                onPress={() => setFilters({ ...filters, department: '' })}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    filters.department === '' && styles.pickerOptionTextActive,
                  ]}
                >
                  All Departments
                </Text>
              </TouchableOpacity>
              {Array.isArray(departments) ? departments.map((dept) => (
                <TouchableOpacity
                  key={dept}
                  style={[
                    styles.pickerOption,
                    filters.department === dept && styles.pickerOptionActive,
                  ]}
                  onPress={() => setFilters({ ...filters, department: dept })}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      filters.department === dept && styles.pickerOptionTextActive,
                    ]}
                  >
                    {dept}
                  </Text>
                </TouchableOpacity>
              )) : null}
            </View>
          </View>

          {/* Location Filter */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter location"
              value={filters.location}
              onChangeText={(text) =>
                setFilters({ ...filters, location: text })
              }
            />
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <FontAwesomeIcon icon="file-alt" size={16} color={Colors.white} />
                <Text style={styles.generateButtonText}>Generate Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Reports Section */}
        <View style={styles.recentReportsSection}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          {recentReports.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesomeIcon icon="file-alt" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyStateText}>No reports generated yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Generate your first report using the form above
              </Text>
            </View>
          ) : (
            <FlatList
              data={recentReports}
              renderItem={renderReportCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>
          </>
        )}
      </ScrollView>

      {/* Job Selector Modal */}
      {showJobSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Job</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowJobSelector(false)}
              >
                <FontAwesomeIcon icon="times" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={jobs}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.jobItem}
                  onPress={() => handleJobSelect(item)}
                >
                  <View style={styles.jobItemContent}>
                    <Text style={styles.jobItemTitle}>{item.title}</Text>
                    <Text style={styles.jobItemDetails}>
                      {item.department} • {item.location}
                    </Text>
                    <Text style={styles.jobItemDates}>
                      {item.startDate.split('T')[0]} to {item.endDate.split('T')[0]}
                    </Text>
                  </View>
                  <FontAwesomeIcon icon="chevron-right" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              style={styles.jobList}
            />
          </View>
        </View>
      )}

      {/* Job Detail Modal */}
      {showJobDetailModal && (
        <View style={styles.jobDetailModalOverlay}>
          <View style={styles.jobDetailModalContainer}>
            <View style={styles.jobDetailModalHeader}>
              <Text style={styles.jobDetailModalTitle}>Job Details</Text>
              <TouchableOpacity
                style={styles.jobDetailModalCloseButton}
                onPress={() => setShowJobDetailModal(false)}
              >
                <FontAwesomeIcon icon="times" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {loadingJobDetails ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading job details...</Text>
              </View>
            ) : selectedJobDetails ? (
            <ScrollView style={styles.jobDetailModalContent}>
              {/* Job Basic Info */}
              <View style={styles.jobDetailSection}>
                <Text style={styles.jobDetailSectionTitle}>Job Information</Text>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Title:</Text>
                  <Text style={styles.jobDetailValue}>{selectedJobDetails.title}</Text>
                </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Description:</Text>
                    <Text style={styles.jobDetailValue}>{selectedJobDetails.description}</Text>
                  </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Department:</Text>
                  <Text style={styles.jobDetailValue}>{selectedJobDetails.department}</Text>
                </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Specialization:</Text>
                    <Text style={styles.jobDetailValue}>{selectedJobDetails.specialization}</Text>
                  </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Location:</Text>
                  <Text style={styles.jobDetailValue}>{selectedJobDetails.location}</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(selectedJobDetails.status) }
                  ]}>
                    <Text style={styles.statusText}>{selectedJobDetails.status}</Text>
                  </View>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Priority:</Text>
                  <Text style={styles.jobDetailValue}>{selectedJobDetails.priority}</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Hourly Rate:</Text>
                  <Text style={styles.jobDetailValue}>₹{selectedJobDetails.hourlyRate}</Text>
                </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Max Assignments:</Text>
                    <Text style={styles.jobDetailValue}>{selectedJobDetails.maxAssignments}</Text>
                  </View>
              </View>

                {/* Facility Information */}
                <View style={styles.jobDetailSection}>
                  <Text style={styles.jobDetailSectionTitle}>Facility Information</Text>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Facility Name:</Text>
                    <Text style={styles.jobDetailValue}>{selectedJobDetails.facilityName}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Unit Code:</Text>
                    <Text style={styles.jobDetailValue}>{selectedJobDetails.unitCode}</Text>
                  </View>
                  {selectedJobDetails.facilityAddress && (
                    <>
                      <View style={styles.jobDetailRow}>
                        <Text style={styles.jobDetailLabel}>Address:</Text>
                        <Text style={styles.jobDetailValue}>{selectedJobDetails.facilityAddress.street}</Text>
                      </View>
                      <View style={styles.jobDetailRow}>
                        <Text style={styles.jobDetailLabel}>City:</Text>
                        <Text style={styles.jobDetailValue}>{selectedJobDetails.facilityAddress.city}</Text>
                      </View>
                      <View style={styles.jobDetailRow}>
                        <Text style={styles.jobDetailLabel}>State:</Text>
                        <Text style={styles.jobDetailValue}>{selectedJobDetails.facilityAddress.state}</Text>
                      </View>
                      <View style={styles.jobDetailRow}>
                        <Text style={styles.jobDetailLabel}>Country:</Text>
                        <Text style={styles.jobDetailValue}>{selectedJobDetails.facilityAddress.country}</Text>
                      </View>
                      <View style={styles.jobDetailRow}>
                        <Text style={styles.jobDetailLabel}>ZIP Code:</Text>
                        <Text style={styles.jobDetailValue}>{selectedJobDetails.facilityAddress.zipCode}</Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Contact Person */}
                {selectedJobDetails.contactPerson && (
                  <View style={styles.jobDetailSection}>
                    <Text style={styles.jobDetailSectionTitle}>Contact Person</Text>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Name:</Text>
                      <Text style={styles.jobDetailValue}>{selectedJobDetails.contactPerson.name}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Position:</Text>
                      <Text style={styles.jobDetailValue}>{selectedJobDetails.contactPerson.position}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Email:</Text>
                      <Text style={styles.jobDetailValue}>{selectedJobDetails.contactPerson.email}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Phone:</Text>
                      <Text style={styles.jobDetailValue}>{selectedJobDetails.contactPerson.phone}</Text>
                    </View>
                  </View>
                )}

              {/* Dates & Times */}
              <View style={styles.jobDetailSection}>
                <Text style={styles.jobDetailSectionTitle}>Schedule</Text>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Start Date:</Text>
                  <Text style={styles.jobDetailValue}>
                    {new Date(selectedJobDetails.startDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>End Date:</Text>
                  <Text style={styles.jobDetailValue}>
                    {new Date(selectedJobDetails.endDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Start Time:</Text>
                  <Text style={styles.jobDetailValue}>{selectedJobDetails.startTime}</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>End Time:</Text>
                  <Text style={styles.jobDetailValue}>{selectedJobDetails.endTime}</Text>
                </View>
              </View>

              {/* Requirements */}
              {selectedJobDetails.requirements && (
                <View style={styles.jobDetailSection}>
                  <Text style={styles.jobDetailSectionTitle}>Requirements</Text>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Experience:</Text>
                    <Text style={styles.jobDetailValue}>{selectedJobDetails.requirements.experience}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Board Certified:</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedJobDetails.requirements.boardCertified ? 'Yes' : 'No'}
                    </Text>
                  </View>
                  {selectedJobDetails.requirements.skills && (
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Skills:</Text>
                      <Text style={styles.jobDetailValue}>
                        {selectedJobDetails.requirements.skills.join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
              )}

                {/* Benefits */}
                {selectedJobDetails.benefits && (
                  <View style={styles.jobDetailSection}>
                    <Text style={styles.jobDetailSectionTitle}>Benefits</Text>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Parking:</Text>
                      <Text style={styles.jobDetailValue}>
                        {selectedJobDetails.benefits.parking ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Malpractice:</Text>
                      <Text style={styles.jobDetailValue}>
                        {selectedJobDetails.benefits.malpractice ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Meal Allowance:</Text>
                      <Text style={styles.jobDetailValue}>
                        {selectedJobDetails.benefits.mealAllowance ? 'Yes' : 'No'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Notes */}
                {selectedJobDetails.notes && (
                  <View style={styles.jobDetailSection}>
                    <Text style={styles.jobDetailSectionTitle}>Notes</Text>
                    <Text style={styles.jobDetailNotes}>{selectedJobDetails.notes}</Text>
                  </View>
                )}

              {/* Assignments */}
              {selectedJobDetails.assignments && selectedJobDetails.assignments.length > 0 && (
                <View style={styles.jobDetailSection}>
                  <Text style={styles.jobDetailSectionTitle}>Assignments</Text>
                  {selectedJobDetails.assignments.map((assignment: any, index: number) => (
                    <View key={index} style={styles.assignmentCard}>
                      <View style={styles.jobDetailRow}>
                        <Text style={styles.jobDetailLabel}>Assigned To:</Text>
                        <Text style={styles.jobDetailValue}>
                          {assignment.user?.firstName} {assignment.user?.lastName}
                        </Text>
                      </View>
                        <View style={styles.jobDetailRow}>
                          <Text style={styles.jobDetailLabel}>Email:</Text>
                          <Text style={styles.jobDetailValue}>{assignment.user?.email}</Text>
                        </View>
                        <View style={styles.jobDetailRow}>
                          <Text style={styles.jobDetailLabel}>Phone:</Text>
                          <Text style={styles.jobDetailValue}>{assignment.user?.phone}</Text>
                        </View>
                      <View style={styles.jobDetailRow}>
                        <Text style={styles.jobDetailLabel}>Status:</Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(assignment.status) }
                        ]}>
                          <Text style={styles.statusText}>{assignment.status}</Text>
                        </View>
                      </View>
                      <View style={styles.jobDetailRow}>
                        <Text style={styles.jobDetailLabel}>Total Hours:</Text>
                        <Text style={styles.jobDetailValue}>{assignment.totalHours}</Text>
                      </View>
                      <View style={styles.jobDetailRow}>
                        <Text style={styles.jobDetailLabel}>Total Payment:</Text>
                        <Text style={styles.jobDetailValue}>₹{assignment.totalPayment}</Text>
                      </View>
                        <View style={styles.jobDetailRow}>
                          <Text style={styles.jobDetailLabel}>Accepted At:</Text>
                          <Text style={styles.jobDetailValue}>
                            {assignment.acceptedAt ? new Date(assignment.acceptedAt).toLocaleString() : 'N/A'}
                          </Text>
                        </View>
                        <View style={styles.jobDetailRow}>
                          <Text style={styles.jobDetailLabel}>Completed At:</Text>
                          <Text style={styles.jobDetailValue}>
                            {assignment.completedAt ? new Date(assignment.completedAt).toLocaleString() : 'N/A'}
                          </Text>
                        </View>

                        {/* Check-ins for this assignment */}
                        {assignment.checkIns && assignment.checkIns.length > 0 && (
                          <View style={styles.checkInSection}>
                            <Text style={styles.checkInSectionTitle}>Check-ins</Text>
                            {assignment.checkIns.map((checkIn: any, checkInIndex: number) => (
                              <View key={checkInIndex} style={styles.checkInCard}>
                                <View style={styles.jobDetailRow}>
                                  <Text style={styles.jobDetailLabel}>Check-in Time:</Text>
                                  <Text style={styles.jobDetailValue}>
                                    {new Date(checkIn.checkInTime).toLocaleString()}
                                  </Text>
                                </View>
                                <View style={styles.jobDetailRow}>
                                  <Text style={styles.jobDetailLabel}>Check-out Time:</Text>
                                  <Text style={styles.jobDetailValue}>
                                    {checkIn.checkOutTime ? new Date(checkIn.checkOutTime).toLocaleString() : 'N/A'}
                                  </Text>
                                </View>
                                <View style={styles.jobDetailRow}>
                                  <Text style={styles.jobDetailLabel}>Total Work Time:</Text>
                                  <Text style={styles.jobDetailValue}>{checkIn.totalWorkTime} minutes</Text>
                                </View>
                                <View style={styles.jobDetailRow}>
                                  <Text style={styles.jobDetailLabel}>Status:</Text>
                                  <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusColor(checkIn.status) }
                                  ]}>
                                    <Text style={styles.statusText}>{checkIn.status}</Text>
                                  </View>
                                </View>
                                {checkIn.notes && (
                                  <View style={styles.jobDetailRow}>
                                    <Text style={styles.jobDetailLabel}>Notes:</Text>
                                    <Text style={styles.jobDetailValue}>{checkIn.notes}</Text>
                                  </View>
                                )}
                    </View>
                  ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Creator Information */}
                {selectedJobDetails.creator && (
                  <View style={styles.jobDetailSection}>
                    <Text style={styles.jobDetailSectionTitle}>Created By</Text>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Name:</Text>
                      <Text style={styles.jobDetailValue}>
                        {selectedJobDetails.creator.firstName} {selectedJobDetails.creator.lastName}
                      </Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Email:</Text>
                      <Text style={styles.jobDetailValue}>{selectedJobDetails.creator.email}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Created At:</Text>
                      <Text style={styles.jobDetailValue}>
                        {new Date(selectedJobDetails.createdAt).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Updated At:</Text>
                      <Text style={styles.jobDetailValue}>
                        {new Date(selectedJobDetails.updatedAt).toLocaleString()}
                      </Text>
                    </View>
                </View>
              )}
            </ScrollView>
            ) : (
              <View style={styles.errorContainer}>
                <FontAwesomeIcon icon="exclamation-triangle" size={48} color={Colors.error} />
                <Text style={styles.errorText}>Failed to load job details</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Assignment Detail Modal */}
      {showAssignmentDetailModal && (
        <View style={styles.jobDetailModalOverlay}>
          <View style={styles.jobDetailModalContainer}>
            <View style={styles.jobDetailModalHeader}>
              <Text style={styles.jobDetailModalTitle}>Assignment Details</Text>
              <TouchableOpacity
                style={styles.jobDetailModalCloseButton}
                onPress={() => setShowAssignmentDetailModal(false)}
              >
                <FontAwesomeIcon icon="times" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {loadingAssignmentDetails ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading assignment details...</Text>
              </View>
            ) : selectedAssignmentDetails ? (
              <ScrollView style={styles.jobDetailModalContent}>
                {/* Assignment Basic Info */}
                <View style={styles.jobDetailSection}>
                  <Text style={styles.jobDetailSectionTitle}>Assignment Information</Text>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Assignment ID:</Text>
                    <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.id}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Job ID:</Text>
                    <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.jobId}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>User ID:</Text>
                    <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.userId}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Status:</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(selectedAssignmentDetails.status) }
                    ]}>
                      <Text style={styles.statusText}>{selectedAssignmentDetails.status}</Text>
                    </View>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Hourly Rate:</Text>
                    <Text style={styles.jobDetailValue}>₹{selectedAssignmentDetails.hourlyRate}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Total Hours:</Text>
                    <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.totalHours}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Total Payment:</Text>
                    <Text style={styles.jobDetailValue}>₹{selectedAssignmentDetails.totalPayment}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Direct Assignment:</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedAssignmentDetails.isDirectAssignment ? 'Yes' : 'No'}
                    </Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Extension Request:</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedAssignmentDetails.requestForExtension ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>

                {/* Job Information */}
                {selectedAssignmentDetails.job && (
                  <View style={styles.jobDetailSection}>
                    <Text style={styles.jobDetailSectionTitle}>Job Information</Text>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Job Title:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.title}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Description:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.description}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Department:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.department}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Specialization:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.specialization}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Location:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.location}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Facility Name:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.facilityName}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Unit Code:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.unitCode}</Text>
                    </View>
                    {selectedAssignmentDetails.job.facilityAddress && (
                      <>
                        <View style={styles.jobDetailRow}>
                          <Text style={styles.jobDetailLabel}>Address:</Text>
                          <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.facilityAddress.street}</Text>
                        </View>
                        <View style={styles.jobDetailRow}>
                          <Text style={styles.jobDetailLabel}>City:</Text>
                          <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.facilityAddress.city}</Text>
                        </View>
                        <View style={styles.jobDetailRow}>
                          <Text style={styles.jobDetailLabel}>State:</Text>
                          <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.facilityAddress.state}</Text>
                        </View>
                        <View style={styles.jobDetailRow}>
                          <Text style={styles.jobDetailLabel}>Country:</Text>
                          <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.facilityAddress.country}</Text>
                        </View>
                        <View style={styles.jobDetailRow}>
                          <Text style={styles.jobDetailLabel}>ZIP Code:</Text>
                          <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.facilityAddress.zipCode}</Text>
                        </View>
                      </>
                    )}
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Start Date:</Text>
                      <Text style={styles.jobDetailValue}>
                        {new Date(selectedAssignmentDetails.job.startDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>End Date:</Text>
                      <Text style={styles.jobDetailValue}>
                        {new Date(selectedAssignmentDetails.job.endDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Start Time:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.startTime}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>End Time:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.job.endTime}</Text>
                    </View>
                  </View>
                )}

                {/* User Information */}
                {selectedAssignmentDetails.user && (
                  <View style={styles.jobDetailSection}>
                    <Text style={styles.jobDetailSectionTitle}>Assigned User</Text>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Name:</Text>
                      <Text style={styles.jobDetailValue}>
                        {selectedAssignmentDetails.user.firstName} {selectedAssignmentDetails.user.lastName}
                      </Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Email:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.user.email}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Phone:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.user.phone}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Role:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.user.role}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Department:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.user.department}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Specialization:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.user.specialization}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Location:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.user.location}</Text>
                    </View>
                  </View>
                )}

                {/* Assigner Information */}
                {selectedAssignmentDetails.assigner && (
                  <View style={styles.jobDetailSection}>
                    <Text style={styles.jobDetailSectionTitle}>Assigned By</Text>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Name:</Text>
                      <Text style={styles.jobDetailValue}>
                        {selectedAssignmentDetails.assigner.firstName} {selectedAssignmentDetails.assigner.lastName}
                      </Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Email:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.assigner.email}</Text>
                    </View>
                  </View>
                )}

                {/* Timeline Information */}
                <View style={styles.jobDetailSection}>
                  <Text style={styles.jobDetailSectionTitle}>Timeline</Text>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Created At:</Text>
                    <Text style={styles.jobDetailValue}>
                      {new Date(selectedAssignmentDetails.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Updated At:</Text>
                    <Text style={styles.jobDetailValue}>
                      {new Date(selectedAssignmentDetails.updatedAt).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Accepted At:</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedAssignmentDetails.acceptedAt ? new Date(selectedAssignmentDetails.acceptedAt).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Confirmed At:</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedAssignmentDetails.confirmedAt ? new Date(selectedAssignmentDetails.confirmedAt).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Rejected At:</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedAssignmentDetails.rejectedAt ? new Date(selectedAssignmentDetails.rejectedAt).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Started At:</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedAssignmentDetails.startedAt ? new Date(selectedAssignmentDetails.startedAt).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Completed At:</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedAssignmentDetails.completedAt ? new Date(selectedAssignmentDetails.completedAt).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Cancelled At:</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedAssignmentDetails.cancelledAt ? new Date(selectedAssignmentDetails.cancelledAt).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Actual Start Time:</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedAssignmentDetails.actualStartTime ? new Date(selectedAssignmentDetails.actualStartTime).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Actual End Time:</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedAssignmentDetails.actualEndTime ? new Date(selectedAssignmentDetails.actualEndTime).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Additional Information */}
                <View style={styles.jobDetailSection}>
                  <Text style={styles.jobDetailSectionTitle}>Additional Information</Text>
                  {selectedAssignmentDetails.rejectionReason && (
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Rejection Reason:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.rejectionReason}</Text>
                    </View>
                  )}
                  {selectedAssignmentDetails.cancellationReason && (
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Cancellation Reason:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.cancellationReason}</Text>
                    </View>
                  )}
                  {selectedAssignmentDetails.extensionRequestReason && (
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Extension Request Reason:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.extensionRequestReason}</Text>
                    </View>
                  )}
                  {selectedAssignmentDetails.notes && (
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Notes:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.notes}</Text>
                    </View>
                  )}
                  {selectedAssignmentDetails.rating && (
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Rating:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.rating}/5</Text>
                    </View>
                  )}
                  {selectedAssignmentDetails.feedback && (
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Feedback:</Text>
                      <Text style={styles.jobDetailValue}>{selectedAssignmentDetails.feedback}</Text>
                    </View>
                  )}
                </View>

                {/* Check-ins */}
                {selectedAssignmentDetails.checkIns && selectedAssignmentDetails.checkIns.length > 0 && (
                  <View style={styles.jobDetailSection}>
                    <Text style={styles.jobDetailSectionTitle}>Check-ins</Text>
                    {selectedAssignmentDetails.checkIns.map((checkIn: any, index: number) => (
                      <View key={index} style={styles.checkInCard}>
                        <View style={styles.jobDetailRow}>
                          <Text style={styles.jobDetailLabel}>Check-in Time:</Text>
                          <Text style={styles.jobDetailValue}>
                            {new Date(checkIn.checkInTime).toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.jobDetailRow}>
                          <Text style={styles.jobDetailLabel}>Check-out Time:</Text>
                          <Text style={styles.jobDetailValue}>
                            {checkIn.checkOutTime ? new Date(checkIn.checkOutTime).toLocaleString() : 'N/A'}
                          </Text>
                        </View>
                        <View style={styles.jobDetailRow}>
                          <Text style={styles.jobDetailLabel}>Total Work Time:</Text>
                          <Text style={styles.jobDetailValue}>{checkIn.totalWorkTime} minutes</Text>
                        </View>
                        <View style={styles.jobDetailRow}>
                          <Text style={styles.jobDetailLabel}>Status:</Text>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(checkIn.status) }
                          ]}>
                            <Text style={styles.statusText}>{checkIn.status}</Text>
                          </View>
                        </View>
                        {checkIn.notes && (
                          <View style={styles.jobDetailRow}>
                            <Text style={styles.jobDetailLabel}>Notes:</Text>
                            <Text style={styles.jobDetailValue}>{checkIn.notes}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={styles.errorContainer}>
                <FontAwesomeIcon icon="exclamation-triangle" size={48} color={Colors.error} />
                <Text style={styles.errorText}>Failed to load assignment details</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Footer Navigation */}
      <HRFooterNavigation activeRoute="Reports" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
  },
  filterButton: {
    padding: Spacing.sm,
  },
  tabsContainer: {
    backgroundColor: Colors.background,
    marginVertical: Spacing.lg,
  },
  tabsContent: {
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  generateCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  generateTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    minHeight: 48,
    overflow: 'hidden',
  },
  dateButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.xs,
    textAlign: 'left',
  },
  dateButtonIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  startDateButtonIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: -Spacing.sm,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  pickerOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pickerOptionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  pickerOptionTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  generateButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
  recentReportsSection: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  reportCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  reportTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  reportType: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  reportDate: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  reportStats: {
    marginTop: Spacing.xs,
  },
  reportStatsText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  // Job Selection Styles
  jobSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    minHeight: 48,
  },
  jobSelectorText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    flex: 1,
  },
  selectedJobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    minHeight: 48,
  },
  selectedJobInfo: {
    flex: 1,
  },
  selectedJobTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  selectedJobDetails: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  selectedJobDates: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },
  clearJobButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    width: width * 0.9,
    maxHeight: '80%',
    ...Shadow.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobList: {
    maxHeight: 400,
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  jobItemContent: {
    flex: 1,
  },
  jobItemTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  jobItemDetails: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  jobItemDates: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },
  // Job Lists Styles
  jobListsContainer: {
    marginBottom: Spacing['2xl'],
  },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  jobCardTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  jobCardDepartment: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  jobCardLocation: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  jobCardDates: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  jobCardFooter: {
    alignItems: 'flex-end',
    marginTop: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
  // Job Detail Modal Styles
  jobDetailModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  jobDetailModalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '90%',
    ...Shadow.xl,
  },
  jobDetailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  jobDetailModalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  jobDetailModalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobDetailModalContent: {
    maxHeight: '80%',
  },
  jobDetailSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  jobDetailSectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  jobDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  jobDetailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  jobDetailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  assignmentCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.error,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  jobDetailNotes: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  checkInSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checkInSectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  checkInCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xs,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default ReportsScreen;
