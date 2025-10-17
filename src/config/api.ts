import { Platform } from 'react-native';

// Get your computer's IP address for physical device testing
// Run: ifconfig | grep "inet " | grep -v 127.0.0.1
// Or: ipconfig getifaddr en0 (on macOS)

// Configuration for different environments
const API_CONFIG = {
  // For Android emulator
  EMULATOR: 'http://192.168.1.79:3000/api/v1',
  
  // For iOS simulator
  SIMULATOR: 'http://192.168.1.79:3000/api/v1',
  
  // For physical device - REPLACE WITH YOUR COMPUTER'S IP ADDRESS
  // Example: 'http://192.168.1.100:3000/api/v1'
  PHYSICAL_DEVICE: 'http://192.168.1.79:3000/api/v1', // Your actual IP
  
  // Production URL (when you deploy your backend)
  PRODUCTION: 'https://192.168.1.79:3000/api/v1',
};

// Auto-detect the best URL based on platform and environment
const getApiUrl = (): string => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // For Android, we'll use emulator URL by default
      // You can change this to PHYSICAL_DEVICE if testing on real device
      return API_CONFIG.EMULATOR;
    } else {
      // iOS simulator
      return API_CONFIG.SIMULATOR;
    }
  } else {
    // Production mode
    return API_CONFIG.PRODUCTION;
  }
};

export const API_BASE_URL = getApiUrl();

// Helper function to get your computer's IP address
export const getComputerIP = (): string => {
  // This is a placeholder - you need to manually set your IP
  // To find your IP:
  // macOS: ifconfig | grep "inet " | grep -v 127.0.0.1
  // Windows: ipconfig
  // Linux: hostname -I
  return '192.168.1.79'; // Your actual IP
};

// Manual override for testing on physical device
export const FORCE_PHYSICAL_DEVICE = true; // Set to true when testing on real device

export const getFinalApiUrl = (): string => {
  if (FORCE_PHYSICAL_DEVICE && __DEV__) {
    return `http://192.168.1.79:3000/api/v1`;
  }
  return API_BASE_URL;
};

console.log('🌐 API Base URL:', getFinalApiUrl());
console.log('📱 Platform:', Platform.OS);
console.log('🔧 Development Mode:', __DEV__);
