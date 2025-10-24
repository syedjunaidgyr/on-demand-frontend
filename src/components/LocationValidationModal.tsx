import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesomeIcon } from '../utils/icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../constants/spacing';
import LocationService, { LocationData } from '../services/locationService';

interface LocationValidationModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationValidated: (location: LocationData) => void;
  jobLocation?: { latitude: number; longitude: number };
  maxDistanceMeters?: number;
}

const LocationValidationModal: React.FC<LocationValidationModalProps> = ({
  visible,
  onClose,
  onLocationValidated,
  jobLocation,
  maxDistanceMeters = 500,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentLocation, setCurrentLocation] = React.useState<LocationData | null>(null);
  const [validationResult, setValidationResult] = React.useState<{
    isValid: boolean;
    distance: number;
    message: string;
  } | null>(null);

  const locationService = LocationService.getInstance();

  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      // Request permission first
      const hasPermission = await locationService.requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Location Permission Required', 'Please enable location access to verify your location.');
        return;
      }

      // Get current location
      const location = await locationService.getCurrentLocationWithRetry(3);
      console.log('🔧 LocationValidationModal captured location:', location);
      console.log('📍 Modal latitude:', location.latitude);
      console.log('📍 Modal longitude:', location.longitude);
      console.log('📍 Modal accuracy:', location.accuracy);
      setCurrentLocation(location);

      // Validate location if job location is provided
      if (jobLocation) {
        const validation = locationService.validateLocation(
          location,
          jobLocation,
          maxDistanceMeters
        );
        setValidationResult(validation);
      } else {
        setValidationResult({
          isValid: true,
          distance: 0,
          message: 'Location captured successfully.',
        });
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (currentLocation) {
      console.log('🔧 LocationValidationModal handleConfirm called with:', currentLocation);
      console.log('📍 Confirming latitude:', currentLocation.latitude);
      console.log('📍 Confirming longitude:', currentLocation.longitude);
      onLocationValidated(currentLocation);
      onClose();
    }
  };

  const handleRetry = () => {
    setCurrentLocation(null);
    setValidationResult(null);
    getCurrentLocation();
  };

  React.useEffect(() => {
    if (visible) {
      console.log('🔧 LocationValidationModal opened, getting location...');
      getCurrentLocation();
    } else {
      console.log('🔧 LocationValidationModal closed, resetting state...');
      // Reset state when modal closes
      setCurrentLocation(null);
      setValidationResult(null);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <FontAwesomeIcon icon="map-marker-alt" size={24} color={Colors.primary} />
            <Text style={styles.title}>Location Verification</Text>
          </View>

          <View style={styles.content}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Getting your location...</Text>
              </View>
            ) : currentLocation ? (
              <View style={styles.locationInfo}>
                <View style={styles.locationRow}>
                  <FontAwesomeIcon icon="map-pin" size={16} color={Colors.textSecondary} />
                  <Text style={styles.locationText}>
                    Latitude: {currentLocation.latitude.toFixed(6)}
                  </Text>
                </View>
                <View style={styles.locationRow}>
                  <FontAwesomeIcon icon="map-pin" size={16} color={Colors.textSecondary} />
                  <Text style={styles.locationText}>
                    Longitude: {currentLocation.longitude.toFixed(6)}
                  </Text>
                </View>
                <View style={styles.locationRow}>
                  <FontAwesomeIcon icon="crosshairs" size={16} color={Colors.textSecondary} />
                  <Text style={styles.locationText}>
                    Accuracy: {Math.round(currentLocation.accuracy)}m
                  </Text>
                </View>

                {validationResult && (
                  <View style={[
                    styles.validationContainer,
                    validationResult.isValid ? styles.validContainer : styles.invalidContainer
                  ]}>
                    <FontAwesomeIcon 
                      icon={validationResult.isValid ? "check-circle" : "exclamation-triangle"} 
                      size={20} 
                      color={validationResult.isValid ? Colors.success : Colors.error} 
                    />
                    <Text style={[
                      styles.validationText,
                      validationResult.isValid ? styles.validText : styles.invalidText
                    ]}>
                      {validationResult.message}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <FontAwesomeIcon icon="exclamation-circle" size={48} color={Colors.error} />
                <Text style={styles.errorText}>Unable to get location</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            {currentLocation && (!validationResult || validationResult.isValid) && (
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
              </TouchableOpacity>
            )}
            
            {currentLocation && validationResult && !validationResult.isValid && (
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 400,
    ...Shadow.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  content: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  locationInfo: {
    gap: Spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locationText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  validContainer: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
    borderWidth: 1,
  },
  invalidContainer: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
    borderWidth: 1,
  },
  validationText: {
    ...Typography.body,
    flex: 1,
  },
  validText: {
    color: Colors.success,
  },
  invalidText: {
    color: Colors.error,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  errorText: {
    ...Typography.h4,
    color: Colors.error,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  retryButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.warning,
    alignItems: 'center',
  },
  retryButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
});

export default LocationValidationModal;
