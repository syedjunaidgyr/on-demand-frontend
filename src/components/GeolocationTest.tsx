import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { FontAwesomeIcon } from '../utils/icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../constants/spacing';

const GeolocationTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('Unknown');

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      // Try to get current position with a very short timeout to check permission
      Geolocation.getCurrentPosition(
        (position) => {
          setPermissionStatus('Granted');
          setLocationData(position);
        },
        (error) => {
          if (error.code === 1) {
            setPermissionStatus('Denied');
          } else if (error.code === 2) {
            setPermissionStatus('Unavailable');
          } else {
            setPermissionStatus('Error: ' + error.message);
          }
        },
        { timeout: 1000, maximumAge: 0 }
      );
    } catch (err) {
      setPermissionStatus('Error: ' + (err as any).message);
    }
  };

  const testGeolocation = () => {
    setIsLoading(true);
    setError(null);
    setLocationData(null);

    try {
      // Configure geolocation
      Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: 'whenInUse',
        enableBackgroundLocationUpdates: false,
        locationProvider: 'auto',
      });

      // Request permission first
      Geolocation.requestAuthorization(
        () => {
          console.log('✅ Permission granted');
          setPermissionStatus('Granted');
          getCurrentLocation();
        },
        (error) => {
          console.log('❌ Permission denied:', error);
          setPermissionStatus('Denied: ' + error.message);
          setError('Permission denied: ' + error.message);
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.log('❌ Geolocation error:', err);
      setError('Geolocation error: ' + (err as any).message);
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    const options = {
      enableHighAccuracy: false, // Use network/cell tower location (faster, more reliable)
      timeout: 15000, // 15 seconds timeout
      maximumAge: 300000, // 5 minutes - use cached location if recent
    };

    Geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Location received:', position);
        setLocationData(position);
        setError(null);
        setIsLoading(false);
      },
      (error) => {
        console.log('❌ Location error:', error);
        let errorMessage = '';
        
        switch (error.code) {
          case 1:
            errorMessage = 'Permission denied - Please enable location access in settings';
            break;
          case 2:
            errorMessage = 'Location unavailable - Please check your GPS settings and try again';
            break;
          case 3:
            errorMessage = 'Location timeout - Please try again in a better location';
            break;
          default:
            errorMessage = `Location error: ${error.message}`;
        }
        
        setError(errorMessage);
        setIsLoading(false);
      },
      options
    );
  };

  const testWatchPosition = () => {
    setIsLoading(true);
    setError(null);

    const watchId = Geolocation.watchPosition(
      (position) => {
        console.log('📍 Watch position update:', position);
        setLocationData(position);
        setError(null);
        setIsLoading(false);
      },
      (error) => {
        console.log('❌ Watch position error:', error);
        setError('Watch position error: ' + error.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
        distanceFilter: 10,
      }
    );

    // Stop watching after 10 seconds
    setTimeout(() => {
      Geolocation.clearWatch(watchId);
      console.log('🛑 Stopped watching position');
    }, 10000);
  };

  const formatLocationData = (data: any) => {
    if (!data) return 'No location data';
    
    return {
      latitude: data.coords.latitude.toFixed(6),
      longitude: data.coords.longitude.toFixed(6),
      accuracy: Math.round(data.coords.accuracy) + 'm',
      altitude: data.coords.altitude ? Math.round(data.coords.altitude) + 'm' : 'N/A',
      speed: data.coords.speed ? Math.round(data.coords.speed * 3.6) + ' km/h' : 'N/A',
      timestamp: new Date(data.timestamp).toLocaleString(),
    };
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <FontAwesomeIcon icon="map-marker-alt" size={24} color={Colors.primary} />
        <Text style={styles.title}>Geolocation Test</Text>
      </View>

      <View style={styles.content}>
        {/* Permission Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permission Status</Text>
          <View style={[
            styles.statusContainer,
            permissionStatus === 'Granted' ? styles.successStatus : styles.errorStatus
          ]}>
            <FontAwesomeIcon 
              icon={permissionStatus === 'Granted' ? 'check-circle' : 'exclamation-triangle'} 
              size={16} 
              color={permissionStatus === 'Granted' ? Colors.success : Colors.error} 
            />
            <Text style={styles.statusText}>{permissionStatus}</Text>
          </View>
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Functions</Text>
          
          <TouchableOpacity 
            style={[styles.testButton, styles.primaryButton]} 
            onPress={testGeolocation}
            disabled={isLoading}
          >
            <FontAwesomeIcon icon="map-marker-alt" size={16} color={Colors.white} />
            <Text style={styles.buttonText}>Test Current Location</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, styles.secondaryButton]} 
            onPress={testWatchPosition}
            disabled={isLoading}
          >
            <FontAwesomeIcon icon="eye" size={16} color={Colors.primary} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Test Watch Position</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, styles.infoButton]} 
            onPress={checkPermissionStatus}
          >
            <FontAwesomeIcon icon="info-circle" size={16} color={Colors.white} />
            <Text style={styles.buttonText}>Check Permission</Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Getting location...</Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <FontAwesomeIcon icon="exclamation-triangle" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Location Data Display */}
        {locationData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Data</Text>
            <View style={styles.dataContainer}>
              {Object.entries(formatLocationData(locationData)).map(([key, value]) => (
                <View key={key} style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                  <Text style={styles.dataValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Package Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Information</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Package: @react-native-community/geolocation</Text>
            <Text style={styles.infoText}>Status: {Geolocation ? '✅ Loaded' : '❌ Not loaded'}</Text>
            <Text style={styles.infoText}>Methods Available: {Object.keys(Geolocation).join(', ')}</Text>
          </View>
        </View>

        {/* Troubleshooting Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Troubleshooting Tips</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>• Make sure location services are enabled</Text>
            <Text style={styles.infoText}>• Try going outside for better GPS signal</Text>
            <Text style={styles.infoText}>• Check if location permission is granted</Text>
            <Text style={styles.infoText}>• Restart the app if location is stuck</Text>
            <Text style={styles.infoText}>• Test on a real device (not simulator)</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.textStyles.header,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.textStyles.title,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  successStatus: {
    backgroundColor: Colors.success + '20',
    borderColor: Colors.success,
    borderWidth: 1,
  },
  errorStatus: {
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error,
    borderWidth: 1,
  },
  statusText: {
    ...Typography.textStyles.body,
    color: Colors.textPrimary,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  infoButton: {
    backgroundColor: Colors.info,
  },
  buttonText: {
    ...Typography.textStyles.button,
    color: Colors.white,
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.textStyles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.error + '20',
    borderRadius: BorderRadius.md,
    borderColor: Colors.error,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.textStyles.body,
    color: Colors.error,
    flex: 1,
  },
  dataContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dataLabel: {
    ...Typography.textStyles.body,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  dataValue: {
    ...Typography.textStyles.body,
    color: Colors.textPrimary,
  },
  infoContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  infoText: {
    ...Typography.textStyles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
});

export default GeolocationTest;
