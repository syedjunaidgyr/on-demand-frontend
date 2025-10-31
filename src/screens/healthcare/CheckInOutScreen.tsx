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
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { JobAssignment, User } from '../../types';
import ApiService from '../../services/api';
import LocationService, { LocationData } from '../../services/locationService';
import LocationValidationModal from '../../components/LocationValidationModal';
import Responsive from '../../utils/responsive';
import * as ExportUtils from '../../utils/exportUtils';

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

  const [showExportAllMenu, setShowExportAllMenu] = useState(false);
  const [exportingAssignmentId, setExportingAssignmentId] = useState<string | null>(null);
  const [showAssignmentExportMenuForId, setShowAssignmentExportMenuForId] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterTitle, setFilterTitle] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    loadConfirmedAssignments();
  }, []);

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

      // ✅ Add check-in status to each assignment
      const assignmentsWithCheckInStatus = await Promise.all(
        confirmed.map(async (assignment) => {
          try {
            // Check if there's an active check-in for this assignment
            const checkInStatus = await ApiService.getCheckInStatus(assignment.id);
            console.log('🔍 Check-in status for assignment', assignment.id, ':', checkInStatus);
            return {
              ...assignment,
              isCheckedIn: checkInStatus.isCheckedIn,
              checkInId: checkInStatus.checkInId
            };
          } catch (error) {
            console.log('Could not get check-in status for assignment:', assignment.id, error);
            // For now, let's assume they can check in (since backend endpoint might not exist)
            return {
              ...assignment,
              isCheckedIn: false,
              checkInId: null
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

  const filteredAssignments = useMemo(() => {
    const titleQuery = filterTitle.trim().toLowerCase();
    const statusFilter = filterStatus?.toUpperCase() || '';
    return confirmedAssignments.filter((a) => {
      const title = a.job?.title?.toLowerCase() || '';
      const status = (a.status || '').toUpperCase();
      const byTitle = titleQuery.length === 0 || title.includes(titleQuery);
      const byStatus = statusFilter.length === 0 || status === statusFilter;
      return byTitle && byStatus;
    });
  }, [confirmedAssignments, filterTitle, filterStatus]);

  const handleExportAssignmentBrief = async (assignmentId: string, format: 'pdf' | 'excel') => {
    try {
      setExportingAssignmentId(assignmentId);
      const a = confirmedAssignments.find(x => x.id === assignmentId);
      if (!a) { Alert.alert('Export', 'Assignment not found'); return; }
      const row = {
        id: a.id,
        jobTitle: a.job?.title || '',
        facilityName: a.job?.facilityName || a.job?.location || '',
        department: a.job?.department || '',
        status: a.status || '',
        startDate: a.job?.startDate || '',
        endDate: a.job?.endDate || '',
        checkedIn: a.isCheckedIn ? 'Yes' : 'No',
      };
      const fileName = `CheckInOut_${a.id}`;
      if (format === 'pdf') {
        await ExportUtils.generateAndSavePDF(
          [row],
          fileName,
          ['id', 'jobTitle', 'facilityName', 'department', 'status', 'startDate', 'endDate', 'checkedIn'],
          `Assignment #${a.id}`
        );
      } else {
        await ExportUtils.exportToXLSXFile(
          [row],
          fileName,
          ['id', 'jobTitle', 'facilityName', 'department', 'status', 'startDate', 'endDate', 'checkedIn']
        );
      }
    } catch (e) {
      console.error('Export error:', e);
      Alert.alert('Export Failed', 'Could not export');
    } finally {
      setExportingAssignmentId(null);
    }
  };

  const handleExportAllBrief = async (format: 'pdf' | 'excel') => {
    try {
      const list = filteredAssignments;
      if (!list || list.length === 0) { Alert.alert('Nothing to export', 'No data to export'); return; }
      const rows = list.map(a => ({
        id: a.id,
        jobTitle: a.job?.title || '',
        facilityName: a.job?.facilityName || a.job?.location || '',
        department: a.job?.department || '',
        status: a.status || '',
        startDate: a.job?.startDate || '',
        endDate: a.job?.endDate || '',
        checkedIn: a.isCheckedIn ? 'Yes' : 'No',
      }));
      const fileName = 'CheckInOut_Assignments';
      if (format === 'pdf') {
        await ExportUtils.generateAndSavePDF(
          rows,
          fileName,
          ['id', 'jobTitle', 'facilityName', 'department', 'status', 'startDate', 'endDate', 'checkedIn'],
          'Check In/Out Assignments'
        );
      } else {
        await ExportUtils.exportToXLSXFile(
          rows,
          fileName,
          ['id', 'jobTitle', 'facilityName', 'department', 'status', 'startDate', 'endDate', 'checkedIn']
        );
      }
    } catch (e) {
      console.error('Export error:', e);
      Alert.alert('Export Failed', 'Could not export');
    }
  };

  const handleCheckIn = async (assignment: JobAssignment) => {
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
      
      const facilityName = response.jobContext?.facilityName || 'the facility';
      const userName = response.userInfo ? `${response.userInfo.firstName} ${response.userInfo.lastName}` : 'User';
      Alert.alert(
        'Check-In Successful! ✅', 
        `${userName} successfully checked in at ${facilityName}!\n\nLocation verified: ${address}\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\nAccuracy: ${Math.round(location.accuracy)}m`
      );
      
      // ✅ Update the assignment status immediately with user and job context
      const updatedAssignments = confirmedAssignments.map(assignment => 
        assignment.id === currentAssignment.id 
          ? { 
              ...assignment, 
              status: 'IN_PROGRESS' as const, 
              isCheckedIn: true,
              // ✅ Store the user and job context for display
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
          `Location verified: ${address}\nCoordinates: ${freshLocation.latitude.toFixed(6)}, ${freshLocation.longitude.toFixed(6)}\nAccuracy: ${Math.round(freshLocation.accuracy)}m`
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
    setCurrentAssignment(assignment);
    setActionType('checkout');
    setShowActionSheet(true);
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

  const AssignmentCard = ({ assignment }: { assignment: JobAssignment }) => (
    <View style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
        <Text style={styles.assignmentTitle}>{assignment.job?.title || 'Assignment'}</Text>
        <View style={[styles.assignmentStatus, { 
          backgroundColor: assignment.status === 'COMPLETED' ? Colors.info : Colors.success 
        }]}>
          <Text style={styles.assignmentStatusText}>
            {assignment.status === 'COMPLETED' ? 'Completed' : 'Active'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                onPress={() => { setShowAssignmentExportMenuForId(null); handleExportAssignmentBrief(assignment.id, 'pdf'); }}
              >
                <FontAwesomeIcon icon="file-pdf" size={14} color={Colors.textPrimary} />
                <Text style={styles.exportDropdownItemText}>PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportDropdownItem}
                onPress={() => { setShowAssignmentExportMenuForId(null); handleExportAssignmentBrief(assignment.id, 'excel'); }}
              >
                <FontAwesomeIcon icon="file-excel" size={14} color={Colors.textPrimary} />
                <Text style={styles.exportDropdownItemText}>Excel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.assignmentDescription}>{assignment.job?.description || 'No description available'}</Text>

      <View style={styles.assignmentDetails}>
        {/* ✅ Add facility name */}
        <View style={styles.assignmentDetail}>
          <FontAwesomeIcon icon="hospital" size={Responsive.iconSize(16)} color={Colors.textTertiary} />
          <Text style={styles.assignmentDetailText}>{assignment.job?.facilityName || 'Facility not specified'}</Text>
        </View>

        <View style={styles.assignmentDetail}>
          <FontAwesomeIcon icon="map-marker-alt" size={Responsive.iconSize(16)} color={Colors.textTertiary} />
          <Text style={styles.assignmentDetailText}>{assignment.job?.location || 'Location not specified'}</Text>
        </View>

        {/* ✅ Add department */}
        <View style={styles.assignmentDetail}>
          <FontAwesomeIcon icon="building" size={Responsive.iconSize(16)} color={Colors.textTertiary} />
          <Text style={styles.assignmentDetailText}>{assignment.job?.department || 'Department not specified'}</Text>
        </View>

        {/* ✅ Add specialization for doctors */}
        {assignment.job?.specialization && (
          <View style={styles.assignmentDetail}>
            <FontAwesomeIcon icon="user-md" size={Responsive.iconSize(16)} color={Colors.textTertiary} />
            <Text style={styles.assignmentDetailText}>{assignment.job.specialization}</Text>
          </View>
        )}

        <View style={styles.assignmentDetail}>
          <FontAwesomeIcon icon="calendar" size={Responsive.iconSize(16)} color={Colors.textTertiary} />
          <Text style={styles.assignmentDetailText}>
            {assignment.job?.startDate ? formatDate(assignment.job.startDate) : 'Date not specified'}
          </Text>
        </View>

        <View style={styles.assignmentDetail}>
          <FontAwesomeIcon icon="clock" size={Responsive.iconSize(16)} color={Colors.textTertiary} />
          <Text style={styles.assignmentDetailText}>
            {assignment.job?.startTime && assignment.job?.endTime 
              ? `${formatTime(assignment.job.startTime)} - ${formatTime(assignment.job.endTime)}`
              : 'Time not specified'
            }
          </Text>
        </View>
      </View>

      <View style={styles.checkInOutActions}>
        {(() => {
          console.log('🎨 Rendering button for assignment:', assignment.id, 'status:', assignment.status, 'isCheckedIn:', assignment.isCheckedIn);
          
          // If status is COMPLETED, show completion message (no button)
          if (assignment.status === 'COMPLETED') {
            return (
              <View style={styles.completionStatus}>
                <FontAwesomeIcon icon="check-circle" size={Responsive.iconSize(16)} color={Colors.success} />
                <Text style={styles.completionStatusText}>Staff has been checked out</Text>
              </View>
            );
          }
          
          // If status is IN_PROGRESS OR if checked in, show Check Out button
          if (assignment.status === 'IN_PROGRESS' || assignment.isCheckedIn) {
            return (
              <TouchableOpacity
                style={[styles.checkOutButton, { backgroundColor: Colors.error }]}
                onPress={() => handleCheckOut(assignment)}
                disabled={isProcessing}>
                <FontAwesomeIcon icon="sign-out-alt" size={Responsive.iconSize(16)} color={Colors.white} />
                <Text style={styles.checkOutButtonText}>Check Out</Text>
              </TouchableOpacity>
            );
          }
          
          // If status is ASSIGNED or ACCEPTED and not checked in, show Check In
          if (((assignment.status as any) === 'ASSIGNED' || assignment.status === 'ACCEPTED') && !assignment.isCheckedIn) {
            return (
              <TouchableOpacity
                style={[styles.checkInButton, { backgroundColor: (assignment.status as any) === 'ASSIGNED' ? Colors.warning : Colors.success }]}
                onPress={() => handleCheckIn(assignment)}
                disabled={isProcessing}>
                <FontAwesomeIcon icon="sign-in-alt" size={Responsive.iconSize(16)} color={Colors.white} />
                <Text style={styles.checkInButtonText}>
                  {(assignment.status as any) === 'ASSIGNED' ? 'Accept & Check In' : 'Check In'}
                </Text>
              </TouchableOpacity>
            );
          }
          
          // Default fallback - show Check In button
          return (
            <TouchableOpacity
              style={[styles.checkInButton, { backgroundColor: Colors.success }]}
              onPress={() => handleCheckIn(assignment)}
              disabled={isProcessing}>
              <FontAwesomeIcon icon="sign-in-alt" size={16} color={Colors.white} />
              <Text style={styles.checkInButtonText}>Check In</Text>
            </TouchableOpacity>
          );
        })()}
      </View>
    </View>
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
    <View style={styles.container}>
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
                  onPress={() => { setShowExportAllMenu(false); handleExportAllBrief('pdf'); }}
                >
                  <FontAwesomeIcon icon="file-pdf" size={14} color={Colors.textPrimary} />
                  <Text style={styles.exportDropdownItemText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exportDropdownItem}
                  onPress={() => { setShowExportAllMenu(false); handleExportAllBrief('excel'); }}
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

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        </View>
      )}

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
                {['', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].map((s) => (
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

      {/* Custom Action Sheet Modal */}
      <Modal
        visible={showActionSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionSheet}>
            <Text style={styles.actionSheetTitle}>
              {actionType === 'checkin' ? 'Check In' : 'Check Out'}
            </Text>
            <Text style={styles.actionSheetSubtitle}>
              How would you like to {actionType === 'checkin' ? 'check in' : 'check out'}?
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
              style={styles.actionSheetButton}
              onPress={handleGenerateQRCode}
            >
              <FontAwesomeIcon icon="qrcode" size={Responsive.iconSize(20)} color={Colors.primary} />
              <Text style={styles.actionSheetButtonText}>Generate QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={handleScanQRCode}
            >
              <FontAwesomeIcon icon="camera" size={Responsive.iconSize(20)} color={Colors.primary} />
              <Text style={styles.actionSheetButtonText}>Scan QR Code</Text>
            </TouchableOpacity>

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
        jobLocation={currentAssignment?.job ? {
          latitude: currentAssignment.job.latitude || 0,
          longitude: currentAssignment.job.longitude || 0
        } : undefined}
        maxDistanceMeters={500}
      />
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
  },
  assignmentDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
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
  checkInOutActions: {
    flexDirection: 'row',
    justifyContent: 'center',
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
  modalOverlay: {
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
  completionStatusText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.success,
    marginLeft: Spacing.sm,
  },
});

export default CheckInOutScreen;
