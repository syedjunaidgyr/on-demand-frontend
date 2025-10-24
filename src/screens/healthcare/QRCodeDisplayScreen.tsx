import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';
import QRCodeGenerator from '../../components/QRCodeGenerator';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { JobAssignment, QRCodeData } from '../../types';
import { generateQRCodeData } from '../../utils/qrCodeUtils';

interface QRCodeDisplayScreenProps {
  assignment: JobAssignment;
  action: 'checkin' | 'checkout';
  locationData?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
}

const QRCodeDisplayScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { assignment, action, locationData } = route.params as QRCodeDisplayScreenProps;
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate QR code data
  const qrData: QRCodeData = {
    assignmentId: assignment.id,
    providerId: assignment.user?.id || '',
    location: assignment.job?.location || 'Unknown Location',
    timestamp: new Date().toISOString(),
    action,
    jobTitle: assignment.job?.title || 'Assignment',
    providerName: assignment.user ? `${assignment.user.firstName} ${assignment.user.lastName}` : 'Unknown Provider',
    // Include GPS location data if available
    gpsLocation: locationData ? {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy,
      timestamp: locationData.timestamp
    } : undefined,
  };

  const handleShare = async () => {
    setIsProcessing(true);
    try {
      const qrDataString = JSON.stringify(qrData);
      
      await Share.share({
        title: `QR Code - ${assignment.job?.title}`,
        message: `QR Code for ${action} - ${assignment.job?.title}\n\nQR Data: ${qrDataString}`,
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share QR code');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToGallery = async () => {
    setIsProcessing(true);
    try {
      Alert.alert(
        'Save to Gallery',
        'To save this QR code to your gallery, please take a screenshot of this screen.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save QR code');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = async () => {
    setIsProcessing(true);
    try {
      const qrDataString = JSON.stringify(qrData);
      
      await Share.share({
        title: `Print QR Code - ${assignment.job?.title}`,
        message: `Print QR Code for ${action}\n\nQR Data: ${qrDataString}`,
      });
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to prepare QR code for printing');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader
        title={`QR Code - ${action === 'checkin' ? 'Check In' : 'Check Out'}`}
        backgroundColor={Colors.primary}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Assignment Details</Text>
          <Text style={styles.infoText}>Job: {assignment.job?.title}</Text>
          <Text style={styles.infoText}>Location: {assignment.job?.location}</Text>
          <Text style={styles.infoText}>
            Provider: {assignment.user?.firstName} {assignment.user?.lastName}
          </Text>
          
          {locationData && (
            <View style={styles.locationContainer}>
              <Text style={styles.locationTitle}>📍 GPS Location Verified</Text>
              <Text style={styles.locationText}>
                Latitude: {locationData.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Longitude: {locationData.longitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Accuracy: {Math.round(locationData.accuracy)}m
              </Text>
              <Text style={styles.locationText}>
                Captured: {new Date(locationData.timestamp).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.qrContainer}>
          <QRCodeGenerator
            qrData={qrData}
            size={250}
            showDetails={true}
          />
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.success }]}
            onPress={handleSaveToGallery}
            disabled={isProcessing}>
            <FontAwesomeIcon icon="download" size={20} color={Colors.white} />
            <Text style={styles.actionButtonText}>Save to Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary }]}
            onPress={handleShare}
            disabled={isProcessing}>
            <FontAwesomeIcon icon="share" size={20} color={Colors.white} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.warning }]}
            onPress={handlePrint}
            disabled={isProcessing}>
            <FontAwesomeIcon icon="print" size={20} color={Colors.white} />
            <Text style={styles.actionButtonText}>Print</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Use:</Text>
          <Text style={styles.instructionsText}>
            1. Show this QR code to the scanner device
          </Text>
          <Text style={styles.instructionsText}>
            2. The scanner will process your {action}
          </Text>
          <Text style={styles.instructionsText}>
            3. Take a screenshot to save this QR code
          </Text>
          <Text style={styles.instructionsText}>
            4. Share the QR data with colleagues if needed
          </Text>
          <Text style={styles.instructionsText}>
            5. This QR code works for both check-in and check-out
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  infoContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  infoTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 100,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  instructionsContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  instructionsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  instructionsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  locationContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.success + '10',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  locationTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success,
    marginBottom: Spacing.sm,
  },
  locationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
});

export default QRCodeDisplayScreen;
