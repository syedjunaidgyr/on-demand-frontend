import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, CommonActions, useNavigationContainerRef } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';

import { Colors } from '../../constants/colors';
import LinearGradient from 'react-native-linear-gradient';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { JobAssignment, User } from '../../types';
import ApiService from '../../services/api';
import LocationService, { LocationData } from '../../services/locationService';
import LocationValidationModal from '../../components/LocationValidationModal';
import Responsive from '../../utils/responsive';
 

type CheckInOutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CheckInOut'>;
type CheckInOutScreenRouteProp = RouteProp<RootStackParamList, 'CheckInOut'>;

const CheckInOutScreen: React.FC = () => {
  const navigation = useNavigation<CheckInOutScreenNavigationProp>();
  const route = useRoute<CheckInOutScreenRouteProp>();
  const [confirmedAssignments, setConfirmedAssignments] = useState<JobAssignment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<JobAssignment | null>(null);
  const [actionType, setActionType] = useState<'checkin' | 'checkout' | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingLocationAction, setPendingLocationAction] = useState<{
    type: 'manual' | 'qr';
    assignmentId: string;
    action: 'checkin' | 'checkout';
    qrData?: string;
  } | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityDescription, setActivityDescription] = useState('');
  const [activityAssignmentId, setActivityAssignmentId] = useState<string | null>(null);
  const [showActivitiesListModal, setShowActivitiesListModal] = useState(false);
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [fabDisabled, setFabDisabled] = useState(false);
  const prevHasCheckoutRef = React.useRef<boolean>(false);

  

  useEffect(() => {
    loadConfirmedAssignments();
  }, []);

  // Refresh assignments whenever the screen gains focus (e.g., after HR approves)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadConfirmedAssignments();
    });
    return unsubscribe;
  }, [navigation]);

  // Poll every 30s while any approval is pending
  useEffect(() => {
    const hasPending = confirmedAssignments.some(a => a.isApprovalPending);
    if (!hasPending) return;
    const id = setInterval(() => {
      loadConfirmedAssignments();
    }, 30000);
    return () => clearInterval(id);
  }, [confirmedAssignments]);

  // Update native header based on role
  useEffect(() => {
    const roleConfig = getRoleConfig();
    navigation.setOptions({
      title: roleConfig.title,
      headerStyle: { backgroundColor: roleConfig.color },
      headerTintColor: Colors.white,
    });
  }, [user]);

  // Handle scanned QR data when returning from QR scanner
  useEffect(() => {
    if (route.params && route.params.scannedQRData && route.params.scannedAction && route.params.assignmentId) {
      const { scannedQRData, scannedAction, assignmentId } = route.params;
      handleQRCodeScanned(scannedQRData, assignmentId, scannedAction);
    }
  }, [route.params]);

  const loadConfirmedAssignments = async () => {
    try {
      // Load user profile first to determine role
      const userData = await ApiService.getProfile();
      setUser(userData);

      // Load assignments for the user
      const assignmentsData = await ApiService.getMyAssignments();

      // Filter for assignments that can be checked in/out (ASSIGNED, ACCEPTED, or IN_PROGRESS)
      console.log('🔍 All assignments:', assignmentsData.data);
      console.log('📊 Assignment statuses:', assignmentsData.data.map(a => ({ id: a.id, status: a.status })));
      const confirmed = assignmentsData.data.filter(assignment => 
        (assignment.status as any) === 'ASSIGNED' || assignment.status === 'ACCEPTED' || assignment.status === 'IN_PROGRESS'
      );
      console.log('✅ Confirmed assignments (ASSIGNED, ACCEPTED, or IN_PROGRESS):', confirmed);

      // ✅ Add check-in status to each assignment (derive from approval only)
      const assignmentsWithCheckInStatus = await Promise.all(
        confirmed.map(async (assignment) => {
          try {
            const checkInStatus = await ApiService.getCheckInStatus(assignment.id);
            console.log('🔍 Check-in status for assignment', assignment.id, ':', checkInStatus);
            
            // If there's no check-in record (no checkInId), treat as not checked in and not pending
            if (!checkInStatus.checkInId) {
              console.log('✅ No check-in record found for assignment', assignment.id, '- treating as not checked in');
              return {
                ...assignment,
                isCheckedIn: false,
                checkInId: null,
                approvalStatus: undefined,
                approvedBy: undefined,
                approvedAt: undefined,
                rejectionReason: undefined,
                isApprovalPending: false
              };
            }
            
            // Only normalize approval status if we have a check-in record
            const normalizedApproval = typeof checkInStatus.approvalStatus === 'string'
              ? ((() => {
                  const val = (checkInStatus.approvalStatus as string).toLowerCase();
                  return (val === 'pending' || val === 'approved' || val === 'rejected') ? (val as 'pending' | 'approved' | 'rejected') : undefined;
                })())
              : undefined;
            const isApproved = normalizedApproval === 'approved';
            return {
              ...assignment,
              isCheckedIn: isApproved,
              checkInId: checkInStatus.checkInId,
              approvalStatus: normalizedApproval,
              approvedBy: checkInStatus.approvedBy,
              approvedAt: checkInStatus.approvedAt,
              rejectionReason: checkInStatus.rejectionReason,
              isApprovalPending: normalizedApproval === 'pending' && !!checkInStatus.checkInId
            };
          } catch (error) {
            console.error('Error loading check-in status for assignment', assignment.id, ':', error);
            return {
              ...assignment,
              isCheckedIn: false,
              checkInId: null,
              approvalStatus: undefined,
              approvedBy: undefined,
              approvedAt: undefined,
              rejectionReason: undefined,
              isApprovalPending: false
            };
          }
        })
      );

      setConfirmedAssignments(assignmentsWithCheckInStatus);
    } catch (error) {
      console.error('Failed to load confirmed assignments:', error);
      Alert.alert('Error', 'Failed to load confirmed assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConfirmedAssignments();
    setRefreshing(false);
  };

  const filteredAssignments = useMemo(() => confirmedAssignments, [confirmedAssignments]);

  // Disable FAB after a checkout completes: detect transition from having checkout eligibility to none
  useEffect(() => {
    const hasCheckoutNow = confirmedAssignments.some(a => a.isCheckedIn === true && String(a.approvalStatus || '').toLowerCase() === 'approved');
    if (prevHasCheckoutRef.current && !hasCheckoutNow) {
      setFabDisabled(true);
    }
    prevHasCheckoutRef.current = hasCheckoutNow;
  }, [confirmedAssignments]);

  const handleCheckIn = async (assignment: JobAssignment) => {
    // Gate: prevent duplicate or pending flows
    if (assignment.isApprovalPending) {
      Alert.alert('Awaiting Approval', 'Your previous check-in is pending HR/Admin approval. You cannot check in again yet.');
      return;
    }
    if (assignment.approvalStatus === 'rejected') {
      Alert.alert('Check-In Rejected', assignment.rejectionReason || 'Your last check-in was rejected.');
      return;
    }
    setCurrentAssignment(assignment);
    setActionType('checkin');
    setShowActionSheet(true);
  };

  const handleManualCheckIn = async () => {
    if (!currentAssignment) return;
    
    console.log('🔧 handleManualCheckIn called');
    console.log('📍 Current assignment:', currentAssignment.id);
    
    // Set up pending action and show location modal
    setPendingLocationAction({
      type: 'manual',
      assignmentId: currentAssignment.id,
      action: 'checkin'
    });
    setShowLocationModal(true);
    setShowActionSheet(false);
  };

  const processManualCheckIn = async (location: LocationData) => {
    if (!currentAssignment) return;
    
    console.log('🔧 processManualCheckIn called with location:', location);
    console.log('📍 Input latitude:', location.latitude);
    console.log('📍 Input longitude:', location.longitude);
    console.log('📍 Input accuracy:', location.accuracy);
    console.log('📍 Input timestamp:', location.timestamp);
    
    setIsProcessing(true);
    try {
      // Get address from coordinates
      const locationService = LocationService.getInstance();
      const address = await locationService.getAddressFromCoordinates(
        location.latitude, 
        location.longitude
      );

      const checkInData = {
        jobAssignmentId: currentAssignment.id,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: address
        },
        notes: `Manual check-in | GPS: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} | Accuracy: ${Math.round(location.accuracy)}m | Time: ${new Date().toISOString()}`,
      };

      console.log('🔧 Check-in data being sent:', checkInData);
      console.log('📍 Location data:', checkInData.location);
      console.log('📍 Latitude:', location.latitude);
      console.log('📍 Longitude:', location.longitude);

      // ✅ Use the unified endpoint
      const response = await ApiService.checkIn(checkInData.jobAssignmentId, checkInData.location, checkInData.notes);
      
      // ✅ Handle the new response format with jobContext and userInfo
      console.log('Check-in response:', response);
      console.log('Job context:', response.jobContext);
      console.log('User info:', response.userInfo);
      
      const approval = (typeof response?.approvalStatus === 'string'
        ? ((() => {
            const val = (response.approvalStatus as string).toLowerCase();
            return (val === 'pending' || val === 'approved' || val === 'rejected') ? (val as 'pending' | 'approved' | 'rejected') : undefined;
          })())
        : undefined) || 'pending';
      const facilityName = response.jobContext?.facilityName || 'the facility';
      const userName = response.userInfo ? `${response.userInfo.firstName} ${response.userInfo.lastName}` : 'User';

      if (approval === 'approved') {
        Alert.alert(
          'Check-In Successful! ✅', 
          `${userName} successfully checked in at ${facilityName}!\n\nLocation verified: ${address}\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\nAccuracy: ${Math.round(location.accuracy)}m`,
          [
            {
              text: 'Add Activity',
              onPress: () => {
                setActivityAssignmentId(currentAssignment.id);
                setActivityDescription('');
                setShowActivityModal(true);
              }
            },
            { text: 'Skip', style: 'cancel' }
          ]
        );
      } else if (approval === 'rejected') {
        Alert.alert('Check-In Rejected', response?.rejectionReason || 'Your check-in was rejected.');
      } else {
        // Check-in submitted but pending approval - still allow activity entry
        Alert.alert(
          'Check-In Submitted', 
          'Check-in submitted. Awaiting HR/Admin approval.\n\nYou can log activities now.',
          [
            {
              text: 'Add Activity',
              onPress: () => {
                setActivityAssignmentId(currentAssignment.id);
                setActivityDescription('');
                setShowActivityModal(true);
              }
            },
            { text: 'Skip', style: 'cancel' }
          ]
        );
      }

      // ✅ Update assignment with approval status (do NOT mark in-progress until approved)
      const updatedAssignments = confirmedAssignments.map(assignment => 
        assignment.id === currentAssignment.id 
          ? { 
              ...assignment, 
              status: approval === 'approved' ? ('IN_PROGRESS' as const) : assignment.status, 
              isCheckedIn: approval === 'approved',
              approvalStatus: approval,
              isApprovalPending: approval === 'pending',
              rejectionReason: response?.rejectionReason,
              checkedInBy: response.userInfo,
              jobContext: response.jobContext
            }
          : assignment
      );
      setConfirmedAssignments(updatedAssignments);
      
      setShowActionSheet(false);
    } catch (error) {
      console.error('Check-in error:', error);
      Alert.alert('Error', (error as any)?.message || 'Failed to check in. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateQRCode = async () => {
    if (!currentAssignment || !actionType) return;
    
    setIsProcessing(true);
    try {
      // Get current location directly
      const locationService = LocationService.getInstance();
      const hasPermission = await locationService.requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Location Permission Required', 'Please enable location access to generate QR code with location data.');
        return;
      }

      const location = await locationService.getCurrentLocationWithRetry(3);
      
      // Navigate to QR code display with location data
      (navigation as any).navigate('QRCodeDisplay', {
        assignment: currentAssignment,
        action: actionType,
        locationData: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp
        }
      });
      setShowActionSheet(false);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanQRCode = () => {
    if (!currentAssignment || !actionType) return;
    
    (navigation as any).navigate('QRScanner', {
      assignmentId: currentAssignment.id,
      action: actionType
    });
    setShowActionSheet(false);
  };

  const handleQRCodeScanned = async (qrData: string, assignmentId: string, action: 'checkin' | 'checkout') => {
    // Find the assignment
    const assignment = confirmedAssignments.find(a => a.id === assignmentId);
    if (!assignment) {
      Alert.alert('Error', 'Assignment not found');
      return;
    }

    // Set up pending action and show location modal
    setPendingLocationAction({
      type: 'qr',
      assignmentId: assignmentId,
      action: action,
      qrData: qrData
    });
    setShowLocationModal(true);
  };

  const processQRCodeScanned = async (location: LocationData) => {
    if (!pendingLocationAction || pendingLocationAction.type !== 'qr') return;
    
    console.log('🔧 processQRCodeScanned called with location:', location);
    console.log('📍 Received latitude:', location.latitude);
    console.log('📍 Received longitude:', location.longitude);
    console.log('📍 Received accuracy:', location.accuracy);
    
    setIsProcessing(true);
    try {
      // Get fresh GPS location directly for QR code scanning
      const locationService = LocationService.getInstance();
      console.log('🔧 Getting fresh GPS location for QR scan...');
      const freshLocation = await locationService.getCurrentLocationWithRetry(3);
      console.log('🔧 Fresh GPS location for QR:', freshLocation);
      console.log('📍 Fresh latitude:', freshLocation.latitude);
      console.log('📍 Fresh longitude:', freshLocation.longitude);
      
      // Get address from coordinates
      const address = await locationService.getAddressFromCoordinates(
        freshLocation.latitude, 
        freshLocation.longitude
      );

      const locationData = {
        latitude: freshLocation.latitude,
        longitude: freshLocation.longitude,
        address: address
      };
      
      console.log('🔧 Final locationData being sent:', locationData);
      console.log('🔧 Fresh location values:', {
        latitude: freshLocation.latitude,
        longitude: freshLocation.longitude,
        accuracy: freshLocation.accuracy
      });

      // Enhanced notes with QR data and location verification
      const notes = `QR Code: ${pendingLocationAction.qrData} | GPS: ${freshLocation.latitude.toFixed(6)}, ${freshLocation.longitude.toFixed(6)} | Accuracy: ${Math.round(freshLocation.accuracy)}m | Time: ${new Date().toISOString()}`;

      if (pendingLocationAction.action === 'checkin') {
        await ApiService.checkIn(pendingLocationAction.assignmentId, locationData, notes);
        Alert.alert(
          'Check-In Successful! ✅', 
          `Location verified: ${address}\nCoordinates: ${freshLocation.latitude.toFixed(6)}, ${freshLocation.longitude.toFixed(6)}\nAccuracy: ${Math.round(freshLocation.accuracy)}m`,
          [
            {
              text: 'Add Activity',
              onPress: () => {
                const assignment = confirmedAssignments.find(a => a.id === pendingLocationAction.assignmentId);
                if (assignment) {
                  setActivityAssignmentId(assignment.id);
                  setActivityDescription('');
                  setShowActivityModal(true);
                }
              }
            },
            { text: 'Skip', style: 'cancel' }
          ]
        );
      } else {
        await ApiService.checkOut(pendingLocationAction.assignmentId, locationData, notes);
        Alert.alert(
          'Check-Out Successful! ✅', 
          `Location verified: ${address}\nCoordinates: ${freshLocation.latitude.toFixed(6)}, ${freshLocation.longitude.toFixed(6)}\nAccuracy: ${Math.round(freshLocation.accuracy)}m`
        );
      }

      // ✅ Reload the screen data to get fresh data from server
      loadConfirmedAssignments();
    } catch (error) {
      console.error('QR Code check-in/out error:', error);
      Alert.alert('Error', (error as any)?.message || 'Failed to process QR code. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async (assignment: JobAssignment) => {
    try {
      setIsProcessing(true);
      // Fresh-check approval before gating to avoid stale state
      const status = await ApiService.getCheckInStatus(assignment.id);
      console.log('Fresh status for checkout:', status);
      const normalizedApproval = typeof status.approvalStatus === 'string'
        ? ((() => {
            const val = (status.approvalStatus as string).toLowerCase();
            return (val === 'pending' || val === 'approved' || val === 'rejected') ? (val as 'pending' | 'approved' | 'rejected') : undefined;
          })())
        : undefined;

      const canCheckout = (normalizedApproval === 'approved');
      if (!canCheckout) {
        Alert.alert('Pending Approval', 'You can check out only after your check-in is approved.');
        return;
      }

      // Update current item in list with freshest status
      setConfirmedAssignments(prev => prev.map(a => a.id === assignment.id ? {
        ...a,
        isCheckedIn: status.isCheckedIn,
        approvalStatus: normalizedApproval,
        isApprovalPending: (String(status.approvalStatus || '').toLowerCase() === 'pending'),
        checkInId: status.checkInId,
        approvedBy: status.approvedBy,
        approvedAt: status.approvedAt,
        rejectionReason: status.rejectionReason,
      } : a));

      setCurrentAssignment({ ...assignment, isCheckedIn: status.isCheckedIn, approvalStatus: normalizedApproval } as JobAssignment);
      setActionType('checkout');
      setShowActionSheet(true);
    } catch (e) {
      console.error('Fresh status check failed:', e);
      Alert.alert('Error', 'Unable to verify approval status. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCheckOut = async () => {
    if (!currentAssignment) return;
    
    // Set up pending action and show location modal
    setPendingLocationAction({
      type: 'manual',
      assignmentId: currentAssignment.id,
      action: 'checkout'
    });
    setShowLocationModal(true);
    setShowActionSheet(false);
  };

  const processManualCheckOut = async (location: LocationData) => {
    if (!currentAssignment) return;
    
    console.log('🔧 processManualCheckOut called with location:', location);
    console.log('📍 Input latitude:', location.latitude);
    console.log('📍 Input longitude:', location.longitude);
    console.log('📍 Input accuracy:', location.accuracy);
    console.log('📍 Input timestamp:', location.timestamp);
    
    setIsProcessing(true);
    try {
      // Get address from coordinates
      const locationService = LocationService.getInstance();
      const address = await locationService.getAddressFromCoordinates(
        location.latitude, 
        location.longitude
      );

      const checkOutData = {
        jobAssignmentId: currentAssignment.id,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: address
        },
        notes: `Manual check-out | GPS: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} | Accuracy: ${Math.round(location.accuracy)}m | Time: ${new Date().toISOString()}`,
      };

      console.log('🔧 Check-out data being sent:', checkOutData);
      console.log('📍 Location data:', checkOutData.location);
      console.log('📍 Latitude:', location.latitude);
      console.log('📍 Longitude:', location.longitude);

      // ✅ Use the unified endpoint
      const response = await ApiService.checkOut(checkOutData.jobAssignmentId, checkOutData.location, checkOutData.notes);
      
      // ✅ Handle the new response format with jobContext and userInfo
      console.log('Check-out response:', response);
      console.log('Job context:', response.jobContext);
      console.log('User info:', response.userInfo);
      
      const facilityName = response.jobContext?.facilityName || 'the facility';
      const userName = response.userInfo ? `${response.userInfo.firstName} ${response.userInfo.lastName}` : 'User';
      Alert.alert(
        'Check-Out Successful! ✅', 
        `${userName} successfully checked out from ${facilityName}!\n\nLocation verified: ${address}\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\nAccuracy: ${Math.round(location.accuracy)}m`
      );
      
      // ✅ Update the assignment status immediately with user and job context
      const updatedAssignments = confirmedAssignments.map(assignment => 
        assignment.id === currentAssignment.id 
          ? { 
              ...assignment, 
              status: 'COMPLETED' as const, 
              isCheckedIn: false,
              // ✅ Store the user and job context for display
              checkedOutBy: response.userInfo,
              jobContext: response.jobContext
            }
          : assignment
      );
      setConfirmedAssignments(updatedAssignments);
      
      setShowActionSheet(false);
      
      // ✅ Reload the screen data to get fresh data from server
      setTimeout(() => {
        loadConfirmedAssignments();
      }, 1000);
    } catch (error) {
      console.error('Check-out error:', error);
      Alert.alert('Error', (error as any)?.message || 'Failed to check out. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
    if (!user) return { color: Colors.primary, title: 'Check In/Out' };

    switch (user.role) {
      // case 'DOCTOR':
      //   return {
      //     color: Colors.doctor,
      //     title: 'Doctor Check In/Out'
      //   };
      // case 'NURSE':
      //   return {
      //     color: Colors.nurse,
      //     title: 'Nurse Check In/Out'
      //   };
      default:
        return {
          color: Colors.primary,
          title: 'Check In/Out'
        };
    }
  };

  const getAssignmentStatusConfig = (status: string) => {
    switch ((status || '').toUpperCase()) {
      case 'PENDING':
        return { color: Colors.warning, text: 'Pending Response' };
      case 'ACCEPTED':
        return { color: Colors.primary, text: 'Accepted' };
      case 'REJECTED':
        return { color: Colors.error, text: 'Rejected' };
      case 'IN_PROGRESS':
        return { color: '#F59E0B', text: 'In Progress' };
      case 'COMPLETED':
        return { color: Colors.info, text: 'Completed' };
      case 'ASSIGNED':
        return { color: '#8B5CF6', text: 'Assigned' };
      default:
        return { color: Colors.textTertiary, text: (status || 'Unknown') };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch ((priority || '').toUpperCase()) {
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

  const AssignmentCard = ({ assignment }: { assignment: JobAssignment }) => {
    const job = assignment.job || ({} as any);
    const statusCfg = getAssignmentStatusConfig(String(assignment.status));
    const facilityName = (job.facilityName || '').trim();
    const location = (job.location || '').trim();
    const department = job.department || '';
    const requiredRole = job.requiredRole || '';
    const hourlyRate = assignment.hourlyRate || job.hourlyRate || '0';
    const startDateText = job.startDate ? formatDate(job.startDate) : '—';
    const timeRangeText = job.startTime && job.endTime ? `${formatTime(job.startTime)} - ${formatTime(job.endTime)}` : undefined;
    const priority = job.priority || '';
    
    // Show "Add Activity" button when:
    // 1. Status is IN_PROGRESS (check-in approved and working)
    // 2. OR user has checked in (even if pending approval) - they can log activities while waiting
    // 3. OR there's a check-in record (checkInId exists)
    const assignmentStatus = String(assignment.status || '').toUpperCase();
    const isInProgress = assignmentStatus === 'IN_PROGRESS';
    const hasCheckInId = !!(assignment as any).checkInId;
    const isCheckedInFlag = assignment.isCheckedIn === true;
    const approvalStatusLower = String(assignment.approvalStatus || '').toLowerCase();
    const isApproved = approvalStatusLower === 'approved';
    const isPending = approvalStatusLower === 'pending';
    
    // Allow activity entry if: IN_PROGRESS, or checked in (approved or pending), or has check-in record
    const canAddActivity = isInProgress || (isCheckedInFlag && (isApproved || isPending)) || hasCheckInId;
    
    console.log('🔍 Assignment Card Debug:', {
      assignmentId: assignment.id,
      status: assignmentStatus,
      isInProgress,
      approvalStatus: assignment.approvalStatus,
      isApproved,
      isPending,
      isCheckedIn: isCheckedInFlag,
      hasCheckInId,
      canAddActivity
    });

    return (
    <View style={styles.assignmentCard}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTimeText} numberOfLines={1}>
            {startDateText}{timeRangeText ? `, ${timeRangeText}` : ''}
          </Text>
          <View style={[styles.topStatusPill, { backgroundColor: statusCfg.color }]}> 
            <Text style={styles.topStatusText}>{statusCfg.text}</Text>
        </View>
            </View>
        <View style={styles.cardDivider} />

        <View style={styles.profileRow}>
          <View style={styles.profileContent}>
            <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
              {job.title || 'Assignment'}
            </Text>
            <View style={styles.subtitleRow}>
              {!!facilityName && (
                <Text style={styles.subtitleText} numberOfLines={1}>{facilityName}</Text>
              )}
              {!!facilityName && !!location && (
                <Text style={styles.subtitleDot}> • </Text>
              )}
              {!!location && (
                <Text style={styles.subtitleText} numberOfLines={1}>{location}</Text>
              )}
      </View>

            <View style={styles.assignmentRow}>
              {!!priority && (
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Priority</Text>
                  <View style={[styles.priorityBadgeInline, { backgroundColor: getPriorityColor(priority) + '20', borderColor: getPriorityColor(priority) }]}>
                    <Text style={[styles.priorityBadgeTextInline, { color: getPriorityColor(priority) }]} numberOfLines={1}>{priority}</Text>
        </View>
        </View>
              )}
              {!!requiredRole && (
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Role</Text>
                  <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{requiredRole}</Text>
                </View>
              )}
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Rate</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">₹{typeof hourlyRate === 'string' ? hourlyRate : String(hourlyRate)}/hr</Text>
              </View>
        </View>

            {!!department && (
              <View style={styles.priorityRow}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{department}</Text>
          </View>
        )}

            {!!job.description && (
              <Text style={[styles.assignmentDescription, { marginTop: Spacing.sm }]} numberOfLines={4}>
                {job.description}
          </Text>
            )}
        </View>
      </View>

        {/* Activity Actions - Add and View */}
        {canAddActivity && (
          <View style={styles.activityActionsRow}>
              <TouchableOpacity
              style={styles.addActivityButton}
              onPress={() => {
                setActivityAssignmentId(assignment.id);
                setActivityDescription('');
                setShowActivityModal(true);
              }}
            >
              <FontAwesomeIcon icon="plus" size={Responsive.iconSize(16)} color={Colors.white} />
              <Text style={styles.addActivityButtonText}>Add Activity</Text>
              </TouchableOpacity>
              <TouchableOpacity
              style={styles.viewActivitiesButton}
              onPress={async () => {
                try {
                  setIsLoadingActivities(true);
                  setShowActivitiesListModal(true);
                  const resp = await ApiService.getAssignmentActivities(assignment.id, { page: 1, limit: 20 });
                  setActivitiesList(resp?.activities || []);
                } catch (e) {
                  setActivitiesList([]);
                } finally {
                  setIsLoadingActivities(false);
                }
              }}
            >
              <FontAwesomeIcon icon="list" size={Responsive.iconSize(16)} color={Colors.primary} />
              <Text style={styles.viewActivitiesButtonText}>View Activities</Text>
            </TouchableOpacity>
      </View>
        )}

        {/* Per-card actions removed; use floating button */}
        <View style={styles.checkInOutActions} />
    </View>
  );
  };

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
    <View style={styles.container}>
      <GlobalHeader
        title="Check In/Out"
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16 }}
      />
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }>
        {/* Export and Filter Row */}
      {/* Tools row removed (Export All, Filter) */}

        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <FontAwesomeIcon icon="clock" size={Responsive.iconSize(64)} color={Colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>No Active Assignments</Text>
            <Text style={styles.emptyStateText}>
              You don't have any active assignments that require check in/out at the moment.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: roleConfig.color }]}
              onPress={() => navigation.goBack()}>
              <FontAwesomeIcon icon="calendar" size={Responsive.iconSize(16)} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating action button (Check In or Check Out based on eligibility) */}
      {!fabDisabled && (
      <TouchableOpacity
        style={[styles.fabCenter, fabDisabled && { opacity: 0.6 }]}
        activeOpacity={0.8}
        disabled={fabDisabled}
        onPress={() => {
          try {
            // Determine eligible checkout assignments (approved and currently checked in)
            const checkoutEligible = confirmedAssignments.filter(a => 
              a.isCheckedIn === true && String(a.approvalStatus || '').toLowerCase() === 'approved'
            );
            if (checkoutEligible.length > 0) {
              const target = checkoutEligible[0];
              setCurrentAssignment(target as any);
              setActionType('checkout');
              setShowActionSheet(true);
              return;
            }

            // Otherwise, fall back to check-in eligibility
            const checkinEligible = confirmedAssignments.filter(a => 
              (((a.status as any) === 'ASSIGNED' || a.status === 'ACCEPTED') && !a.isCheckedIn && !a.isApprovalPending)
            );
            if (checkinEligible.length === 0) {
              Alert.alert('No Jobs', 'No eligible assignments to check in or out.');
              return;
            }
            const target = checkinEligible[0];
            setCurrentAssignment(target);
            setActionType('checkin');
            setShowActionSheet(true);
          } catch {}
        }}
      >
        {(() => {
          const hasCheckout = confirmedAssignments.some(a => a.isCheckedIn === true && String(a.approvalStatus || '').toLowerCase() === 'approved');
          return (
            <>
              <FontAwesomeIcon icon={hasCheckout ? 'sign-out-alt' : 'sign-in-alt'} size={Responsive.iconSize(18)} color={Colors.white} />
              <Text style={styles.fabCenterText}>{hasCheckout ? 'Check Out' : 'Check In'}</Text>
            </>
          );
        })()}
      </TouchableOpacity>
      )}

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        </View>
      )}


      {/* Custom Action Sheet Modal */}
      <Modal
        visible={showActionSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <View style={styles.actionSheetOverlay}>
          <View style={styles.actionSheet}>
            <Text style={styles.actionSheetTitle}>
              {actionType === 'checkin' ? 'Check In' : 'Check Out'}
            </Text>
            <Text style={styles.actionSheetSubtitle}>
              {currentAssignment?.isApprovalPending
                ? 'Awaiting HR/Admin approval. Actions are temporarily disabled.'
                : currentAssignment?.approvalStatus === 'rejected'
                ? `Check-in rejected${currentAssignment?.rejectionReason ? `: ${currentAssignment.rejectionReason}` : ''}`
                : `How would you like to ${actionType === 'checkin' ? 'check in' : 'check out'}?`}
            </Text>
            
            {/* <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={actionType === 'checkin' ? handleManualCheckIn : handleManualCheckOut}
            >
              <FontAwesomeIcon 
                icon={actionType === 'checkin' ? 'sign-in-alt' : 'sign-out-alt'} 
                size={20} 
                color={Colors.primary} 
              />
              <Text style={styles.actionSheetButtonText}>
                Manual {actionType === 'checkin' ? 'Check In' : 'Check Out'}
              </Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={[styles.actionSheetButton, (currentAssignment?.isApprovalPending || currentAssignment?.approvalStatus === 'rejected') && { opacity: 0.5 }]}
              disabled={!!(currentAssignment?.isApprovalPending || currentAssignment?.approvalStatus === 'rejected')}
              onPress={handleGenerateQRCode}
            >
              <FontAwesomeIcon icon="qrcode" size={Responsive.iconSize(20)} color={Colors.primary} />
              <Text style={styles.actionSheetButtonText}>Generate QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionSheetButton, (currentAssignment?.isApprovalPending || currentAssignment?.approvalStatus === 'rejected') && { opacity: 0.5 }]}
              disabled={!!(currentAssignment?.isApprovalPending || currentAssignment?.approvalStatus === 'rejected')}
              onPress={handleScanQRCode}
            >
              <FontAwesomeIcon icon="camera" size={Responsive.iconSize(20)} color={Colors.primary} />
              <Text style={styles.actionSheetButtonText}>Scan QR Code</Text>
            </TouchableOpacity>

            {/* Add Activity Button - Show when checked in (approved, pending, or IN_PROGRESS status) */}
            {currentAssignment && (() => {
              const assignmentStatus = String(currentAssignment.status || '').toUpperCase();
              const isInProgress = assignmentStatus === 'IN_PROGRESS';
              const hasCheckInId = !!(currentAssignment as any).checkInId;
              const isCheckedInFlag = currentAssignment.isCheckedIn === true;
              const approvalStatusLower = String(currentAssignment.approvalStatus || '').toLowerCase();
              const isApproved = approvalStatusLower === 'approved';
              const isPending = approvalStatusLower === 'pending';
              return isInProgress || (isCheckedInFlag && (isApproved || isPending)) || hasCheckInId;
            })() && (
              <TouchableOpacity
                style={styles.actionSheetButton}
                onPress={() => {
                  setShowActionSheet(false);
                  setActivityAssignmentId(currentAssignment.id);
                  setActivityDescription('');
                  setShowActivityModal(true);
                }}
              >
                <FontAwesomeIcon icon="plus" size={Responsive.iconSize(20)} color={Colors.primary} />
                <Text style={styles.actionSheetButtonText}>Add Activity</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionSheetButton, styles.cancelButton]}
              onPress={() => setShowActionSheet(false)}
            >
              <FontAwesomeIcon icon="times" size={Responsive.iconSize(20)} color={Colors.error} />
              <Text style={[styles.actionSheetButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Location Validation Modal */}
      <LocationValidationModal
        visible={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          setPendingLocationAction(null);
        }}
        onLocationValidated={(location) => {
          console.log('🔧 LocationValidationModal callback received location:', location);
          console.log('📍 Callback latitude:', location.latitude);
          console.log('📍 Callback longitude:', location.longitude);
          console.log('📍 Callback accuracy:', location.accuracy);
          
          if (pendingLocationAction) {
            if (pendingLocationAction.type === 'manual') {
              if (pendingLocationAction.action === 'checkin') {
                processManualCheckIn(location);
              } else if (pendingLocationAction.action === 'checkout') {
                processManualCheckOut(location);
              }
            } else if (pendingLocationAction.type === 'qr') {
              processQRCodeScanned(location);
            }
          }
          setShowLocationModal(false);
          setPendingLocationAction(null);
        }}
        jobLocation={((currentAssignment as any)?.job &&
          typeof (currentAssignment as any).job.latitude === 'number' &&
          typeof (currentAssignment as any).job.longitude === 'number') ? {
            latitude: (currentAssignment as any).job.latitude,
            longitude: (currentAssignment as any).job.longitude,
          } : undefined}
        maxDistanceMeters={500}
      />

      {/* Activities List Modal */}
      <Modal
        visible={showActivitiesListModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActivitiesListModal(false)}
      >
        <View style={styles.activityModalOverlay}>
          <View style={styles.activityModalContainer}>
            <View style={styles.activityModalHeader}>
              <Text style={styles.activityModalTitle}>Activities</Text>
              {!!activitiesList && !isLoadingActivities && (
                <View style={styles.activityCountBadge}>
                  <Text style={styles.activityCountText}>{activitiesList.length}</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => setShowActivitiesListModal(false)}>
                <FontAwesomeIcon icon="times" size={Responsive.iconSize(20)} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {isLoadingActivities ? (
              <View style={styles.activitiesLoadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.activitiesLoadingText}>Loading activities...</Text>
              </View>
            ) : activitiesList && activitiesList.length > 0 ? (
              <View style={styles.activitiesListWrapper}>
                <ScrollView style={styles.activitiesScroll} showsVerticalScrollIndicator={true}>
                  {activitiesList.map((a: any, idx: number) => (
                    <View key={a.id || idx} style={styles.activityCard}>
                      <View style={styles.activityRow}>
                        <View style={styles.activityIconCircle}>
                          <FontAwesomeIcon icon="clipboard-list" size={Responsive.iconSize(14)} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.activityDescription} numberOfLines={2}>{a.description}</Text>
                          <View style={styles.activityMetaRow}>
                            <View style={styles.activityMetaPill}>
                              <FontAwesomeIcon icon="clock" size={Responsive.iconSize(12)} color={Colors.textSecondary} />
                              <Text style={styles.activityTime}>{new Date(a.activityTime || a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {new Date(a.activityTime || a.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text>
                            </View>
                            <View style={styles.activityIndexChip}>
                              <Text style={styles.activityIndexChipText}>#{idx + 1}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.activitiesEmptyState}>
                <FontAwesomeIcon icon="clipboard-list" size={Responsive.iconSize(28)} color={Colors.textTertiary} />
                <Text style={styles.activitiesEmptyText}>No activities recorded yet.</Text>
              </View>
            )}

            <View style={styles.activityModalFooter}>
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowActivitiesListModal(false)}>
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Activity Entry Modal */}
      <Modal
        visible={showActivityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowActivityModal(false);
          setActivityDescription('');
          setActivityAssignmentId(null);
        }}
      >
        <View style={styles.activityModalOverlay}>
          <View style={styles.activityModalContainer}>
            <View style={styles.activityModalHeader}>
              <Text style={styles.activityModalTitle}>Add Activity</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowActivityModal(false);
                  setActivityDescription('');
                  setActivityAssignmentId(null);
                }}
              >
                <FontAwesomeIcon icon="times" size={Responsive.iconSize(20)} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.activityModalLabel}>Activity Description</Text>
            <TextInput
              style={styles.activityModalInput}
              placeholder="Enter activity description (e.g., Saw patient John Doe in Room 201, ordered ECG and blood tests)"
              placeholderTextColor={Colors.textTertiary}
              value={activityDescription}
              onChangeText={setActivityDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.activityModalActions}>
              <TouchableOpacity
                style={[styles.activityModalButton, styles.activityModalCancelButton]}
                onPress={() => {
                  setShowActivityModal(false);
                  setActivityDescription('');
                  setActivityAssignmentId(null);
                }}
              >
                <Text style={styles.activityModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.activityModalButton, styles.activityModalSubmitButton]}
                onPress={async () => {
                  if (!activityDescription.trim() || !activityAssignmentId) {
                    Alert.alert('Error', 'Please enter an activity description.');
                    return;
                  }
                  
                  setIsProcessing(true);
                  try {
                    await ApiService.createAssignmentActivity(activityAssignmentId, {
                      activityTime: new Date().toISOString(),
                      description: activityDescription.trim()
                    });
                    Alert.alert('Success', 'Activity added successfully!');
                    setShowActivityModal(false);
                    setActivityDescription('');
                    setActivityAssignmentId(null);
                  } catch (error: any) {
                    console.error('Failed to create activity:', error);
                    Alert.alert('Error', error?.message || 'Failed to add activity. Please try again.');
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={!activityDescription.trim() || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.activityModalSubmitText}>Add Activity</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: '#d3d3d3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
  },
  assignmentDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  // Dashboard-like card layout (to match HP Dashboard / AssignmentScreen)
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTimeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
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
  profileContent: {
    flex: 1,
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
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
    color: Colors.textSecondary,
    flexShrink: 1,
    maxWidth: '45%',
  },
  subtitleDot: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginHorizontal: 6,
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
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textTertiary,
  },
  infoValue: {
    marginTop: 2,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
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
    fontWeight: Typography.fontWeight.bold,
  },
  topStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  topStatusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textTransform: 'capitalize',
  },
  assignmentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
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
  // List-like layout (match HR dashboard aesthetics)
  listRow: { flexDirection: 'row', alignItems: 'center' },
  listIconWrapper: { marginRight: 14 },
  listIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F1',
  },
  listContent: { flex: 1, marginRight: 12 },
  listTitle: { fontSize: 15, fontFamily: Typography.fontFamily.medium, color: '#111827', marginBottom: 4 },
  listSubtitle: { fontSize: 13, fontFamily: Typography.fontFamily.regular, color: '#6B7280', marginBottom: 8 },
  listFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontFamily: Typography.fontFamily.bold, textTransform: 'capitalize' },
  listMeta: { fontSize: 13, fontFamily: Typography.fontFamily.bold, color: '#111827' },
  checkInOutActions: {
    display: 'none',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 120,
    justifyContent: 'center',
  },
  checkInButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  checkOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 120,
    justifyContent: 'center',
  },
  checkOutButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
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
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing['2xl'],
    alignItems: 'center',
  },
  processingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  actionSheetTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  actionSheetSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
  },
  actionSheetButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
  },
  cancelButton: {
    backgroundColor: Colors.error + '10',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  cancelButtonText: {
    color: Colors.error,
  },
  completionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.success + '10',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  fabCenter: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 28,
    ...Shadow.lg,
  },
  fabCenterText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    marginLeft: 8,
  },
  completionStatusText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.success,
    marginLeft: Spacing.sm,
  },
  activityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  activityModalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    maxHeight: '80%',
  },
  activityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  activityModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  activityModalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  activityModalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 100,
    marginBottom: Spacing.lg,
  },
  activityModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  activityModalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityModalCancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityModalCancelText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  activityModalSubmitButton: {
    backgroundColor: Colors.primary,
  },
  activityModalSubmitText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
  activitiesLoadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  activitiesLoadingText: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  activitiesListWrapper: {
    maxHeight: '65%',
  },
  activitiesScroll: {
    paddingBottom: Spacing.sm,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    ...Shadow.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  activityIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    marginTop: 2,
  },
  activityMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  activityTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.medium,
  },
  activityDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
    fontFamily: Typography.fontFamily.medium,
  },
  activityCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityIndexBadge: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  activityIndexText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  activityIndexChip: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activityIndexChipText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.medium,
  },
  activityDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 6,
  },
  activitiesEmptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: 6,
  },
  activitiesEmptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
  },
  activityCountBadge: {
    marginLeft: 'auto',
    marginRight: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activityCountText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  activityModalFooter: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeModalButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  closeModalButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  activityActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  addActivityButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
  viewActivitiesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  viewActivitiesButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
});

export default CheckInOutScreen;
