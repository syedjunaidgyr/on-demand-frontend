import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface QRScannerScreenProps {
  assignmentId: string;
  action: 'checkin' | 'checkout';
}

const { width, height } = Dimensions.get('window');

const QRScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { assignmentId, action } = route.params as QRScannerScreenProps;
  
  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);

  useEffect(() => {
    // Simulate scanning process
    startScanning();
  }, []);

  const startScanning = () => {
    setIsScanning(true);
    setScannedData(null);
  };

  const handleQRCodeDetected = (data: string) => {
    if (!isScanning) return;
    
    setIsScanning(false);
    setScannedData(data);
    
    // Show success feedback
    Alert.alert(
      'QR Code Scanned!',
      `Scanned: ${data}`,
      [
        {
          text: 'Scan Again',
          onPress: () => {
            setIsScanning(true);
            setScannedData(null);
          }
        },
        {
          text: 'Use This Code',
          onPress: () => {
            // Navigate back with the scanned data
            (navigation as any).navigate('CheckInOut', { 
              assignmentId,
              scannedQRData: data,
              scannedAction: action
            });
          }
        }
      ]
    );
  };

  // Simulate QR code detection for now
  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => {
        if (isScanning) {
          const mockQRData = `{"assignmentId":"${assignmentId}","providerId":"user123","location":"Hospital Location","timestamp":"${new Date().toISOString()}","action":"${action}","jobTitle":"Sample Job","providerName":"Test User"}`;
          handleQRCodeDetected(mockQRData);
        }
      }, 3000); // 3 second delay to simulate scanning

      return () => clearTimeout(timer);
    }
  }, [isScanning, assignmentId, action]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Simulated Camera View */}
      <View style={styles.cameraContainer}>
        <View style={styles.simulatedCamera}>
          <FontAwesomeIcon icon="camera" size={100} color={Colors.white} />
          <Text style={styles.cameraText}>Camera View</Text>
        </View>
        
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
  simulatedCamera: {
    flex: 1,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
    marginTop: Spacing.md,
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
});

export default QRScannerScreen;
