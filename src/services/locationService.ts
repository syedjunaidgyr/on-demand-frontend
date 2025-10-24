import Geolocation from '@react-native-community/geolocation';
import { Alert, Linking, Platform } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

export interface LocationError {
  code: number;
  message: string;
}

class LocationService {
  private static instance: LocationService;
  private isLocationEnabled: boolean = false;

  private constructor() {
    this.configureGeolocation();
  }

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  private configureGeolocation(): void {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      enableBackgroundLocationUpdates: false,
      locationProvider: 'auto',
    });
  }

  /**
   * Request location permission from user
   */
  public async requestLocationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      Geolocation.requestAuthorization(
        () => {
          this.isLocationEnabled = true;
          resolve(true);
        },
        (error) => {
          console.error('Location permission denied:', error);
          this.isLocationEnabled = false;
          this.showLocationPermissionAlert();
          resolve(false);
        }
      );
    });
  }

  /**
   * Get current location with high accuracy
   */
  public async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!this.isLocationEnabled) {
        reject(new Error('Location permission not granted'));
        return;
      }

      const options = {
        enableHighAccuracy: false, // Use network/cell towers for faster location
        timeout: 15000, // 15 seconds
        maximumAge: 300000, // 5 minutes - use cached location if recent
      };

      Geolocation.getCurrentPosition(
        (position) => {
          console.log('🔧 LocationService getCurrentPosition success:', position);
          console.log('📍 GPS latitude:', position.coords.latitude);
          console.log('📍 GPS longitude:', position.coords.longitude);
          console.log('📍 GPS accuracy:', position.coords.accuracy);
          
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          console.log('🔧 LocationService returning locationData:', locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('Location error:', error);
          this.handleLocationError(error);
          reject(error);
        },
        options
      );
    });
  }

  /**
   * Get location with retry mechanism
   */
  public async getCurrentLocationWithRetry(maxRetries: number = 3): Promise<LocationData> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const location = await this.getCurrentLocation();
        return location;
      } catch (error) {
        lastError = error;
        console.log(`Location attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait 2 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError;
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  public calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Validate if user is within acceptable distance from job location
   */
  public validateLocation(
    currentLocation: LocationData,
    jobLocation: { latitude: number; longitude: number },
    maxDistanceMeters: number = 500
  ): { isValid: boolean; distance: number; message: string } {
    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      jobLocation.latitude,
      jobLocation.longitude
    );

    const isValid = distance <= maxDistanceMeters;
    const message = isValid
      ? `You are ${Math.round(distance)}m from the job location.`
      : `You are ${Math.round(distance)}m from the job location. Please move closer (within ${maxDistanceMeters}m).`;

    return {
      isValid,
      distance,
      message,
    };
  }

  /**
   * Handle location errors and show appropriate messages
   */
  private handleLocationError(error: LocationError): void {
    let message = 'Unable to get your location. ';
    
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        message += 'Location permission denied. Please enable location access in settings.';
        this.showLocationPermissionAlert();
        break;
      case 2: // POSITION_UNAVAILABLE
        message += 'Location is currently unavailable. Please check your GPS settings.';
        break;
      case 3: // TIMEOUT
        message += 'Location request timed out. Please try again.';
        break;
      default:
        message += 'An unknown error occurred while getting location.';
    }

    Alert.alert('Location Error', message);
  }

  /**
   * Show alert to guide user to enable location permission
   */
  private showLocationPermissionAlert(): void {
    Alert.alert(
      'Location Permission Required',
      'This app needs location access to verify your check-in/check-out location. Please enable location permission in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  }

  /**
   * Check if location services are enabled
   */
  public isLocationPermissionGranted(): boolean {
    return this.isLocationEnabled;
  }

  /**
   * Get formatted address from coordinates (placeholder - you can integrate with reverse geocoding service)
   */
  public async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    // This is a placeholder. You can integrate with Google Maps API, OpenStreetMap, or other geocoding services
    return `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}

export default LocationService;
