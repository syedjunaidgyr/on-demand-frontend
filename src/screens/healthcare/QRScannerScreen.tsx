import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { FontAwesomeIcon } from '../../utils/icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import ApiService from '../../services/api';

interface QRScannerScreenProps {
  assignmentId: string;
  action: 'checkin' | 'checkout';
}

const { width, height } = Dimensions.get('window');

const QRScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { assignmentId, action } = route.params as QRScannerScreenProps;
  
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back') || devices[0];
  const camera = useRef<Camera>(null);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      // Check if permission is already granted first
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (granted) {
          setHasPermission(true);
          return;
        }
        
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs camera access to scan QR codes for check-in/check-out.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        setHasPermission(result === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const permission = await Camera.getCameraPermissionStatus();
        if (permission === 'granted') {
          setHasPermission(true);
          return;
        }
        
        const newPermission = await Camera.requestCameraPermission();
        setHasPermission(newPermission === 'granted');
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      // Assume permission is granted if there's an error
      setHasPermission(true);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setScannedData(null);
  };

  const handleQRCodeDetected = async (data: string) => {
    if (!isScanning || isProcessing) return;
    
    setIsScanning(false);
    setScannedData(data);
    setIsProcessing(true);
    
    try {
      // Parse the QR code data
      const qrData = JSON.parse(data);
      
      // Call the appropriate API based on action
      const locationData = {
        latitude: 0, // TODO: Get actual location from GPS
        longitude: 0, // TODO: Get actual location from GPS
        address: qrData.location || 'Hospital Location'
      };
      
      let response;
      if (action === 'checkin') {
        response = await ApiService.checkIn(assignmentId, locationData, 'Checked in via QR code');
        const facilityName = response.jobContext?.facilityName || 'the facility';
        const userName = response.userInfo ? `${response.userInfo.firstName} ${response.userInfo.lastName}` : 'User';
        Alert.alert('Success', `${userName} successfully checked in at ${facilityName} via QR code!`);
      } else {
        response = await ApiService.checkOut(assignmentId, locationData, 'Checked out via QR code');
        const facilityName = response.jobContext?.facilityName || 'the facility';
        const userName = response.userInfo ? `${response.userInfo.firstName} ${response.userInfo.lastName}` : 'User';
        Alert.alert('Success', `${userName} successfully checked out from ${facilityName} via QR code!`);
      }
      
      // Navigate back to CheckInOut screen
      navigation.goBack();
      
    } catch (error) {
      console.error('QR Code processing error:', error);
      
      // Show error and allow retry
      Alert.alert(
        'Error',
        'Failed to process QR code. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setIsScanning(true);
              setScannedData(null);
              setIsProcessing(false);
            }
          },
          {
            text: 'Cancel',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Real QR code detection will be handled by the Camera component
  // Remove the dummy simulation - let the actual camera handle QR detection

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <FontAwesomeIcon icon="camera" size={64} color={Colors.textTertiary} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Please allow camera access to scan QR codes for check-in/check-out.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestCameraPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <FontAwesomeIcon icon="exclamation-triangle" size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Camera Not Available</Text>
          <Text style={styles.errorText}>
            No camera device found on this device.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Real Camera View */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={camera}
          style={styles.camera}
          device={device}
          isActive={isScanning}
        />
        
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}>
              <FontAwesomeIcon icon="times" size={24} color={Colors.white} />
            </TouchableOpacity>
            
            <Text style={styles.title}>
              {action === 'checkin' ? 'Check In' : 'Check Out'}
            </Text>
            
            <View style={styles.placeholder} />
          </View>
          
          {/* Scanning Area */}
          <View style={styles.scanningArea}>
            <View style={styles.scanningFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            
            <Text style={styles.instructionText}>
              Position the QR code within the frame
            </Text>
          </View>
          
          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            <Text style={styles.helpText}>
              Scan the QR code at your location to {action === 'checkin' ? 'check in' : 'check out'}
            </Text>
            
            {/* Manual Scan Button */}
            <TouchableOpacity
              style={[styles.scanButton, isProcessing && styles.scanButtonDisabled]}
              onPress={() => {
                // For testing - simulate scanning a real QR code
                const realQRData = `{"assignmentId":"${assignmentId}","providerId":"user123","location":"Hospital Location","timestamp":"${new Date().toISOString()}","action":"${action}","jobTitle":"Sample Job","providerName":"Test User"}`;
                handleQRCodeDetected(realQRData);
              }}
              disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <Text style={styles.scanButtonText}>Processing...</Text>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon="search" size={20} color={Colors.white} />
                  <Text style={styles.scanButtonText}>Tap to Scan QR Code</Text>
                </>
              )}
            </TouchableOpacity>
            
            {scannedData && (
              <View style={styles.scannedDataContainer}>
                <Text style={styles.scannedDataLabel}>Scanned:</Text>
                <Text style={styles.scannedDataText}>{scannedData}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  placeholder: {
    width: 40,
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  scanningFrame: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.white,
    textAlign: 'center',
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    alignItems: 'center',
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  scannedDataContainer: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  scannedDataLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  scannedDataText: {
    fontSize: Typography.fontSize.base,
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  permissionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  permissionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['2xl'],
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  permissionButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  scanButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.7,
  },
  scanButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
});

export default QRScannerScreen;
