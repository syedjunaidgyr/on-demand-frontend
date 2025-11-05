import React, { createContext, useContext, useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme as NavDefaultTheme } from '@react-navigation/native';
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
import PermissionManagementScreen from '../screens/common/PermissionManagementScreen';
import SpecializationManagementScreen from '../screens/common/SpecializationManagementScreen';

// Agency Screens
import AgencyDashboardScreen from '../screens/agency/AgencyDashboardScreen';
import AgencyJobsScreen from '../screens/agency/AgencyJobsScreen';
import AgencyNursesScreen from '../screens/agency/AgencyNursesScreen';
import AgencyAssignNurseScreen from '../screens/agency/AgencyAssignNurseScreen';
import AgencyOnboardNursesScreen from '../screens/agency/AgencyOnboardNursesScreen';
import AgencyNurseDetailsScreen from '../screens/agency/AgencyNurseDetailsScreen';

// Hospital Admin Screens
import HospitalAdminDashboardScreen from '../screens/hospitalAdmin/HospitalAdminDashboardScreen';
import HospitalAdminJobsScreen from '../screens/hospitalAdmin/HospitalAdminJobsScreen';
import HospitalAdminStaffScreen from '../screens/hospitalAdmin/HospitalAdminStaffScreen';
import HospitalAdminUploadLogoScreen from '../screens/hospitalAdmin/HospitalAdminUploadLogoScreen';
import HospitalAdminThemeManageScreen from '../screens/hospitalAdmin/HospitalAdminThemeManageScreen';
import HospitalAdminUnitsScreen from '../screens/hospitalAdmin/HospitalAdminUnitsScreen';
import HospitalAdminAgencyBlacklistScreen from '../screens/hospitalAdmin/HospitalAdminAgencyBlacklistScreen';
import HospitalAdminHospitalScreen from '../screens/hospitalAdmin/HospitalAdminHospitalScreen';
import HospitalAdminCreateAgencyScreen from '../screens/hospitalAdmin/HospitalAdminCreateAgencyScreen';
import HospitalAdminOnboardAgencyScreen from '../screens/hospitalAdmin/HospitalAdminOnboardAgencyScreen';

// Admin Screens
import AdminHospitalManagementScreen from '../screens/admin/AdminHospitalManagementScreen';

// Test Components
import GeolocationTest from '../components/GeolocationTest';

import { Colors } from '../constants/colors';
import { User, Job, JobAssignment } from '../types';
import { setGlobalLogoutHandler } from '../services/api';
import { NotificationProvider, setGlobalRefreshNotifications } from '../contexts/NotificationContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { useAppColors } from '../hooks/useAppColors';

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
  AgencyOnboardNurses: undefined;
  AgencyNurseDetails: { userId: number };
  AgencyAssignNurse: { jobId: string; hourlyRate?: number; mode?: 'FULL' | 'PARTIAL' };
  HospitalAdminUploadLogo: undefined;
  HospitalAdminThemes: { hospitalId?: number } | undefined;
  HospitalAdminUnits: { hospitalId?: number } | undefined;
  HospitalAdminHospital: undefined;
  PermissionManagement: { initialTab?: 'permissions' | 'masters' | 'userPerms' | 'grants' | 'hospitalPerms' } | undefined;
  AgencyBlacklist: undefined;
  AdminHospitalManagement: undefined;
  SpecializationManagement: undefined;
  HospitalAdminCreateAgency: undefined;
  HospitalAdminOnboardAgency: undefined;
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
  AgencyDashboard: undefined;
  AgencyJobs: undefined;
  AgencyNurses: undefined;
  HospitalAdminDashboard: undefined;
  HospitalAdminJobs: undefined;
  HospitalAdminStaff: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const AuthNavigator = () => {
  const appColors = useAppColors();
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: appColors.background },
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
          display: 'none',
        },
        headerShown: false,
      })}>
      <MainTab.Screen name="HealthcareProviderDashboard" component={HealthcareProviderDashboardScreen} options={{ title: 'Dashboard' }} />
      <MainTab.Screen name="Assignments" component={AssignmentScreen} options={{ title: 'Job Assignments' }} />
      <MainTab.Screen name="MyAssignments" component={MyAssignmentsScreen} options={{ title: 'My Jobs' }} />
    </MainTab.Navigator>
  );
};

const AgencyTabNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'AgencyDashboard':
              iconName = 'home';
              break;
            case 'AgencyJobs':
              iconName = 'briefcase';
              break;
            case 'AgencyNurses':
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
      <MainTab.Screen name="AgencyDashboard" component={AgencyDashboardScreen} options={{ title: 'Dashboard' }} />
      <MainTab.Screen name="AgencyJobs" component={AgencyJobsScreen} options={{ title: 'Jobs' }} />
      <MainTab.Screen name="AgencyNurses" component={AgencyNursesScreen} options={{ title: 'Nurses' }} />
    </MainTab.Navigator>
  );
};

const HospitalAdminTabNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'HospitalAdminDashboard':
              iconName = 'home';
              break;
            case 'HospitalAdminJobs':
              iconName = 'briefcase';
              break;
            case 'HospitalAdminStaff':
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
      <MainTab.Screen name="HospitalAdminDashboard" component={HospitalAdminDashboardScreen} options={{ title: 'Dashboard' }} />
      <MainTab.Screen name="HospitalAdminJobs" component={HospitalAdminJobsScreen as any} options={{ title: 'Jobs' }} />
      <MainTab.Screen name="HospitalAdminStaff" component={HospitalAdminStaffScreen} options={{ title: 'Staff' }} />
    </MainTab.Navigator>
  );
};

const MainNavigator = ({ user }: { user: User }) => {
  const getTabNavigator = () => {
    switch (user.role) {
      case 'HR':
      case 'ADMIN':
        return <HRTabNavigator />;
      case 'HOSPITAL_ADMIN':
        return <HospitalAdminTabNavigator />;
      case 'AGENCY':
        return <AgencyTabNavigator />;
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

  const appColors = useAppColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: appColors.background },
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
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CheckInOut"
        component={CheckInOutScreen}
        options={{
          headerShown: false,
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
        name="AgencyAssignNurse"
        component={AgencyAssignNurseScreen}
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
      <Stack.Screen
        name="AgencyOnboardNurses"
        component={AgencyOnboardNursesScreen}
        options={{
          headerShown: true,
          title: 'Onboard Nurses',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      />
      <Stack.Screen
        name="AgencyNurseDetails"
        component={AgencyNurseDetailsScreen}
        options={{
          headerShown: true,
          title: 'Nurse Details',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      />

      <Stack.Screen
        name="HospitalAdminUploadLogo"
        component={HospitalAdminUploadLogoScreen}
        options={{
          headerShown: true,
          title: 'Upload Hospital Logo',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      />

      <Stack.Screen
        name="HospitalAdminThemes"
        component={HospitalAdminThemeManageScreen}
        options={{
          headerShown: true,
          title: 'Manage Themes',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      />

      <Stack.Screen
        name="HospitalAdminUnits"
        component={HospitalAdminUnitsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HospitalAdminHospital"
        component={HospitalAdminHospitalScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="PermissionManagement"
        component={PermissionManagementScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="AgencyBlacklist"
        component={HospitalAdminAgencyBlacklistScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HospitalAdminCreateAgency"
        component={HospitalAdminCreateAgencyScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HospitalAdminOnboardAgency"
        component={HospitalAdminOnboardAgencyScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AdminHospitalManagement"
        component={AdminHospitalManagementScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SpecializationManagement"
        component={SpecializationManagementScreen}
        options={{
          headerShown: false,
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

  // Watch for user changes and refresh notifications
  useEffect(() => {
    if (user && isAuthenticated) {
      // User logged in, refresh notifications
      setTimeout(() => {
        setGlobalRefreshNotifications(() => async () => {
          // This will be set by NotificationContext
        });
      }, 500);
    } else if (!isAuthenticated) {
      // User logged out, notifications will be cleared by NotificationContext
    }
  }, [user, isAuthenticated]);

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
  const { loadAndApplyDefaultTheme } = useTheme();
  const appColors = useAppColors();
  const navTheme = {
    ...NavDefaultTheme,
    colors: {
      ...NavDefaultTheme.colors,
      primary: appColors.primary,
      background: appColors.background,
      card: '#FFFFFF',
      text: appColors.textPrimary,
      border: appColors.border,
      notification: appColors.primary,
    },
  } as const;

  React.useEffect(() => {
    if (isAuthenticated && user && (user as any).role === 'HOSPITAL_ADMIN') {
      loadAndApplyDefaultTheme().catch(() => { });
    }
  }, [isAuthenticated, user, loadAndApplyDefaultTheme]);

  return (
    <NavigationContainer theme={navTheme}>
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
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </NotificationProvider>
  </AuthProvider>
);

export default AppNavigatorWithAuth;
