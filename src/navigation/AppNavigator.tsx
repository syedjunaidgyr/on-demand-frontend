import React, { createContext, useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '../utils/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// HR Screens
import HRDashboardScreen from '../screens/hr/HRDashboardScreen';
import HRJobsScreen from '../screens/hr/HRJobsScreen';
import HRUsersScreen from '../screens/hr/HRUsersScreen';
import ReportsScreen from '../screens/hr/ReportsScreen';
import ReportDetailsScreen from '../screens/hr/ReportDetailsScreen';
import CreateJobScreen from '../screens/hr/CreateJobScreen';
import JobAssignmentScreen from '../screens/hr/JobAssignmentScreen';

// Healthcare Provider Screens (Unified)
import HealthcareProviderDashboardScreen from '../screens/healthcare/HealthcareProviderDashboardScreen';
import AssignmentScreen from '../screens/healthcare/AssignmentScreen';
import AssignmentDetailsScreen from '../screens/healthcare/AssignmentDetailsScreen';
import MyAssignmentsScreen from '../screens/healthcare/MyAssignmentsScreen';
import CheckInOutScreen from '../screens/healthcare/CheckInOutScreen';
import QRScannerScreen from '../screens/healthcare/QRScannerScreen';
import QRCodeDisplayScreen from '../screens/healthcare/QRCodeDisplayScreen';

// Common Screens
import ProfileScreen from '../screens/common/ProfileScreen';
import ProfileSettingsScreen from '../screens/common/ProfileSettingsScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';
import ChangePasswordScreen from '../screens/common/ChangePasswordScreen';
import JobDetailsCommonScreen from '../screens/common/JobDetailsCommonScreen';
import PDFViewerScreen from '../screens/common/PDFViewerScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';

// Test Components
import GeolocationTest from '../components/GeolocationTest';

import { Colors } from '../constants/colors';
import { User, Job, JobAssignment } from '../types';
import { setGlobalLogoutHandler } from '../services/api';
import { NotificationProvider } from '../contexts/NotificationContext';

// Authentication Context
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Profile: undefined;
  ProfileSettings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  JobDetails: { jobId?: string; job?: Job };
  CreateJob: undefined;
  CheckInOut: { assignmentId?: string; scannedQRData?: string; scannedAction?: 'checkin' | 'checkout' };
  JobAssignment: { jobId: string };
  AssignmentDetails: { assignmentId: string };
  QRScanner: { assignmentId: string; action: 'checkin' | 'checkout' };
  QRCodeDisplay: { assignment: JobAssignment; action: 'checkin' | 'checkout' };
  Reports: undefined;
  ReportDetails: { reportId: number };
  PDFViewer: { uri: string; title?: string };
  GeolocationTest: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HRDashboard: undefined;
  HealthcareProviderDashboard: undefined;
  HRJobs: undefined;
  HRUsers: undefined;
  Assignments: undefined;
  MyAssignments: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

const HRTabNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'HRDashboard':
              iconName = 'home';
              break;
            case 'HRJobs':
              iconName = 'briefcase';
              break;
            case 'HRUsers':
              iconName = 'users';
              break;
            default:
              iconName = 'question';
          }

          return <FontAwesomeIcon icon={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          display: 'none',
        },
        headerShown: false,
      })}>
      <MainTab.Screen name="HRDashboard" component={HRDashboardScreen} options={{ title: 'Dashboard' }} />
      <MainTab.Screen name="HRJobs" component={HRJobsScreen} options={{ title: 'Jobs' }} />
      <MainTab.Screen name="HRUsers" component={HRUsersScreen} options={{ title: 'Users' }} />
    </MainTab.Navigator>
  );
};

const HealthcareProviderTabNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'HealthcareProviderDashboard':
              iconName = 'user-md';
              break;
            case 'Assignments':
              iconName = 'user-check';
              break;
            case 'MyAssignments':
              iconName = 'clipboard-list';
              break;
            default:
              iconName = 'question';
          }

          return <FontAwesomeIcon icon={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}>
      <MainTab.Screen name="HealthcareProviderDashboard" component={HealthcareProviderDashboardScreen} options={{ title: 'Dashboard' }} />
      <MainTab.Screen name="Assignments" component={AssignmentScreen} options={{ title: 'Job Assignments' }} />
      <MainTab.Screen name="MyAssignments" component={MyAssignmentsScreen} options={{ title: 'My Jobs' }} />
    </MainTab.Navigator>
  );
};

const MainNavigator = ({ user }: { user: User }) => {
  const getTabNavigator = () => {
    switch (user.role) {
      case 'HR':
      case 'ADMIN':
        return <HRTabNavigator />;
      case 'DOCTOR':
      case 'NURSE':
        return <HealthcareProviderTabNavigator />;
      default:
        return <HRTabNavigator />;
    }
  };

  // Create a proper component for the Main screen
  const MainScreen = () => {
    return getTabNavigator();
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}>
      <Stack.Screen name="Main" component={MainScreen} />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ProfileSettings" 
        component={ProfileSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="JobDetails" 
        component={JobDetailsCommonScreen}
        options={{
          headerShown: true,
          title: 'Job Details',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      />
      <Stack.Screen 
        name="CreateJob" 
        component={CreateJobScreen}
        options={{
          headerShown: true,
          title: 'Create Job',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      />
      <Stack.Screen 
        name="CheckInOut" 
        component={CheckInOutScreen}
        options={{
          headerShown: true,
          title: 'Check In/Out',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      />
      <Stack.Screen 
        name="JobAssignment" 
        component={JobAssignmentScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="AssignmentDetails" 
        component={AssignmentDetailsScreen}
        options={{
          headerShown: true,
          title: 'Assignment Details',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      />
      <Stack.Screen 
        name="QRScanner" 
        component={QRScannerScreen}
        options={{
          headerShown: false, // We handle our own header in the scanner
          title: 'QR Scanner',
        }}
      />
      <Stack.Screen 
        name="QRCodeDisplay" 
        component={QRCodeDisplayScreen}
        options={{
          headerShown: false, // We handle our own header
          title: 'QR Code Display',
        }}
      />
      <Stack.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ReportDetails" 
        component={ReportDetailsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="PDFViewer" 
        component={PDFViewerScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="GeolocationTest" 
        component={GeolocationTest}
        options={{
          headerShown: true,
          title: 'Geolocation Test',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      />
    </Stack.Navigator>
  );
};

// AuthProvider Component
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    
    // Register global logout handler for API service
    setGlobalLogoutHandler(logout);
    
    // Cleanup function
    return () => {
      setGlobalLogoutHandler(() => Promise.resolve());
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if user is logged in
      const token = await AsyncStorage.getItem('jwt_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
        console.log('✅ User found in storage:', JSON.parse(userData));
      } else {
        console.log('❌ No user found in storage');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    console.log('✅ User logged in via context:', userData);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['jwt_token', 'user_data', 'user_role']);
    setUser(null);
    setIsAuthenticated(false);
    console.log('✅ User logged out');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <NavigationContainer>
      {isLoading ? (
        // You can add a loading screen here
        null
      ) : isAuthenticated && user ? (
        <MainNavigator user={user} />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

// Main export with AuthProvider and NotificationProvider wrapper
const AppNavigatorWithAuth = () => (
  <AuthProvider>
    <NotificationProvider>
      <AppNavigator />
    </NotificationProvider>
  </AuthProvider>
);

export default AppNavigatorWithAuth;
