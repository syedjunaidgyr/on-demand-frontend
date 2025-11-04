import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Platform,
  Share,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Shadow, BorderRadius } from '../../constants/spacing';
import ApiService from '../../services/api';
import GlobalHeader from '../../components/GlobalHeader';
import Responsive from '../../utils/responsive';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ExportUtils from '../../utils/exportUtils';
import { getFinalApiUrl } from '../../config/api';
// use require inline to ensure Metro resolves assets reliably on all platforms

const { width } = Dimensions.get('window');
// Static fallbacks (overridden at runtime by useWindowDimensions values)
const horizontalGutter = width < 360 ? Spacing.sm : width < 400 ? Spacing.md : Spacing.lg;
const tabsStartPadding = width < 360 ? Spacing.xs : Spacing.sm;
const tabsEndPadding = horizontalGutter;

  // Local icons (static imports)

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
  const scrollRef = useRef<ScrollView>(null);
  const tabsListRef = useRef<FlatList>(null);
  const { width: windowWidth } = useWindowDimensions();
  const dynamicHorizontalGutter = windowWidth < 360 ? Spacing.sm : windowWidth < 400 ? Spacing.md : Spacing.lg;
  const dynamicTabsStartPadding = windowWidth < 360 ? Spacing.xs : Spacing.sm;
  const dynamicTabsEndPadding = dynamicHorizontalGutter;
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
  const [exportingJobId, setExportingJobId] = useState<number | null>(null);
  const [exportingAssignmentId, setExportingAssignmentId] = useState<number | null>(null);
  const [showJobsExportMenu, setShowJobsExportMenu] = useState(false);
  const [showJobExportMenuForId, setShowJobExportMenuForId] = useState<number | null>(null);
  const [showAssignmentExportMenuForId, setShowAssignmentExportMenuForId] = useState<number | null>(null);
  const [showJobsFilterModal, setShowJobsFilterModal] = useState(false);
  const [jobsFilterTitle, setJobsFilterTitle] = useState('');
  const [jobsFilterStatus, setJobsFilterStatus] = useState('');
  const [jobsFilterStartDate, setJobsFilterStartDate] = useState('');
  const [jobsFilterEndDate, setJobsFilterEndDate] = useState('');
  const [jobsFilterDepartment, setJobsFilterDepartment] = useState('');
  const [jobsDeptDropdownOpen, setJobsDeptDropdownOpen] = useState(false);
  const [showAssignmentsExportMenu, setShowAssignmentsExportMenu] = useState(false);
  const [showAssignmentsFilterModal, setShowAssignmentsFilterModal] = useState(false);
  const [assignmentsFilterTitle, setAssignmentsFilterTitle] = useState('');
  const [assignmentsFilterStatus, setAssignmentsFilterStatus] = useState('');
  const [assignmentsFilterStartDate, setAssignmentsFilterStartDate] = useState('');
  const [assignmentsFilterEndDate, setAssignmentsFilterEndDate] = useState('');
  const [assignmentsFilterDepartment, setAssignmentsFilterDepartment] = useState('');
  const [assignmentsDeptDropdownOpen, setAssignmentsDeptDropdownOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showJobsStartPicker, setShowJobsStartPicker] = useState(false);
  const [showJobsEndPicker, setShowJobsEndPicker] = useState(false);
  const [showAssignmentsStartPicker, setShowAssignmentsStartPicker] = useState(false);
  const [showAssignmentsEndPicker, setShowAssignmentsEndPicker] = useState(false);
  
  // Check-In/Out filter states
  const [checkinFilterTitle, setCheckinFilterTitle] = useState('');
  const [checkinFilterStatus, setCheckinFilterStatus] = useState('');
  const [checkinFilterStartDate, setCheckinFilterStartDate] = useState('');
  const [checkinFilterEndDate, setCheckinFilterEndDate] = useState('');
  const [checkinFilterDepartment, setCheckinFilterDepartment] = useState('');
  const [checkinDeptDropdownOpen, setCheckinDeptDropdownOpen] = useState(false);
  const [showCheckinExportMenu, setShowCheckinExportMenu] = useState(false);
  const [showCheckinExportMenuForId, setShowCheckinExportMenuForId] = useState<string | null>(null);
  const [showCheckinFilterModal, setShowCheckinFilterModal] = useState(false);
  const [showCheckinStartPicker, setShowCheckinStartPicker] = useState(false);
  const [showCheckinEndPicker, setShowCheckinEndPicker] = useState(false);
  

  // Helper: current filtered jobs (Title + Department)
  const getFilteredJobs = () => {
    const titleQuery = jobsFilterTitle.trim().toLowerCase();
    const statusFilter = jobsFilterStatus.trim();
    const startFilter = jobsFilterStartDate.trim();
    const endFilter = jobsFilterEndDate.trim();
    const deptFilter = jobsFilterDepartment.trim();
    return jobs.filter((j) => {
      const byTitle = titleQuery.length === 0 || (j.title || '').toLowerCase().includes(titleQuery);
      const byStatus = statusFilter.length === 0 || (j.status || '') === statusFilter;
      const jobStart = (j.startDate || '').split('T')[0];
      const jobEnd = (j.endDate || '').split('T')[0];
      const byStart = startFilter.length === 0 || (jobStart && jobStart >= startFilter);
      const byEnd = endFilter.length === 0 || (jobEnd && jobEnd <= endFilter);
      const byDept = deptFilter.length === 0 || (j.department || '') === deptFilter;
      return byTitle && byStatus && byStart && byEnd && byDept;
    });
  };

  // Helper: current filtered assignments (Job Title + Department)
  const getFilteredAssignments = () => {
    const titleQuery = assignmentsFilterTitle.trim().toLowerCase();
    const statusFilter = assignmentsFilterStatus.trim();
    const startFilter = assignmentsFilterStartDate.trim();
    const endFilter = assignmentsFilterEndDate.trim();
    const deptFilter = assignmentsFilterDepartment.trim();
    return assignments.filter((a) => {
      const jobTitle = (a.job?.title || '').toLowerCase();
      const jobStart = (a.job?.startDate || '').split('T')[0];
      const jobEnd = (a.job?.endDate || '').split('T')[0];
      const jobDept = a.job?.department || '';
      const byTitle = titleQuery.length === 0 || jobTitle.includes(titleQuery);
      const byStatus = statusFilter.length === 0 || (a.status || '') === statusFilter;
      const byStart = startFilter.length === 0 || (jobStart && jobStart >= startFilter);
      const byEnd = endFilter.length === 0 || (jobEnd && jobEnd <= endFilter);
      const byDept = deptFilter.length === 0 || jobDept === deptFilter;
      return byTitle && byStatus && byStart && byEnd && byDept;
    });
  };

  // Helper: current filtered check-ins
  const getFilteredCheckIns = () => {
    const allCheckIns = [
      ...(realtimeData?.activeStaffDetails || []).map((item: any) => ({ ...item, isActive: true })),
      ...attendanceData
    ];
    
    const titleQuery = checkinFilterTitle.trim().toLowerCase();
    const statusFilter = checkinFilterStatus.trim();
    const startFilter = checkinFilterStartDate.trim();
    const endFilter = checkinFilterEndDate.trim();
    const deptFilter = checkinFilterDepartment.trim();
    
    return allCheckIns.filter((item) => {
      const userName = item.isActive 
        ? (item.userName || '').toLowerCase()
        : (item.user ? `${item.user.firstName} ${item.user.lastName}` : '').toLowerCase();
      const byTitle = titleQuery.length === 0 || userName.includes(titleQuery);
      
      const itemStatus = item.status || 'CHECKED_IN';
      const byStatus = statusFilter.length === 0 || itemStatus === statusFilter;
      
      const checkInDate = new Date(item.checkInTime).toISOString().split('T')[0];
      const byStart = startFilter.length === 0 || checkInDate >= startFilter;
      const byEnd = endFilter.length === 0 || checkInDate <= endFilter;
      
      const dept = item.isActive 
        ? (item.department || item.jobDepartment || '')
        : (item.job?.department || '');
      const byDept = deptFilter.length === 0 || dept === deptFilter;
      
      return byTitle && byStatus && byStart && byEnd && byDept;
    });
  };

  

  const formatDateShort = (dateString?: string) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Check-In/Out state
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [attendanceCheckOuts, setAttendanceCheckOuts] = useState<any[]>([]);
  const [loadingRealtime, setLoadingRealtime] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
  const [showTimesheetModal, setShowTimesheetModal] = useState(false);
  const [attendanceFilters, setAttendanceFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    userId: '',
    department: '',
  });

  // Payout tab state
  const [payoutFilters, setPayoutFilters] = useState<{ startDate: string; endDate: string; userId?: string; jobId?: string }>(
    {
      startDate: '',
      endDate: '',
      userId: '',
      jobId: '',
    }
  );
  const [payoutData, setPayoutData] = useState<{ lines: any[]; totals: { byUser: any[]; grandTotal: number }; period?: any }>(
    { lines: [], totals: { byUser: [], grandTotal: 0 } }
  );
  const [loadingPayout, setLoadingPayout] = useState(false);
  const [showPayoutStartPicker, setShowPayoutStartPicker] = useState(false);
  const [showPayoutEndPicker, setShowPayoutEndPicker] = useState(false);
  const [showPayoutExportMenu, setShowPayoutExportMenu] = useState(false);
  const [showPayoutExportMenuForId, setShowPayoutExportMenuForId] = useState<string | number | null>(null);
  // Local (frontend-only) filters for payout tab
  const [showPayoutFilterModal, setShowPayoutFilterModal] = useState(false);
  const [payoutLocalFilters, setPayoutLocalFilters] = useState<{
    search: string;
    startDate: string;
    endDate: string;
    userId: string;
    jobId: string;
    minAmount: string;
    maxAmount: string;
  }>({ search: '', startDate: '', endDate: '', userId: '', jobId: '', minAmount: '', maxAmount: '' });
  const [showPayoutLocalStartPicker, setShowPayoutLocalStartPicker] = useState(false);
  const [showPayoutLocalEndPicker, setShowPayoutLocalEndPicker] = useState(false);
  const [showPayoutDetailModal, setShowPayoutDetailModal] = useState(false);
  const [selectedPayoutDetails, setSelectedPayoutDetails] = useState<any>(null);

  const buildPdfUrlForJob = (jobId: number) => `${getFinalApiUrl()}/reports/jobs/${jobId}.pdf`;
  const buildPdfUrlForAssignment = (assignmentId: number) => `${getFinalApiUrl()}/reports/assignments/${assignmentId}.pdf`;
  const buildPdfUrlForAllJobs = () => `${getFinalApiUrl()}/reports/jobs.pdf`;
  const buildPdfUrlForAllAssignments = () => `${getFinalApiUrl()}/reports/assignments.pdf`;

  const reportTypes = [
    { key: 'job-lists', label: 'Jobs', icon: 'list' },
    { key: 'assigned', label: 'Assigned', icon: 'users' },
    { key: 'checkin-out', label: 'Check-In/Out', icon: 'clock' },
    { key: 'payout', label: 'Payout', icon: 'rupee-sign' },
    // { key: 'job-postings', label: 'Job Postings', icon: 'briefcase' },
    // { key: 'assignments', label: 'Assignments', icon: 'users' },
    // { key: 'attendance', label: 'Attendance', icon: 'clock' },
    // { key: 'no-shows', label: 'No-Shows', icon: 'times-circle' },
    // { key: 'financial', label: 'Financial', icon: 'dollar-sign' },
  ];

  // Derived list: apply frontend-only filters to payout lines
  const getFilteredPayoutLines = () => {
    const lines = payoutData.lines || [];
    const {
      search,
      startDate: fStart,
      endDate: fEnd,
      userId: fUserId,
      jobId: fJobId,
      minAmount,
      maxAmount,
    } = payoutLocalFilters;

    const s = (search || '').trim().toLowerCase();
    const start = (fStart || '').trim();
    const end = (fEnd || '').trim();
    const uid = (fUserId || '').trim();
    const jid = (fJobId || '').trim();
    const minA = minAmount ? parseFloat(minAmount) : undefined;
    const maxA = maxAmount ? parseFloat(maxAmount) : undefined;

    return lines.filter((line: any) => {
      // text search on staffName or jobTitle
      const byText = s.length === 0 ||
        ((line.staffName || '').toLowerCase().includes(s)) ||
        ((line.jobTitle || '').toLowerCase().includes(s));

      // userId/jobId exact matches if provided
      const byUser = uid.length === 0 || String(line.userId || '').toLowerCase() === uid.toLowerCase();
      const byJob = jid.length === 0 || String(line.jobId || '').toLowerCase() === jid.toLowerCase();

      // amount range
      const amt = Number(line.amount || 0);
      const byMin = typeof minA === 'undefined' || amt >= minA;
      const byMax = typeof maxA === 'undefined' || amt <= maxA;

      // date range: support multiple shapes
      const nestedCheckInTime: string | undefined = (line as any)?.checkIn?.checkInTime;
      const flatCheckInTime: string | undefined = (line as any)?.checkInTime;
      const assignmentStartedAt: string | undefined = (line as any)?.assignment?.startedAt;
      const jobStartDate: string | undefined = (line as any)?.job?.startDate;
      const shiftDatesArr: string[] = Array.isArray((line as any)?.shiftDates) ? (line as any).shiftDates : [];
      const candidateDates: string[] = [
        ...shiftDatesArr,
        ...(flatCheckInTime ? [flatCheckInTime] : []),
        ...(nestedCheckInTime ? [nestedCheckInTime] : []),
        ...(assignmentStartedAt ? [assignmentStartedAt] : []),
        ...(jobStartDate ? [jobStartDate] : []),
      ];
      const byDates = (start.length === 0 && end.length === 0) || (candidateDates.length === 0
        ? true
        : candidateDates.some((d) => {
            const ds = String(d).slice(0, 10);
            if (start.length > 0 && ds < start) return false;
            if (end.length > 0 && ds > end) return false;
            return true;
          }));

      return byText && byUser && byJob && byMin && byMax && byDates;
    });
  };

  // Hardcoded departments used in registration page
  const hardcodedDepartments = [
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

  // Load realtime dashboard data when Check-In/Out tab is selected
  useEffect(() => {
    console.log('🧭 Selected report tab:', selectedReportType);
    if (selectedReportType === 'checkin-out') {
      loadRealtimeData();
    }
    // Always scroll to top when changing tabs
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    // Ensure the selected tab pill is brought into view
    const index = reportTypes.findIndex(rt => rt.key === selectedReportType);
    if (index >= 0) {
      try {
        tabsListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
      } catch {}
    }
  }, [selectedReportType]);

  const fetchPayoutWith = async (startDate: string, endDate: string, userId?: string, jobId?: string) => {
    try {
      setLoadingPayout(true);
      console.log('▶️ fetchPayoutWith called with:', { startDate, endDate, userId, jobId });
      const resp = await ApiService.getPayoutReport({
        startDate,
        endDate,
        userId: userId || undefined,
        jobId: jobId || undefined,
      });
      const data = (resp as any)?.data || resp;
      console.log('✅ Payout data received. lines:', Array.isArray(data?.lines) ? data.lines.length : 0, 'grandTotal:', data?.totals?.grandTotal);
      setPayoutData({
        lines: data?.lines || [],
        totals: data?.totals || { byUser: [], grandTotal: 0 },
        period: data?.period,
      });
    } catch (e: any) {
      console.log('Failed to load payout report:', e?.message || e);
      setPayoutData({ lines: [], totals: { byUser: [], grandTotal: 0 } });
    } finally {
      setLoadingPayout(false);
    }
  };
  const fetchPayout = async () => {
    const today = formatDate(new Date());
    const start = payoutFilters.startDate || today;
    const end = payoutFilters.endDate || today;
    await fetchPayoutWith(start, end, payoutFilters.userId, payoutFilters.jobId);
  };

  // Ensure payout filters have sensible defaults on mount (today -> today)
  useEffect(() => {
    setPayoutFilters(prev => {
      const today = formatDate(new Date());
      console.log('🗓️ Initializing payout dates to today:', today);
      return {
        ...prev,
        startDate: prev.startDate || today,
        endDate: prev.endDate || today,
      };
    });
  }, []);

  // Auto-fetch payout data when the Payout tab is active and filters change
  useEffect(() => {
    if (selectedReportType !== 'payout') return;
    const { startDate, endDate, userId, jobId } = payoutFilters;
    if (!startDate || !endDate) return;
    // Guard: skip invalid ranges
    if (startDate > endDate) {
      console.log('⛔ Skipping payout fetch due to invalid range:', { startDate, endDate });
      return;
    }
    console.log('🔄 Triggering payout fetch due to filters change:', { startDate, endDate, userId, jobId });
    fetchPayoutWith(startDate, endDate, userId, jobId);
  }, [selectedReportType, payoutFilters.startDate, payoutFilters.endDate, payoutFilters.userId, payoutFilters.jobId]);

  const loadRealtimeData = async () => {
    try {
      setLoadingRealtime(true);
      const res = await ApiService.getRealtimeTrackingDashboard();
      // ApiService already returns response.data; backend may wrap as { message, data }
      const payload = (res as any)?.data || res;
      setRealtimeData(payload || {});
      setAttendanceData(Array.isArray(payload?.allCheckIns) ? payload.allCheckIns : []);
      const outs = Array.isArray(payload?.allCheckOuts)
        ? payload.allCheckOuts
        : (Array.isArray(payload?.allCheckIns)
            ? payload.allCheckIns.filter((r: any) => r.status === 'CHECKED_OUT')
            : []);
      setAttendanceCheckOuts(outs);
    } catch (e) {
      setRealtimeData(null);
      setAttendanceData([]);
      setAttendanceCheckOuts([]);
      console.log('Failed to load realtime dashboard:', e);
    } finally {
      setLoadingRealtime(false);
    }
  };

  // Helpers for the Check-In/Out tab
  const formatElapsedMinutes = (mins?: number) => {
    if (!mins || mins <= 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const mapCheckInToTimesheet = (item: any) => ({
    assignmentId: item.assignmentId || item.id,
    job: item.job || null,
    user: item.user || null,
    checkIns: [
      {
        id: item.id,
        checkInTime: item.checkInTime,
        checkOutTime: item.checkOutTime,
        status: item.status,
        workTime: item.totalWorkTime ? `${item.totalWorkTime}m` : undefined,
        breakTime: item.totalBreakTime ? `${item.totalBreakTime}m` : undefined,
        notes: item.notes,
      },
    ],
    totalWorkTime: item.totalWorkTime ? `${item.totalWorkTime}m` : undefined,
    totalBreakTime: item.totalBreakTime ? `${item.totalBreakTime}m` : undefined,
    lateMinutes: item.isLate ? '—' : '0',
    earlyCheckoutMinutes: item.isEarlyCheckout ? '—' : '0',
  });

  const mapActiveToTimesheet = (active: any) => ({
    assignmentId: active.assignmentId || active.userId,
    job: {
      title: active.jobTitle,
      department: active.jobDepartment || active.department,
      location: active.facilityName,
      startDate: active.checkInTime,
      endDate: undefined,
    },
    user: {
      firstName: (active.userName || '').split(' ')[0] || active.userName,
      lastName: (active.userName || '').split(' ').slice(1).join(' '),
      role: active.role,
      department: active.department,
    },
    checkIns: [
      {
        id: active.userId,
        checkInTime: active.checkInTime,
        checkOutTime: null,
        status: 'CHECKED_IN',
        workTime: active.workTimeMinutes ? `${active.workTimeMinutes}m` : undefined,
      },
    ],
    totalWorkTime: active.workTimeMinutes ? `${active.workTimeMinutes}m` : undefined,
    totalBreakTime: '0m',
    lateMinutes: active.isLate ? '—' : '0',
    earlyCheckoutMinutes: '0',
  });

  const openRealtimeCheckInModal = (item: any) => {
    const mapped = mapCheckInToTimesheet(item);
    setSelectedTimesheet(mapped as any);
    setShowTimesheetModal(true);
  };

  const openRealtimeCheckInModalFromActive = (active: any) => {
    const mapped = mapActiveToTimesheet(active);
    setSelectedTimesheet(mapped as any);
    setShowTimesheetModal(true);
  };

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
      // Additional statuses for assignments and check-ins
      case 'IN_PROGRESS':
        return Colors.warning;
      case 'CHECKED_IN':
        return Colors.primary;
      case 'CHECKED_OUT':
        return Colors.success;
      case 'MISSED':
        return Colors.error;
      case 'LATE':
        return Colors.warning;
      case 'CONFIRMED':
        return Colors.primary;
      case 'REJECTED':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const formatStatusLabel = (status: string) => {
    if (!status) return '';
    return status
      .toString()
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
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

  // Export function for individual job
  const handleExportJob = async (jobId: number, format: 'pdf' | 'excel') => {
    try {
      setExportingJobId(jobId);
      const job = jobs.find(j => j.id === jobId);
      if (!job) {
        return;
      }

      const fileName = `Job_${job.title.replace(/\s+/g, '_')}_${new Date().getTime()}`;

      if (format === 'pdf') {
        const data = {
          id: job.id,
          title: job.title,
          department: job.department,
          location: job.location,
          startDate: job.startDate,
          endDate: job.endDate,
          status: job.status,
          specialization: job.specialization,
        };
        await ExportUtils.generateAndSavePDF([data], fileName, ['id', 'title', 'department', 'location', 'startDate', 'endDate', 'status', 'specialization'], `Job #${job.id}`);
      } else if (format === 'excel') {
        const data = {
          id: job.id,
          title: job.title,
          department: job.department,
          location: job.location,
          startDate: job.startDate,
          endDate: job.endDate,
          status: job.status,
          specialization: job.specialization,
        };
        await ExportUtils.exportToXLSXFile([data], fileName, ['id', 'title', 'department', 'location', 'startDate', 'endDate', 'status', 'specialization']);
      }
    } catch (error) {
      console.error(`Export to ${format.toUpperCase()} failed:`, error);
      Alert.alert('Export Failed', `Could not export to ${format.toUpperCase()}`);
    } finally {
      setExportingJobId(null);
    }
  };

  // Export function for individual assignment
  const handleExportAssignment = async (assignmentId: number, format: 'pdf' | 'excel') => {
    try {
      setExportingAssignmentId(assignmentId);
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        return;
      }

      const fileName = `Assignment_${assignmentId}_${new Date().getTime()}`;

      if (format === 'pdf') {
        const a = assignment;
        const data = {
          id: a.id,
          jobTitle: a.job?.title || 'N/A',
          userName: a.user ? `${a.user.firstName} ${a.user.lastName}` : 'Unknown',
          status: a.status,
          totalHours: a.totalHours,
          totalPayment: a.totalPayment,
          hourlyRate: a.hourlyRate,
          createdAt: a.createdAt,
        };
        await ExportUtils.generateAndSavePDF([data], fileName, ['id', 'jobTitle', 'userName', 'status', 'totalHours', 'totalPayment', 'hourlyRate', 'createdAt'], `Assignment #${assignmentId}`);
      } else if (format === 'excel') {
        const data = {
          id: assignment.id,
          jobTitle: assignment.job?.title || 'N/A',
          userName: assignment.user ? `${assignment.user.firstName} ${assignment.user.lastName}` : 'Unknown',
          status: assignment.status,
          totalHours: assignment.totalHours,
          totalPayment: assignment.totalPayment,
          hourlyRate: assignment.hourlyRate,
          createdAt: assignment.createdAt,
        };
        await ExportUtils.exportToXLSXFile([data], fileName, ['id', 'jobTitle', 'userName', 'status', 'totalHours', 'totalPayment', 'hourlyRate', 'createdAt']);
      }
    } catch (error) {
      console.error(`Export to ${format.toUpperCase()} failed:`, error);
      Alert.alert('Export Failed', `Could not export to ${format.toUpperCase()}`);
    } finally {
      setExportingAssignmentId(null);
    }
  };

  // Export all jobs
  const handleExportAllJobs = async (format: 'pdf' | 'excel') => {
    try {
      setIsGenerating(true);
      const fileName = `All_Jobs_${new Date().getTime()}`;

      // Apply current Title/Department filters to exported dataset
      const filtered = getFilteredJobs();
      if (!filtered || filtered.length === 0) {
        Alert.alert('Nothing to export', 'No jobs match the current filters');
        return;
      }

      if (format === 'pdf') {
        const rows = filtered.map(job => ({
          id: job.id,
          title: job.title,
          department: job.department,
          location: job.location,
          startDate: job.startDate,
          endDate: job.endDate,
          status: job.status,
          specialization: job.specialization,
        }));
        await ExportUtils.generateAndSavePDF(rows, fileName, ['id', 'title', 'department', 'location', 'startDate', 'endDate', 'status', 'specialization'], 'All Jobs');
      } else if (format === 'excel') {
        const jobsData = filtered.map(job => ({
          id: job.id,
          title: job.title,
          department: job.department,
          location: job.location,
          startDate: job.startDate,
          endDate: job.endDate,
          status: job.status,
          specialization: job.specialization,
        }));
        await ExportUtils.exportToXLSXFile(jobsData, fileName, ['id', 'title', 'department', 'location', 'startDate', 'endDate', 'status', 'specialization']);
      }
    } catch (error) {
      console.error(`Export to ${format.toUpperCase()} failed:`, error);
      Alert.alert('Export Failed', `Could not export to ${format.toUpperCase()}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Export all assignments
  const handleExportAllAssignments = async (format: 'pdf' | 'excel') => {
    try {
      setIsGenerating(true);
      const fileName = `All_Assignments_${new Date().getTime()}`;
      const filtered = getFilteredAssignments();
      if (!filtered || filtered.length === 0) {
        Alert.alert('Nothing to export', 'No assignments match the current filters');
        return;
      }

      if (format === 'pdf') {
        const rows = filtered.map(a => ({
          id: a.id,
          jobTitle: a.job?.title || 'N/A',
          userName: a.user ? `${a.user.firstName} ${a.user.lastName}` : 'Unknown',
          status: a.status,
          totalHours: a.totalHours,
          totalPayment: a.totalPayment,
          hourlyRate: a.hourlyRate,
          createdAt: a.createdAt,
        }));
        await ExportUtils.generateAndSavePDF(rows, fileName, ['id', 'jobTitle', 'userName', 'status', 'totalHours', 'totalPayment', 'hourlyRate', 'createdAt'], 'All Assignments');
      } else if (format === 'excel') {
        const assignmentsData = filtered.map(a => ({
          id: a.id,
          jobTitle: a.job?.title || 'N/A',
          userName: a.user ? `${a.user.firstName} ${a.user.lastName}` : 'Unknown',
          status: a.status,
          totalHours: a.totalHours,
          totalPayment: a.totalPayment,
          hourlyRate: a.hourlyRate,
          createdAt: a.createdAt,
        }));
        await ExportUtils.exportToXLSXFile(assignmentsData, fileName, ['id', 'jobTitle', 'userName', 'status', 'totalHours', 'totalPayment', 'hourlyRate', 'createdAt']);
      }
    } catch (error) {
      console.error(`Export to ${format.toUpperCase()} failed:`, error);
      Alert.alert('Export Failed', `Could not export to ${format.toUpperCase()}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Timesheet export functions
  const handleExportAllCheckIns = async (format: 'pdf' | 'excel') => {
    try {
      setIsGenerating(true);
      const allData = [
        ...(realtimeData?.activeStaffDetails || []).map((item: any) => mapActiveToTimesheet(item)),
        ...attendanceData.map((item: any) => mapCheckInToTimesheet(item))
      ];

      if (format === 'pdf') {
        await ExportUtils.generateAndSavePDF(allData, 'checkin-out-report', ['assignmentId', 'userName', 'jobTitle', 'checkInTime', 'checkOutTime', 'status', 'totalWorkTime', 'totalBreakTime'], 'Check-In/Out Report');
      } else {
        await ExportUtils.exportToXLSXFile(allData, 'checkin-out-report', ['assignmentId', 'userName', 'jobTitle', 'checkInTime', 'checkOutTime', 'status', 'totalWorkTime', 'totalBreakTime']);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Failed to export check-in/out data');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export payout data
  const handleExportPayout = async (format: 'pdf' | 'excel') => {
    try {
      if (!payoutData.lines || payoutData.lines.length === 0) {
        Alert.alert('Nothing to export', 'Generate payout first');
        return;
      }
      setIsGenerating(true);
      const rows = payoutData.lines.map((r: any) => ({
        jobId: r.jobId,
        jobTitle: r.jobTitle,
        assignmentId: r.assignmentId,
        userId: r.userId,
        staffName: r.staffName,
        shiftDates: (r.shiftDates || []).join(', '),
        minutesWorked: r.minutesWorked,
        hoursWorked: r.hoursWorked,
        hourlyRate: r.hourlyRate,
        amount: r.amount,
      }));
      const headers = ['jobId','jobTitle','assignmentId','userId','staffName','shiftDates','minutesWorked','hoursWorked','hourlyRate','amount'];
      const fileBase = `Payout_${payoutFilters.startDate || ''}_${payoutFilters.endDate || ''}`;
      if (format === 'pdf') {
        await ExportUtils.generateAndSavePDF(rows, fileBase, headers, 'Check-In/Out Payout');
      } else {
        await ExportUtils.exportToXLSXFile(rows, fileBase, headers);
      }
    } catch (error) {
      console.error('Export payout failed:', error);
      Alert.alert('Export Failed', 'Could not export payout report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export single payout line
  const handleExportSinglePayout = async (item: any, format: 'pdf' | 'excel') => {
    try {
      setIsGenerating(true);
      const row = {
        jobId: item.jobId,
        jobTitle: item.jobTitle,
        assignmentId: item.assignmentId,
        userId: item.userId,
        staffName: item.staffName,
        shiftDates: (item.shiftDates || []).join(', '),
        minutesWorked: item.minutesWorked,
        hoursWorked: item.hoursWorked,
        hourlyRate: item.hourlyRate,
        amount: item.amount,
      };
      const headers = ['jobId','jobTitle','assignmentId','userId','staffName','shiftDates','minutesWorked','hoursWorked','hourlyRate','amount'];
      const fileBase = `Payout_${item.assignmentId || ''}_${new Date().getTime()}`;
      if (format === 'pdf') {
        await ExportUtils.generateAndSavePDF([row], fileBase, headers, 'Payout Line');
      } else {
        await ExportUtils.exportToXLSXFile([row], fileBase, headers);
      }
    } catch (error) {
      console.error('Export single payout failed:', error);
      Alert.alert('Export Failed', 'Could not export payout line');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportTimesheet = async (timesheetData: any, format: 'pdf' | 'excel') => {
    try {
      const fileName = `Timesheet_${timesheetData.assignmentId || timesheetData.id}_${new Date().getTime()}`;
      
      if (format === 'pdf') {
        const rows = timesheetData.checkIns?.map((checkIn: any) => ({
          id: checkIn.id,
          checkInTime: checkIn.checkInTime,
          checkOutTime: checkIn.checkOutTime || 'In Progress',
          workTime: checkIn.workTime || 'N/A',
          breakTime: checkIn.breakTime || 'N/A',
          status: checkIn.status,
          notes: checkIn.notes || '',
        })) || [];
        
        await ExportUtils.generateAndSavePDF(
          rows, 
          fileName, 
          ['id', 'checkInTime', 'checkOutTime', 'workTime', 'breakTime', 'status', 'notes'], 
          `Timesheet - ${timesheetData.jobTitle || 'Assignment'}`
        );
      } else if (format === 'excel') {
        const rows = timesheetData.checkIns?.map((checkIn: any) => ({
          id: checkIn.id,
          checkInTime: checkIn.checkInTime,
          checkOutTime: checkIn.checkOutTime || 'In Progress',
          workTime: checkIn.workTime || 'N/A',
          breakTime: checkIn.breakTime || 'N/A',
          status: checkIn.status,
          notes: checkIn.notes || '',
        })) || [];
        
        await ExportUtils.exportToXLSXFile(rows, fileName, ['id', 'checkInTime', 'checkOutTime', 'workTime', 'breakTime', 'status', 'notes']);
      }
    } catch (error) {
      console.error(`Export timesheet to ${format.toUpperCase()} failed:`, error);
      Alert.alert('Export Failed', `Could not export timesheet to ${format.toUpperCase()}`);
    }
  };

  const openTimesheetModal = async (checkIn: any) => {
    try {
      setLoadingJobDetails(true);
      const [assignment, job] = await Promise.all([
        ApiService.getAssignmentById(checkIn.assignmentId),
        checkIn.jobId ? ApiService.getJobById(checkIn.jobId) : null,
      ]);
      
      setSelectedTimesheet({
        ...checkIn,
        assignment,
        job,
      });
      setShowTimesheetModal(true);
    } catch (error) {
      console.error('Failed to load timesheet details:', error);
      Alert.alert('Error', 'Failed to load timesheet details');
    } finally {
      setLoadingJobDetails(false);
    }
  };

  return (
    <View style={styles.container}>
      <GlobalHeader
        title="Reports"
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16 }}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.headerIconButton} onPress={() => setShowSearchBar(v => !v)}>
            <FontAwesomeIcon icon="search" size={Responsive.iconSize(16)} color="#111827" />
          </TouchableOpacity>
        }
      />

      <ScrollView ref={scrollRef} style={[styles.scrollView, { paddingHorizontal: dynamicHorizontalGutter }]} showsVerticalScrollIndicator={false}>
        {/* Report Type Tabs */}
        <View style={[styles.tabsContainer, { marginHorizontal: 0 }]}>
          <FlatList
            ref={tabsListRef}
            data={reportTypes}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.tabsInnerContent, { paddingLeft: 0, paddingRight: Spacing.lg }]}
            onScrollToIndexFailed={(e) => {
              // Fallback to approximate offset when RN can't compute index position yet
              const offset = (e.averageItemLength || 100) * e.index;
              tabsListRef.current?.scrollToOffset({ offset, animated: true });
              setTimeout(() => tabsListRef.current?.scrollToIndex({ index: e.index, animated: true }), 100);
            }}
            renderItem={({ item: type }) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.tab,
                  selectedReportType === type.key && styles.tabActive,
                ]}
                onPress={() => {
                  setSelectedReportType(type.key);
                  const idx = reportTypes.findIndex(rt => rt.key === type.key);
                  if (idx >= 0) {
                    try {
                      tabsListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0 });
                    } catch {}
                  }
                  scrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
              >
                <FontAwesomeIcon
                  icon={type.icon}
                  size={Responsive.iconSize(16)}
                  color={
                    selectedReportType === type.key
                      ? Colors.white
                      : '#1C2A3A'
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

        {showSearchBar && (
          <View style={{ marginBottom: Spacing.sm }}>
            <TextInput
              style={styles.textInput}
              placeholder="Search by title"
              value={
                selectedReportType === 'assigned' ? assignmentsFilterTitle :
                selectedReportType === 'checkin-out' ? checkinFilterTitle :
                jobsFilterTitle
              }
              onChangeText={(t) => 
                selectedReportType === 'assigned' ? setAssignmentsFilterTitle(t) :
                selectedReportType === 'checkin-out' ? setCheckinFilterTitle(t) :
                setJobsFilterTitle(t)
              }
            />
          </View>
        )}

        {/* Job Lists View */}
        {selectedReportType === 'job-lists' ? (
          <View style={styles.jobListsContainer}>
            <View style={styles.exportHeaderContainer}>
              <Text style={styles.sectionTitle}>All Jobs</Text>
              <View style={styles.headerActionsRow}>
                <TouchableOpacity
                  style={styles.exportDropdownButton}
                  onPress={() => setShowJobsExportMenu(v => !v)}
                  disabled={isGenerating || getFilteredJobs().length === 0}
                >
                  <FontAwesomeIcon icon="file-export" size={Responsive.iconSize(16)} color={Colors.white} />
                  <Text style={styles.exportDropdownText}>Export All</Text>
                  <FontAwesomeIcon icon={showJobsExportMenu ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.white} />
                </TouchableOpacity>

                {showJobsExportMenu && (
                  <View style={styles.exportDropdownMenu}>
                    <TouchableOpacity
                      style={styles.exportDropdownItem}
                      onPress={() => { setShowJobsExportMenu(false); handleExportAllJobs('pdf'); }}
                    >
                      <FontAwesomeIcon icon="file-pdf" size={14} color={Colors.error} />
                      <Text style={styles.exportDropdownItemText}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.exportDropdownItem}
                      onPress={() => { setShowJobsExportMenu(false); handleExportAllJobs('excel'); }}
                    >
                      <FontAwesomeIcon icon="file-excel" size={14} color={Colors.success} />
                      <Text style={styles.exportDropdownItemText}>Excel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.filterOutlineButton}
                  onPress={() => setShowJobsFilterModal(true)}
                >
                  <FontAwesomeIcon icon="filter" size={14} color={Colors.textPrimary} />
                  <Text style={styles.filterOutlineText}>Filter</Text>
                </TouchableOpacity>

                {/* Filter button removed as requested */}
              </View>
            </View>
            {jobs.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesomeIcon icon="briefcase" size={Responsive.iconSize(48)} color={Colors.textTertiary} />
                <Text style={styles.emptyStateText}>No jobs found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Jobs will appear here when they are created
                </Text>
              </View>
            ) : (
              <FlatList
                data={getFilteredJobs()}
                renderItem={({ item }) => {
                  const dateRange = `${formatDateShort(item.startDate)} - ${formatDateShort(item.endDate)}`;
                  const statusBg = getStatusColor(item.status || 'ACTIVE');
                  return (
                    <View style={styles.jobCardContainer}>
                      <View style={[styles.jobCard, showJobExportMenuForId === item.id && { zIndex: 2000, elevation: 16 }]}> 
                        {/* Top row date + hourly rate */}
                        <View style={styles.cardTopRow}>
                          <Text style={styles.cardTimeText}>{dateRange}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity
                              style={styles.inlineIconButton}
                              onPress={() => setShowJobExportMenuForId(prev => prev === item.id ? null : item.id)}
                              disabled={exportingJobId === item.id}
                            >
                              {exportingJobId === item.id ? (
                                <ActivityIndicator size="small" color={Colors.primary} />
                              ) : (
                                <FontAwesomeIcon icon="file-export" size={22} color={Colors.primary} />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                        <View style={styles.cardDivider} />

                        {/* Tap upper content to open details */}
                        <TouchableOpacity onPress={() => handleJobClick(item.id)} activeOpacity={0.8}>
                          {/* Profile/content row like HRJobsScreen */}
                          <View style={styles.profileRow}>
                            <View style={styles.profileContent}>
                              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                              <View style={styles.subtitleRow}>
                                {!!item.location && (
                                  <Text style={styles.subtitleText} numberOfLines={1}>{item.location}</Text>
                                )}
                                {(item.location && (item.department || item.specialization)) ? (
                                  <Text style={styles.subtitleDot}> • </Text>
                                ) : null}
                                {!!(item.department || item.specialization) && (
                                  <Text style={styles.subtitleText} numberOfLines={1}>
                                    {item.department || item.specialization}
                                  </Text>
                                )}
                                {!!(item.department || item.specialization) && !!item.status ? (
                                  <Text style={styles.subtitleDot}> • </Text>
                                ) : null}
                                {!!item.status && (
                                  <View style={[styles.inlineStatusPill, { backgroundColor: getStatusColor(item.status || 'ACTIVE') }]}> 
                                    <Text style={[styles.inlineStatusText, { color: Colors.white }]}>
                                      {formatStatusLabel(item.status || 'ACTIVE')}
                                    </Text>
                                  </View>
                                )}
                              </View>

                              {/* 2-col info row (removed Dates to avoid duplication) */}
                              <View style={styles.assignmentRow}>
                                <View style={styles.infoCol}>
                                  <Text style={styles.infoLabel}>Job ID</Text>
                                  <Text style={styles.infoValue}>{item.id}</Text>
                                </View>
                                <View style={styles.infoCol}>
                                  <Text style={styles.infoLabel}>Specialization</Text>
                                  <Text style={styles.infoValue} numberOfLines={1}>{item.specialization || '—'}</Text>
                                </View>
                                <View style={styles.infoCol}>
                                  <Text style={styles.infoLabel}>Charges</Text>
                                  <Text style={styles.infoValue} numberOfLines={1}>{(item as any)?.hourlyRate ? `₹${(item as any).hourlyRate}/hr` : '—'}</Text>
                                </View>
                              </View>

                              {/* Optional description */}
                              {!!(item as any)?.description && (
                                <Text style={styles.descriptionText} numberOfLines={2}>
                                  {(item as any).description}
                                </Text>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>

                        {/* Inline export dropdown anchor */}
                        {showJobExportMenuForId === item.id && (
                          <View style={[styles.exportDropdownMenu, { right: 8, top: 36, position: 'absolute' }]}>
                            <TouchableOpacity
                              style={styles.exportDropdownItem}
                              onPress={() => { setShowJobExportMenuForId(null); handleExportJob(item.id, 'pdf'); }}
                            >
                              <FontAwesomeIcon icon="file-pdf" size={14} color={Colors.error} />
                              <Text style={styles.exportDropdownItemText}>PDF</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.exportDropdownItem}
                              onPress={() => { setShowJobExportMenuForId(null); handleExportJob(item.id, 'excel'); }}
                            >
                              <FontAwesomeIcon icon="file-excel" size={14} color={Colors.success} />
                              <Text style={styles.exportDropdownItemText}>Excel</Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        
                      </View>
                    </View>
                  );
                }}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}
          </View>
        ) : selectedReportType === 'assigned' ? (
          <View style={styles.jobListsContainer}>
            <View style={styles.exportHeaderContainer}>
              <Text style={styles.sectionTitle}>Assigned Jobs</Text>
              <View style={styles.headerActionsRow}>
                <TouchableOpacity
                  style={styles.exportDropdownButton}
                  onPress={() => setShowAssignmentsExportMenu(v => !v)}
                  disabled={isGenerating || getFilteredAssignments().length === 0}
                >
                  <FontAwesomeIcon icon="file-export" size={Responsive.iconSize(16)} color={Colors.white} />
                  <Text style={styles.exportDropdownText}>Export All</Text>
                  <FontAwesomeIcon icon={showAssignmentsExportMenu ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.white} />
                </TouchableOpacity>

                {showAssignmentsExportMenu && (
                  <View style={styles.exportDropdownMenu}>
                    <TouchableOpacity
                      style={styles.exportDropdownItem}
                      onPress={() => { setShowAssignmentsExportMenu(false); handleExportAllAssignments('pdf'); }}
                    >
                      <FontAwesomeIcon icon="file-pdf" size={14} color={Colors.error} />
                      <Text style={styles.exportDropdownItemText}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.exportDropdownItem}
                      onPress={() => { setShowAssignmentsExportMenu(false); handleExportAllAssignments('excel'); }}
                    >
                      <FontAwesomeIcon icon="file-excel" size={14} color={Colors.success} />
                      <Text style={styles.exportDropdownItemText}>Excel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.filterOutlineButton}
                  onPress={() => setShowAssignmentsFilterModal(true)}
                >
                  <FontAwesomeIcon icon="filter" size={14} color={Colors.textPrimary} />
                  <Text style={styles.filterOutlineText}>Filter</Text>
                </TouchableOpacity>

                {/* Filter button removed as requested */}
              </View>
            </View>
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
                data={getFilteredAssignments()}
                renderItem={({ item }) => {
                  const dateRange = `${formatDateShort(item.job?.startDate)} - ${formatDateShort(item.job?.endDate)}`;
                  const statusBg = getStatusColor(item.status || 'ASSIGNED');
                  return (
                    <View style={styles.jobCardContainer}>
                      <View style={[styles.jobCard, showAssignmentExportMenuForId === item.id && { zIndex: 2000, elevation: 16 }]}> 
                        <View style={styles.cardTopRow}>
                          <Text style={styles.cardTimeText}>{dateRange}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity
                              style={styles.inlineIconButton}
                              onPress={() => setShowAssignmentExportMenuForId(prev => prev === item.id ? null : item.id)}
                              disabled={exportingAssignmentId === item.id}
                            >
                              {exportingAssignmentId === item.id ? (
                                <ActivityIndicator size="small" color={Colors.primary} />
                              ) : (
                                <FontAwesomeIcon icon="file-export" size={22} color={Colors.primary} />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                        <View style={styles.cardDivider} />

                        <TouchableOpacity onPress={() => handleAssignmentClick(item.id)} activeOpacity={0.8}>
                          <View style={styles.profileRow}>
                            <View style={styles.profileContent}>
                              <Text style={styles.cardTitle} numberOfLines={1}>{item.job?.title || `Assignment #${item.id}`}</Text>
                              <View style={styles.subtitleRow}>
                                {!!item.job?.location && (
                                  <Text style={styles.subtitleText} numberOfLines={1}>{item.job.location}</Text>
                                )}
                                {(item.job?.location && (item.job?.department || item.job?.specialization)) ? (
                                  <Text style={styles.subtitleDot}> • </Text>
                                ) : null}
                                {!!(item.job?.department || item.job?.specialization) && (
                                  <Text style={styles.subtitleText} numberOfLines={1}>
                                    {item.job?.department || item.job?.specialization}
                                  </Text>
                                )}
                                {!!(item.job?.department || item.job?.specialization) && !!item.status ? (
                                  <Text style={styles.subtitleDot}> • </Text>
                                ) : null}
                                {!!item.status && (
                                  <View style={[styles.inlineStatusPill, { backgroundColor: getStatusColor(item.status) }]}> 
                                    <Text style={[styles.inlineStatusText, { color: Colors.white }]}> {formatStatusLabel(item.status)} </Text>
                                  </View>
                                )}
                              </View>

                              <View style={styles.assignmentRow}>
                                <View style={styles.infoCol}>
                                  <Text style={styles.infoLabel}>Assignment ID</Text>
                                  <Text style={styles.infoValue}>{item.id}</Text>
                                </View>
                                <View style={styles.infoCol}>
                                  <Text style={styles.infoLabel}>Staff</Text>
                                  <Text style={styles.infoValue} numberOfLines={1}>{item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown'}</Text>
                                </View>
                                <View style={styles.infoCol}>
                                  <Text style={styles.infoLabel}>Charges</Text>
                                  <Text style={styles.infoValue} numberOfLines={1}>{item.hourlyRate ? `₹${item.hourlyRate}/hr` : '—'}</Text>
                                </View>
                              </View>

                              {item.notes ? (
                                <Text style={styles.descriptionText} numberOfLines={2}>
                                  {item.notes}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        </TouchableOpacity>

                        {showAssignmentExportMenuForId === item.id && (
                          <View style={[styles.exportDropdownMenu, { right: 8, top: 36, position: 'absolute' }]}>
                            <TouchableOpacity
                              style={styles.exportDropdownItem}
                              onPress={() => { setShowAssignmentExportMenuForId(null); handleExportAssignment(item.id, 'pdf'); }}
                            >
                              <FontAwesomeIcon icon="file-pdf" size={14} color={Colors.error} />
                              <Text style={styles.exportDropdownItemText}>PDF</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.exportDropdownItem}
                              onPress={() => { setShowAssignmentExportMenuForId(null); handleExportAssignment(item.id, 'excel'); }}
                            >
                              <FontAwesomeIcon icon="file-excel" size={14} color={Colors.success} />
                              <Text style={styles.exportDropdownItemText}>Excel</Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        
                      </View>
                    </View>
                  );
                }}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}
          </View>
        ) : selectedReportType === 'checkin-out' ? (
          <View style={styles.jobListsContainer}>
            <View style={styles.exportHeaderContainer}>
              <Text style={styles.sectionTitle}>Check-In/Out</Text>
              <View style={styles.headerActionsRow}>
                <TouchableOpacity
                  style={styles.exportDropdownButton}
                  onPress={() => setShowCheckinExportMenu(v => !v)}
                  disabled={isGenerating || getFilteredCheckIns().length === 0}
                >
                  <FontAwesomeIcon icon="file-export" size={Responsive.iconSize(16)} color={Colors.white} />
                  <Text style={styles.exportDropdownText}>Export All</Text>
                  <FontAwesomeIcon icon={showCheckinExportMenu ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.white} />
                </TouchableOpacity>

                {showCheckinExportMenu && (
                  <View style={styles.exportDropdownMenu}>
                    <TouchableOpacity
                      style={styles.exportDropdownItem}
                      onPress={() => { setShowCheckinExportMenu(false); handleExportAllCheckIns('pdf'); }}
                    >
                      <FontAwesomeIcon icon="file-pdf" size={14} color={Colors.error} />
                      <Text style={styles.exportDropdownItemText}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.exportDropdownItem}
                      onPress={() => { setShowCheckinExportMenu(false); handleExportAllCheckIns('excel'); }}
                    >
                      <FontAwesomeIcon icon="file-excel" size={14} color={Colors.success} />
                      <Text style={styles.exportDropdownItemText}>Excel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.filterOutlineButton}
                  onPress={() => setShowCheckinFilterModal(true)}
                >
                  <FontAwesomeIcon icon="filter" size={14} color={Colors.textPrimary} />
                  <Text style={styles.filterOutlineText}>Filter</Text>
                </TouchableOpacity>
              </View>
            </View>
            {loadingRealtime ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (attendanceData.length > 0 || (realtimeData?.activeStaffDetails?.length || 0) > 0) ? (
              <FlatList
                data={getFilteredCheckIns()}
                renderItem={({ item }) => {
                  const uniqueId = item.isActive ? `active-${item.userId}-${item.checkInTime}` : String(item.id);
                  return (
                    <View style={styles.jobCardContainer}>
                      <View style={[styles.jobCard, showCheckinExportMenuForId === uniqueId && { zIndex: 2000, elevation: 16 }]}> 
                        <View style={styles.cardTopRow}>
                          <Text style={styles.cardTimeText}>
                            {item.isActive 
                              ? `Checked in: ${formatDateShort(item.checkInTime)} • Elapsed ${formatElapsedMinutes(item.workTimeMinutes)}`
                              : `${formatDateShort(item.checkInTime)} - ${item.checkOutTime ? formatDateShort(item.checkOutTime) : 'In Progress'}`
                            }
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity
                              style={styles.inlineIconButton}
                              onPress={() => setShowCheckinExportMenuForId(prev => prev === uniqueId ? null : uniqueId)}
                            >
                              <FontAwesomeIcon icon="file-export" size={22} color={Colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <View style={styles.cardDivider} />

                        <TouchableOpacity onPress={() => item.isActive ? openRealtimeCheckInModalFromActive(item) : openRealtimeCheckInModal(item)} activeOpacity={0.8}>
                          <View style={styles.profileRow}>
                            <View style={styles.profileContent}>
                              <Text style={styles.cardTitle} numberOfLines={1}>
                                {item.isActive ? item.userName : (item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown')}
                              </Text>
                              <View style={styles.subtitleRow}>
                                {!!(item.isActive ? item.jobTitle : item.job?.title) && (
                                  <Text style={styles.subtitleText} numberOfLines={1}>
                                    {item.isActive ? item.jobTitle : item.job?.title}
                                  </Text>
                                )}
                                {!!(item.isActive ? item.jobTitle : item.job?.title) && !!(item.isActive ? (item.department || item.jobDepartment) : item.job?.department) && (
                                  <Text style={styles.subtitleDot}> • </Text>
                                )}
                                {!!(item.isActive ? (item.department || item.jobDepartment) : item.job?.department) && (
                                  <Text style={styles.subtitleText} numberOfLines={1}>
                                    {item.isActive ? (item.department || item.jobDepartment) : item.job?.department}
                                  </Text>
                                )}
                              </View>

                              <View style={styles.assignmentRow}>
                                <View style={styles.infoCol}>
                                  <Text style={styles.infoLabel}>Status</Text>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[styles.inlineStatusPill, { backgroundColor: getStatusColor(item.status) }]}> 
                                      <Text style={[styles.inlineStatusText, { color: Colors.white }]}>
                                        {formatStatusLabel(item.status)}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                                {!item.isActive && (
                                  <>
                                    <View style={styles.infoCol}>
                                      <Text style={styles.infoLabel}>Work Time</Text>
                                      <Text style={styles.infoValue}>{item.totalWorkTime ? `${item.totalWorkTime}m` : '—'}</Text>
                                    </View>
                                    <View style={styles.infoCol}>
                                      <Text style={styles.infoLabel}>Break Time</Text>
                                      <Text style={styles.infoValue}>{item.totalBreakTime ? `${item.totalBreakTime}m` : '—'}</Text>
                                    </View>
                                  </>
                                )}
                              </View>

                              {!item.isActive && item.notes && (
                                <Text style={styles.descriptionText} numberOfLines={2}>
                                  {item.notes}
                                </Text>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>

                        {showCheckinExportMenuForId === uniqueId && (
                          <View style={[styles.exportDropdownMenu, { right: 8, top: 36, position: 'absolute' }]}>
                            <TouchableOpacity
                              style={styles.exportDropdownItem}
                              onPress={() => { setShowCheckinExportMenuForId(null); handleExportTimesheet(item.isActive ? mapActiveToTimesheet(item) : mapCheckInToTimesheet(item), 'pdf'); }}
                            >
                              <FontAwesomeIcon icon="file-pdf" size={14} color={Colors.error} />
                              <Text style={styles.exportDropdownItemText}>PDF</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.exportDropdownItem}
                              onPress={() => { setShowCheckinExportMenuForId(null); handleExportTimesheet(item.isActive ? mapActiveToTimesheet(item) : mapCheckInToTimesheet(item), 'excel'); }}
                            >
                              <FontAwesomeIcon icon="file-excel" size={14} color={Colors.success} />
                              <Text style={styles.exportDropdownItemText}>Excel</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                }}
                keyExtractor={(item, index) => item.isActive ? `active-${index}` : String(item.id)}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <FontAwesomeIcon icon="clock" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyStateText}>No check-ins found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Check-ins will appear here when staff check in/out
                </Text>
              </View>
            )}
          </View>
        ) : selectedReportType === 'payout' ? (
          <View style={styles.jobListsContainer}>
            <View style={styles.exportHeaderContainer}>
              <Text style={styles.sectionTitle}>Payout</Text>
              <View style={styles.headerActionsRow}>
                <TouchableOpacity
                  style={styles.exportDropdownButton}
                  onPress={() => setShowPayoutExportMenu(v => !v)}
                  disabled={isGenerating || getFilteredPayoutLines().length === 0}
                >
                  <FontAwesomeIcon icon="file-export" size={Responsive.iconSize(16)} color={Colors.white} />
                  <Text style={styles.exportDropdownText}>Export All</Text>
                  <FontAwesomeIcon icon={showPayoutExportMenu ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.white} />
                </TouchableOpacity>

                {showPayoutExportMenu && (
                  <View style={styles.exportDropdownMenu}>
                    <TouchableOpacity
                      style={styles.exportDropdownItem}
                      onPress={() => { setShowPayoutExportMenu(false); handleExportPayout('pdf'); }}
                    >
                      <FontAwesomeIcon icon="file-pdf" size={14} color={Colors.error} />
                      <Text style={styles.exportDropdownItemText}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.exportDropdownItem}
                      onPress={() => { setShowPayoutExportMenu(false); handleExportPayout('excel'); }}
                    >
                      <FontAwesomeIcon icon="file-excel" size={14} color={Colors.success} />
                      <Text style={styles.exportDropdownItemText}>Excel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.filterOutlineButton}
                  onPress={() => {
                    console.log('🧮 Opening payout filter with current API filters:', payoutFilters);
                    setPayoutLocalFilters((prev) => ({
                      ...prev,
                      startDate: payoutFilters.startDate || prev.startDate,
                      endDate: payoutFilters.endDate || prev.endDate,
                      userId: (prev.userId || payoutFilters.userId || ''),
                      jobId: (prev.jobId || payoutFilters.jobId || ''),
                    }));
                    setShowPayoutFilterModal(true);
                  }}
                >
                  <FontAwesomeIcon icon="filter" size={14} color={Colors.textPrimary} />
                  <Text style={styles.filterOutlineText}>Filter</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Filters removed per request; auto-loading with default dates */}

            {/* List */}
            {loadingPayout ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : getFilteredPayoutLines().length === 0 ? (
              <View />
            ) : (
              <FlatList
                data={getFilteredPayoutLines()}
                keyExtractor={(item, idx) => String(item.assignmentId || idx)}
                renderItem={({ item, index }) => {
                  const job = item.job || {};
                  const assignment = item.assignment || {};
                  const user = item.user || {};
                  const checkIn = item.checkIn || {};
                  const payout = item.payout || item;
                  const status = assignment.status || item.approvalStatus || 'APPROVED';
                  const shiftDatesArr = Array.isArray(item.shiftDates) ? item.shiftDates : [];
                  const dates = shiftDatesArr.join(', ');
                  const dateRange = dates || (checkIn.checkInTime ? `${formatDateShort(checkIn.checkInTime)}${checkIn.checkOutTime ? ` - ${formatDateShort(checkIn.checkOutTime)}` : ''}` : '');
                  const uniqueId = assignment.id || item.assignmentId || index;
                  const onOpenDetails = () => {
                    const details = {
                      job,
                      assignment,
                      user,
                      checkIn,
                      payout,
                      flat: item,
                    };
                    setSelectedPayoutDetails(details);
                    setShowPayoutDetailModal(true);
                  };
                  return (
                    <View style={styles.jobCardContainer}>
                      <View style={[styles.jobCard, showPayoutExportMenuForId === uniqueId && { zIndex: 2000, elevation: 16 }]}>
                        {/* Top row: dates + export */}
                        <View style={styles.cardTopRow}>
                          <Text style={styles.cardTimeText}>{dateRange}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity
                              style={styles.inlineIconButton}
                              onPress={() => setShowPayoutExportMenuForId((prev) => prev === uniqueId ? null : uniqueId)}
                            >
                              <FontAwesomeIcon icon="file-export" size={22} color={Colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <View style={styles.cardDivider} />

                        {/* Main content (like other tabs) */}
                        <TouchableOpacity onPress={onOpenDetails} activeOpacity={0.8}>
                        <View style={styles.profileRow}>
                          <View style={styles.profileContent}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.staffName || `${user.firstName || ''} ${user.lastName || ''}`.trim()}</Text>
                            <View style={styles.subtitleRow}>
                              {!!(item.jobTitle || job.title) && (
                                <Text style={styles.subtitleText} numberOfLines={1}>{item.jobTitle || job.title}</Text>
                              )}
                              {!!(item.jobTitle || job.title) && !!(item.department || job.department) ? (
                                <Text style={styles.subtitleDot}> • </Text>
                              ) : null}
                              {!!(item.department || job.department) && (
                                <Text style={styles.subtitleText} numberOfLines={1}>{item.department || job.department}</Text>
                              )}
                              {!!(item.department || job.department || item.jobTitle || job.title) && !!status ? (
                                <Text style={styles.subtitleDot}> • </Text>
                              ) : null}
                              {!!status && (
                                <View style={[styles.inlineStatusPill, { backgroundColor: getStatusColor(status) }]}>
                                  <Text style={[styles.inlineStatusText, { color: Colors.white }]}>
                                    {formatStatusLabel(status)}
                                  </Text>
                                </View>
                              )}
                            </View>

                            <View style={styles.assignmentRow}>
                              <View style={styles.infoCol}>
                                <Text style={styles.infoLabel}>Required Role</Text>
                                <Text style={styles.infoValue}>{job.requiredRole || '—'}</Text>
                              </View>
                              <View style={styles.infoCol}>
                                <Text style={styles.infoLabel}>Priority</Text>
                                <Text style={styles.infoValue}>{job.priority || '—'}</Text>
                              </View>
                              <View style={styles.infoCol}>
                                <Text style={styles.infoLabel}>Worked</Text>
                                <Text style={styles.infoValue} numberOfLines={1}>{(payout.minutesWorked ?? item.minutesWorked) || 0}m ({Number((payout.hoursWorked ?? item.hoursWorked) || 0).toFixed(2)}h)</Text>
                              </View>
                            </View>

                            <View style={styles.assignmentRow}>
                              <View style={styles.infoCol}>
                                <Text style={styles.infoLabel}>Rate</Text>
                                <Text style={styles.infoValue}>₹{(payout.hourlyRate ?? item.hourlyRate) || job.hourlyRate}/hr</Text>
                              </View>
                              <View style={styles.infoCol}>
                                <Text style={styles.infoLabel}>Amount</Text>
                                <Text style={[styles.infoValue, { color: Colors.primary }]}>₹{(payout.amount ?? item.amount) || 0}</Text>
                              </View>
                              <View style={styles.infoCol}>
                                <Text style={styles.infoLabel}>Facility</Text>
                                <Text style={styles.infoValue} numberOfLines={1}>{job.facilityName || item.facilityName || job.location || item.location || '—'}</Text>
                              </View>
                            </View>

                          </View>
                        </View>
                        </TouchableOpacity>

                        {showPayoutExportMenuForId === uniqueId && (
                          <View style={[styles.exportDropdownMenu, { right: 8, top: 36, position: 'absolute' }]}>
                            <TouchableOpacity
                              style={styles.exportDropdownItem}
                              onPress={() => {
                                setShowPayoutExportMenuForId(null);
                                const exportItem = {
                                  jobId: job.id || item.jobId,
                                  jobTitle: job.title || item.jobTitle,
                                  assignmentId: assignment.id || item.assignmentId,
                                  userId: user.id || item.userId,
                                  staffName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || item.staffName,
                                  shiftDates: shiftDatesArr,
                                  minutesWorked: payout.minutesWorked ?? item.minutesWorked,
                                  hoursWorked: payout.hoursWorked ?? item.hoursWorked,
                                  hourlyRate: (payout.hourlyRate ?? item.hourlyRate) || job.hourlyRate,
                                  amount: payout.amount ?? item.amount,
                                };
                                handleExportSinglePayout(exportItem, 'pdf');
                              }}
                            >
                              <FontAwesomeIcon icon="file-pdf" size={14} color={Colors.error} />
                              <Text style={styles.exportDropdownItemText}>PDF</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.exportDropdownItem}
                              onPress={() => {
                                setShowPayoutExportMenuForId(null);
                                const exportItem = {
                                  jobId: job.id || item.jobId,
                                  jobTitle: job.title || item.jobTitle,
                                  assignmentId: assignment.id || item.assignmentId,
                                  userId: user.id || item.userId,
                                  staffName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || item.staffName,
                                  shiftDates: shiftDatesArr,
                                  minutesWorked: payout.minutesWorked ?? item.minutesWorked,
                                  hoursWorked: payout.hoursWorked ?? item.hoursWorked,
                                  hourlyRate: (payout.hourlyRate ?? item.hourlyRate) || job.hourlyRate,
                                  amount: payout.amount ?? item.amount,
                                };
                                handleExportSinglePayout(exportItem, 'excel');
                              }}
                            >
                              <FontAwesomeIcon icon="file-excel" size={14} color={Colors.success} />
                              <Text style={styles.exportDropdownItemText}>Excel</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                }}
                scrollEnabled={false}
              />
            )}

            {/* Optional totals by user */}
            {/* Totals by User card removed as requested */}
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
      {/* All Jobs Filter Bottom Sheet */}
      {showJobsFilterModal && (
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity style={styles.sheetBackdropTouchable} onPress={() => setShowJobsFilterModal(false)} />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filter Jobs</Text>
            <View style={styles.sheetDivider} />

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusChipsRow}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={`js-${option.value}`}
                    style={[styles.statusChip, jobsFilterStatus === option.value && styles.statusChipActive]}
                    onPress={() => setJobsFilterStatus(option.value)}
                  >
                    <Text style={[styles.statusChipText, jobsFilterStatus === option.value && styles.statusChipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowJobsStartPicker(true)}>
                <Text style={styles.dateButtonText} numberOfLines={1}>{jobsFilterStartDate || 'Select start date'}</Text>
                <FontAwesomeIcon icon="calendar" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowJobsEndPicker(true)}>
                <Text style={styles.dateButtonText} numberOfLines={1}>{jobsFilterEndDate || 'Select end date'}</Text>
                <FontAwesomeIcon icon="calendar" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Department</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setJobsDeptDropdownOpen(v => !v)}
              >
                <Text style={styles.dropdownButtonText} numberOfLines={1}>
                  {jobsFilterDepartment || 'Select department'}
                </Text>
                <FontAwesomeIcon icon={jobsDeptDropdownOpen ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
              {jobsDeptDropdownOpen && (
                <ScrollView style={styles.dropdownMenu} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => { setJobsFilterDepartment(''); setJobsDeptDropdownOpen(false); }}
                  >
                    <Text style={styles.dropdownItemText}>All Departments</Text>
                  </TouchableOpacity>
                  {(((departments as string[]) || []).length > 0 ? (departments as string[]) : hardcodedDepartments).map((dept) => (
                    <TouchableOpacity
                      key={`dept-${dept}`}
                      style={styles.dropdownItem}
                      onPress={() => { setJobsFilterDepartment(dept); setJobsDeptDropdownOpen(false); }}
                    >
                      <Text style={styles.dropdownItemText}>{dept}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.filterActionsRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => { setJobsFilterStatus(''); setJobsFilterStartDate(''); setJobsFilterEndDate(''); setJobsFilterDepartment(''); }}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowJobsFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>

          </View>
          {showJobsStartPicker && (
            <DateTimePicker
              value={jobsFilterStartDate ? parseDateString(jobsFilterStartDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { if (Platform.OS === 'android') setShowJobsStartPicker(false); if (d) setJobsFilterStartDate(formatDate(d)); }}
              maximumDate={jobsFilterEndDate ? parseDateString(jobsFilterEndDate) : undefined}
            />
          )}
          {showJobsEndPicker && (
            <DateTimePicker
              value={jobsFilterEndDate ? parseDateString(jobsFilterEndDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { if (Platform.OS === 'android') setShowJobsEndPicker(false); if (d) setJobsFilterEndDate(formatDate(d)); }}
              minimumDate={jobsFilterStartDate ? parseDateString(jobsFilterStartDate) : undefined}
            />
          )}
        </View>
      )}

      {/* All Assignments Filter Bottom Sheet */}
      {showAssignmentsFilterModal && (
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity style={styles.sheetBackdropTouchable} onPress={() => setShowAssignmentsFilterModal(false)} />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filter Assignments</Text>
            <View style={styles.sheetDivider} />

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusChipsRow}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={`as-${option.value}`}
                    style={[styles.statusChip, assignmentsFilterStatus === option.value && styles.statusChipActive]}
                    onPress={() => setAssignmentsFilterStatus(option.value)}
                  >
                    <Text style={[styles.statusChipText, assignmentsFilterStatus === option.value && styles.statusChipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowAssignmentsStartPicker(true)}>
                <Text style={styles.dateButtonText} numberOfLines={1}>{assignmentsFilterStartDate || 'Select start date'}</Text>
                <FontAwesomeIcon icon="calendar" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowAssignmentsEndPicker(true)}>
                <Text style={styles.dateButtonText} numberOfLines={1}>{assignmentsFilterEndDate || 'Select end date'}</Text>
                <FontAwesomeIcon icon="calendar" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Department</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setAssignmentsDeptDropdownOpen(v => !v)}
              >
                <Text style={styles.dropdownButtonText} numberOfLines={1}>
                  {assignmentsFilterDepartment || 'Select department'}
                </Text>
                <FontAwesomeIcon icon={assignmentsDeptDropdownOpen ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
              {assignmentsDeptDropdownOpen && (
                <ScrollView style={styles.dropdownMenu} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => { setAssignmentsFilterDepartment(''); setAssignmentsDeptDropdownOpen(false); }}
                  >
                    <Text style={styles.dropdownItemText}>All Departments</Text>
                  </TouchableOpacity>
                  {(((departments as string[]) || []).length > 0 ? (departments as string[]) : hardcodedDepartments).map((dept) => (
                    <TouchableOpacity
                      key={`adept-${dept}`}
                      style={styles.dropdownItem}
                      onPress={() => { setAssignmentsFilterDepartment(dept); setAssignmentsDeptDropdownOpen(false); }}
                    >
                      <Text style={styles.dropdownItemText}>{dept}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.filterActionsRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => { setAssignmentsFilterStatus(''); setAssignmentsFilterStartDate(''); setAssignmentsFilterEndDate(''); setAssignmentsFilterDepartment(''); }}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowAssignmentsFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>

          </View>
          {showAssignmentsStartPicker && (
            <DateTimePicker
              value={assignmentsFilterStartDate ? parseDateString(assignmentsFilterStartDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { if (Platform.OS === 'android') setShowAssignmentsStartPicker(false); if (d) setAssignmentsFilterStartDate(formatDate(d)); }}
              maximumDate={assignmentsFilterEndDate ? parseDateString(assignmentsFilterEndDate) : undefined}
            />
          )}
          {showAssignmentsEndPicker && (
            <DateTimePicker
              value={assignmentsFilterEndDate ? parseDateString(assignmentsFilterEndDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { if (Platform.OS === 'android') setShowAssignmentsEndPicker(false); if (d) setAssignmentsFilterEndDate(formatDate(d)); }}
              minimumDate={assignmentsFilterStartDate ? parseDateString(assignmentsFilterStartDate) : undefined}
            />
          )}
        </View>
      )}

      {/* All Check-In/Out Filter Bottom Sheet */}
      {showCheckinFilterModal && (
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity style={styles.sheetBackdropTouchable} onPress={() => setShowCheckinFilterModal(false)} />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filter Check-Ins</Text>
            <View style={styles.sheetDivider} />

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusChipsRow}>
                <TouchableOpacity
                  style={[styles.statusChip, checkinFilterStatus === '' && styles.statusChipActive]}
                  onPress={() => setCheckinFilterStatus('')}
                >
                  <Text style={[styles.statusChipText, checkinFilterStatus === '' && styles.statusChipTextActive]}>All Status</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusChip, checkinFilterStatus === 'CHECKED_IN' && styles.statusChipActive]}
                  onPress={() => setCheckinFilterStatus('CHECKED_IN')}
                >
                  <Text style={[styles.statusChipText, checkinFilterStatus === 'CHECKED_IN' && styles.statusChipTextActive]}>Checked In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusChip, checkinFilterStatus === 'CHECKED_OUT' && styles.statusChipActive]}
                  onPress={() => setCheckinFilterStatus('CHECKED_OUT')}
                >
                  <Text style={[styles.statusChipText, checkinFilterStatus === 'CHECKED_OUT' && styles.statusChipTextActive]}>Checked Out</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowCheckinStartPicker(true)}>
                <Text style={styles.dateButtonText} numberOfLines={1}>{checkinFilterStartDate || 'Select start date'}</Text>
                <FontAwesomeIcon icon="calendar" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowCheckinEndPicker(true)}>
                <Text style={styles.dateButtonText} numberOfLines={1}>{checkinFilterEndDate || 'Select end date'}</Text>
                <FontAwesomeIcon icon="calendar" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Department</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setCheckinDeptDropdownOpen(v => !v)}
              >
                <Text style={styles.dropdownButtonText} numberOfLines={1}>
                  {checkinFilterDepartment || 'Select department'}
                </Text>
                <FontAwesomeIcon icon={checkinDeptDropdownOpen ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
              {checkinDeptDropdownOpen && (
                <ScrollView style={styles.dropdownMenu} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => { setCheckinFilterDepartment(''); setCheckinDeptDropdownOpen(false); }}
                  >
                    <Text style={styles.dropdownItemText}>All Departments</Text>
                  </TouchableOpacity>
                  {(((departments as string[]) || []).length > 0 ? (departments as string[]) : hardcodedDepartments).map((dept) => (
                    <TouchableOpacity
                      key={`checkin-dept-${dept}`}
                      style={styles.dropdownItem}
                      onPress={() => { setCheckinFilterDepartment(dept); setCheckinDeptDropdownOpen(false); }}
                    >
                      <Text style={styles.dropdownItemText}>{dept}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.filterActionsRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => { setCheckinFilterStatus(''); setCheckinFilterStartDate(''); setCheckinFilterEndDate(''); setCheckinFilterDepartment(''); }}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowCheckinFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>

          </View>
          {showCheckinStartPicker && (
            <DateTimePicker
              value={checkinFilterStartDate ? parseDateString(checkinFilterStartDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { if (Platform.OS === 'android') setShowCheckinStartPicker(false); if (d) setCheckinFilterStartDate(formatDate(d)); }}
              maximumDate={checkinFilterEndDate ? parseDateString(checkinFilterEndDate) : undefined}
            />
          )}
          {showCheckinEndPicker && (
            <DateTimePicker
              value={checkinFilterEndDate ? parseDateString(checkinFilterEndDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { if (Platform.OS === 'android') setShowCheckinEndPicker(false); if (d) setCheckinFilterEndDate(formatDate(d)); }}
              minimumDate={checkinFilterStartDate ? parseDateString(checkinFilterStartDate) : undefined}
            />
          )}
        </View>
      )}

      {/* Payout Filter Bottom Sheet */}
      {showPayoutFilterModal && (
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity style={styles.sheetBackdropTouchable} onPress={() => setShowPayoutFilterModal(false)} />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filter Payout</Text>
            <View style={styles.sheetDivider} />

            <View style={styles.dateContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowPayoutLocalStartPicker(true)}>
                  <Text style={styles.dateButtonText} numberOfLines={1}>{payoutLocalFilters.startDate || 'Start Date'}</Text>
                  <View style={styles.startDateButtonIcon}>
                    <FontAwesomeIcon icon="calendar" size={16} color={Colors.textPrimary} />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.inputLabel}>End Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowPayoutLocalEndPicker(true)}>
                  <Text style={styles.dateButtonText} numberOfLines={1}>{payoutLocalFilters.endDate || 'End Date'}</Text>
                  <View style={styles.dateButtonIcon}>
                    <FontAwesomeIcon icon="calendar" size={16} color={Colors.textPrimary} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {showPayoutLocalStartPicker && (
              <DateTimePicker
                value={payoutLocalFilters.startDate ? parseDateString(payoutLocalFilters.startDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, d) => { if (Platform.OS === 'android') setShowPayoutLocalStartPicker(false); if (d) setPayoutLocalFilters({ ...payoutLocalFilters, startDate: formatDate(d) }); }}
                maximumDate={payoutLocalFilters.endDate ? parseDateString(payoutLocalFilters.endDate) : undefined}
              />
            )}
            {showPayoutLocalEndPicker && (
              <DateTimePicker
                value={payoutLocalFilters.endDate ? parseDateString(payoutLocalFilters.endDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, d) => { if (Platform.OS === 'android') setShowPayoutLocalEndPicker(false); if (d) setPayoutLocalFilters({ ...payoutLocalFilters, endDate: formatDate(d) }); }}
                minimumDate={payoutLocalFilters.startDate ? parseDateString(payoutLocalFilters.startDate) : undefined}
              />
            )}

            <View style={styles.filterActionsRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setPayoutLocalFilters({ search: '', startDate: '', endDate: '', userId: '', jobId: '', minAmount: '', maxAmount: '' })}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  console.log('🧮 Applying payout filters (local → API):', payoutLocalFilters);
                  setPayoutFilters((prev) => ({
                    ...prev,
                    startDate: payoutLocalFilters.startDate || prev.startDate,
                    endDate: payoutLocalFilters.endDate || prev.endDate,
                    userId: payoutLocalFilters.userId || prev.userId,
                    jobId: payoutLocalFilters.jobId || prev.jobId,
                  }));
                  setShowPayoutFilterModal(false);
                }}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Job Selector Modal */}
      {showJobSelector && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { width: Math.min(windowWidth * 0.9, 560) }]}>
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
          <View style={[styles.jobDetailModalContainer, { width: '100%' }]}>
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
                    <View style={styles.jobDetailValueChip}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(selectedJobDetails.status) }
                      ]}>
                        <Text style={styles.statusText}>{selectedJobDetails.status}</Text>
                      </View>
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
                          <View style={styles.jobDetailValueChip}>
                            <View style={[
                              styles.statusBadge,
                              { backgroundColor: getStatusColor(assignment.status) }
                            ]}>
                              <Text style={styles.statusText}>{assignment.status}</Text>
                            </View>
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
                                  <View style={styles.jobDetailValueChip}>
                                    <View style={[
                                      styles.statusBadge,
                                      { backgroundColor: getStatusColor(checkIn.status) }
                                    ]}>
                                      <Text style={styles.statusText}>{formatStatusLabel(checkIn.status)}</Text>
                                    </View>
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
          <View style={[styles.jobDetailModalContainer, { width: '100%' }]}>
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
                    <View style={styles.jobDetailValueChip}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(selectedAssignmentDetails.status) }
                      ]}>
                        <Text style={styles.statusText}>{selectedAssignmentDetails.status}</Text>
                      </View>
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
                          <View style={styles.jobDetailValueChip}>
                            <View style={[
                              styles.statusBadge,
                              { backgroundColor: getStatusColor(checkIn.status) }
                            ]}>
                              <Text style={styles.statusText}>{formatStatusLabel(checkIn.status)}</Text>
                            </View>
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

      {/* Timesheet Detail Modal */}
      {showTimesheetModal && (
        <View style={styles.jobDetailModalOverlay}>
          <View style={[styles.jobDetailModalContainer, { width: '100%' }]}>
            <View style={styles.jobDetailModalHeader}>
              <Text style={styles.jobDetailModalTitle}>Timesheet Details</Text>
              <TouchableOpacity
                style={styles.jobDetailModalCloseButton}
                onPress={() => setShowTimesheetModal(false)}
              >
                <FontAwesomeIcon icon="times" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {loadingJobDetails ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading timesheet details...</Text>
              </View>
            ) : selectedTimesheet ? (
              <ScrollView style={styles.jobDetailModalContent}>
                {/* Assignment Info */}
                <View style={styles.jobDetailSection}>
                  <Text style={styles.jobDetailSectionTitle}>Assignment Information</Text>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Assignment ID:</Text>
                    <Text style={styles.jobDetailValue}>{selectedTimesheet.assignmentId || selectedTimesheet.id}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Job Title:</Text>
                    <Text style={styles.jobDetailValue}>{selectedTimesheet.job?.title || selectedTimesheet.jobTitle || 'N/A'}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Department:</Text>
                    <Text style={styles.jobDetailValue}>{selectedTimesheet.job?.department || selectedTimesheet.department || 'N/A'}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Facility:</Text>
                    <Text style={styles.jobDetailValue}>{selectedTimesheet.job?.location || selectedTimesheet.location || 'N/A'}</Text>
                  </View>
                </View>

                {/* User Info */}
                <View style={styles.jobDetailSection}>
                  <Text style={styles.jobDetailSectionTitle}>Staff Information</Text>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Name:</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedTimesheet.user?.firstName} {selectedTimesheet.user?.lastName}
                    </Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Role:</Text>
                    <Text style={styles.jobDetailValue}>{selectedTimesheet.user?.role || 'N/A'}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Department:</Text>
                    <Text style={styles.jobDetailValue}>{selectedTimesheet.user?.department || 'N/A'}</Text>
                  </View>
                </View>

                {/* Shift Schedule */}
                {selectedTimesheet.job && (
                  <View style={styles.jobDetailSection}>
                    <Text style={styles.jobDetailSectionTitle}>Shift Schedule</Text>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Expected Start:</Text>
                      <Text style={styles.jobDetailValue}>
                        {new Date(selectedTimesheet.job.startDate).toLocaleDateString()} at {selectedTimesheet.job.startTime}
                      </Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Expected End:</Text>
                      <Text style={styles.jobDetailValue}>
                        {new Date(selectedTimesheet.job.endDate).toLocaleDateString()} at {selectedTimesheet.job.endTime}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Check-In Timeline */}
                <View style={styles.jobDetailSection}>
                  <Text style={styles.jobDetailSectionTitle}>Check-In Timeline</Text>
                  {selectedTimesheet.checkIns?.length > 0 ? (
                    selectedTimesheet.checkIns.map((checkIn: any, index: number) => (
                      <View key={checkIn.id || index} style={styles.timelineItem}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineTime}>
                            {new Date(checkIn.checkInTime).toLocaleString()}
                            {checkIn.checkOutTime && ` → ${new Date(checkIn.checkOutTime).toLocaleString()}`}
                          </Text>
                          {checkIn.status ? (
                            <Text style={styles.timelineStatus}>Status: {checkIn.status}</Text>
                          ) : null}
                          {checkIn.workTime && (
                            <Text style={styles.timelineWork}>Work Time: {checkIn.workTime}</Text>
                          )}
                          {checkIn.breakTime && (
                            <Text style={styles.timelineBreak}>Break Time: {checkIn.breakTime}</Text>
                          )}
                          {checkIn.notes && (
                            <Text style={styles.timelineNotes}>Notes: {checkIn.notes}</Text>
                          )}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyStateText}>No check-ins recorded</Text>
                  )}
                </View>

                {/* Summary Totals */}
                <View style={styles.jobDetailSection}>
                  <Text style={styles.jobDetailSectionTitle}>Summary</Text>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Total Work Time:</Text>
                    <Text style={styles.jobDetailValue}>{selectedTimesheet.totalWorkTime || 'N/A'}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Total Break Time:</Text>
                    <Text style={styles.jobDetailValue}>{selectedTimesheet.totalBreakTime || 'N/A'}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Late Minutes:</Text>
                    <Text style={styles.jobDetailValue}>{selectedTimesheet.lateMinutes || '0'}</Text>
                  </View>
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Early Checkout Minutes:</Text>
                    <Text style={styles.jobDetailValue}>{selectedTimesheet.earlyCheckoutMinutes || '0'}</Text>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.emptyStateText}>No timesheet data available</Text>
            )}
          </View>
        </View>
      )}

      {/* Payout Detail Modal */}
      {showPayoutDetailModal && (
        <View style={styles.jobDetailModalOverlay}>
          <View style={[styles.jobDetailModalContainer, { width: '100%' }]}>
            <View style={styles.jobDetailModalHeader}>
              <Text style={styles.jobDetailModalTitle}>Payout Details</Text>
              <TouchableOpacity
                style={styles.jobDetailModalCloseButton}
                onPress={() => setShowPayoutDetailModal(false)}
              >
                <FontAwesomeIcon icon="times" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.jobDetailModalContent}>
              {/* Staff */}
              <View style={styles.jobDetailSection}>
                <Text style={styles.jobDetailSectionTitle}>Staff</Text>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Name:</Text>
                  <Text style={styles.jobDetailValue}>
                    {(selectedPayoutDetails?.flat?.staffName) ||
                      `${selectedPayoutDetails?.user?.firstName || ''} ${selectedPayoutDetails?.user?.lastName || ''}`.trim() || '—'}
                  </Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Role:</Text>
                  <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.user?.role || selectedPayoutDetails?.job?.requiredRole || '—'}</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Department:</Text>
                  <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.user?.department || selectedPayoutDetails?.job?.department || '—'}</Text>
                </View>
              </View>

              {/* Job */}
              <View style={styles.jobDetailSection}>
                <Text style={styles.jobDetailSectionTitle}>Job</Text>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Title:</Text>
                  <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.job?.title || selectedPayoutDetails?.flat?.jobTitle || '—'}</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Priority:</Text>
                  <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.job?.priority || '—'}</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Facility:</Text>
                  <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.job?.facilityName || selectedPayoutDetails?.flat?.facilityName || '—'}</Text>
                </View>
                {!!selectedPayoutDetails?.job?.facilityAddress && (
                  <>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Address:</Text>
                      <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.job?.facilityAddress?.street}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>City:</Text>
                      <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.job?.facilityAddress?.city}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>State:</Text>
                      <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.job?.facilityAddress?.state}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>Country:</Text>
                      <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.job?.facilityAddress?.country}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <Text style={styles.jobDetailLabel}>ZIP Code:</Text>
                      <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.job?.facilityAddress?.zipCode}</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Assignment */}
              <View style={styles.jobDetailSection}>
                <Text style={styles.jobDetailSectionTitle}>Assignment</Text>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Status:</Text>
                  <View style={styles.jobDetailValueChip}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPayoutDetails?.assignment?.status || 'ASSIGNED') }]}>
                      <Text style={styles.statusText}>{formatStatusLabel(selectedPayoutDetails?.assignment?.status || 'ASSIGNED')}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Accepted At:</Text>
                  <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.assignment?.acceptedAt ? new Date(selectedPayoutDetails.assignment.acceptedAt).toLocaleString() : 'N/A'}</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Completed At:</Text>
                  <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.assignment?.completedAt ? new Date(selectedPayoutDetails.assignment.completedAt).toLocaleString() : 'N/A'}</Text>
                </View>
              </View>

              {/* Check-In */}
              <View style={styles.jobDetailSection}>
                <Text style={styles.jobDetailSectionTitle}>Check-In</Text>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Check-in Time:</Text>
                  <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.checkIn?.checkInTime ? new Date(selectedPayoutDetails.checkIn.checkInTime).toLocaleString() : '—'}</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Check-out Time:</Text>
                  <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.checkIn?.checkOutTime ? new Date(selectedPayoutDetails.checkIn.checkOutTime).toLocaleString() : '—'}</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Status:</Text>
                  <View style={styles.jobDetailValueChip}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPayoutDetails?.checkIn?.status || 'CHECKED_IN') }]}>
                      <Text style={styles.statusText}>{formatStatusLabel(selectedPayoutDetails?.checkIn?.status || 'CHECKED_IN')}</Text>
                    </View>
                  </View>
                </View>
                {!!selectedPayoutDetails?.checkIn?.notes && (
                  <View style={styles.jobDetailRow}>
                    <Text style={styles.jobDetailLabel}>Notes:</Text>
                    <Text style={styles.jobDetailValue}>{selectedPayoutDetails?.checkIn?.notes}</Text>
                  </View>
                )}
              </View>

              {/* Payout */}
              <View style={styles.jobDetailSection}>
                <Text style={styles.jobDetailSectionTitle}>Payout</Text>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Worked:</Text>
                  <Text style={styles.jobDetailValue}>{(selectedPayoutDetails?.payout?.minutesWorked ?? selectedPayoutDetails?.flat?.minutesWorked) || 0} minutes ({Number((selectedPayoutDetails?.payout?.hoursWorked ?? selectedPayoutDetails?.flat?.hoursWorked) || 0).toFixed(2)} hours)</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Rate:</Text>
                  <Text style={styles.jobDetailValue}>₹{(selectedPayoutDetails?.payout?.hourlyRate ?? selectedPayoutDetails?.flat?.hourlyRate) || selectedPayoutDetails?.job?.hourlyRate || 0}/hr</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Text style={styles.jobDetailLabel}>Amount:</Text>
                  <Text style={styles.jobDetailValue}>₹{(selectedPayoutDetails?.payout?.amount ?? selectedPayoutDetails?.flat?.amount) || 0}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

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
    paddingHorizontal: horizontalGutter,
    backgroundColor: Colors.background,
  },
  filterButton: {
    padding: Spacing.sm,
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
  tabsContainer: {
    backgroundColor: Colors.background,
    marginVertical: Spacing.md,
    // Keep tabs aligned with main content gutter
    marginHorizontal: 0,
  },
  tabsInnerContent: {
    // Align with the ScrollView's horizontal padding so first pill starts at the same left as content
    paddingLeft: 0,
    paddingRight: Spacing.xs, // small right inset so last pill doesn't clip when scrolled to end
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#1C2A3A',
    borderRadius: 999,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: '#1C2A3A',
    borderColor: '#1C2A3A',
  },
  tabText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: '#1C2A3A',
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
  // Generic small spacing around inputs
  inputGroup: {
    marginBottom: Spacing.md,
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
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 0,
    flex: 1,
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
  // Generic filter modal container for simple forms
  filterModal: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    width: width * 0.9,
    maxHeight: '80%',
    ...Shadow.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
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
    flex: 1,
  },
  // Title text inside simple filter modal
  filterTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
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
    marginTop: 0,
    marginBottom: Spacing['2xl'],
  },
  jobCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
    overflow: 'visible',
  },
  // HRJobsScreen-style card structure
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
    backgroundColor: Colors.border,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
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
  inlineIconButton: {
    marginLeft: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
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
  descriptionText: {
    marginTop: 8,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  jobCardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  jobMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  jobMetaText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  jobMetaValue: {
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
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
    alignSelf: 'flex-start',
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
    flex: 1,
  },
  jobDetailModalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
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
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  jobDetailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    flexShrink: 0,
    flexBasis: '40%',
    maxWidth: '45%',
    paddingRight: Spacing.sm,
  },
  jobDetailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flexGrow: 1,
    flexBasis: '55%',
    maxWidth: '55%',
    textAlign: 'left',
    flexWrap: 'wrap',
    lineHeight: 20,
  },
  jobDetailValueChip: {
    flexGrow: 1,
    flexBasis: '55%',
    maxWidth: '55%',
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  // Registration-style segmented tabs for Check-In/Out sub-tabs
  checkinSegment: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    marginTop: -Spacing.xs,
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xs,
  },
  checkinSegmentTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'transparent',
    minHeight: 40,
  },
  checkinSegmentTabActive: {
    backgroundColor: Colors.textPrimary,
  },
  checkinSegmentText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  checkinSegmentTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
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
  jobCardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  jobCardTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobCardExportButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  jobCardExportButtonsInside: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    justifyContent: 'flex-end',
  },
  cardExportBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  cardExportIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.white,
    resizeMode: 'contain',
  },
  exportHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  exportDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    height: 32,
    gap: Spacing.xs,
  },
  exportDropdownText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  exportDropdownMenu: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
    zIndex: 1000,
    elevation: 12,
  },
  exportDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.sm,
    minWidth: 140,
  },
  exportDropdownItemText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  grandTotalText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  globalExportButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    flexShrink: 0,
  },
  exportButtonSmall: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 32,
  },
  exportIconImage: {
    width: 16,
    height: 16,
    marginRight: Spacing.xs,
    tintColor: Colors.white,
    resizeMode: 'contain',
  },
  exportButtonTextSmall: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
  pdfButton: {
    backgroundColor: Colors.primary,
  },
  excelButton: {
    backgroundColor: Colors.success,
  },
  filterOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    height: 32,
    gap: Spacing.xs,
  },
  filterOutlineText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  // Chips for status selection in filters
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  statusChipActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  statusChipText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  statusChipTextActive: {
    color: Colors.primary,
  },
  // Modal footer actions
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  modalButton: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  modalButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  // Bottom sheet styles (reuse semantics similar to HRJobs)
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  sheetBackdropTouchable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['2xl'],
    maxHeight: '85%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  sheetTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    minHeight: 48,
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  dropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    maxHeight: 220,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  filterActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  clearButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
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
  
  // Check-In/Out styles
  summaryContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryNumber: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterSeparator: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.sm,
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  checkInName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  checkInJob: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  checkInLocation: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  checkInTime: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  checkInElapsed: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  checkInNotes: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  checkInActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
  },
  
  // Timesheet modal styles
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginRight: Spacing.sm,
    marginTop: Spacing.xs,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  timelineStatus: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  timelineWork: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  timelineBreak: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.warning,
    marginBottom: Spacing.xs,
  },
  timelineNotes: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  exportActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
  },
  exportActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    flex: 0.45,
    justifyContent: 'center',
  },
  exportActionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.xs,
  },
});

export default ReportsScreen;
