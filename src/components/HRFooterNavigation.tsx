import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../utils/icons';
import { Typography } from '../constants/typography';
import Responsive from '../utils/responsive';
import { useAuth } from '../navigation/AppNavigator';
import { SkeletonFooter } from './SkeletonComponents';

interface HRFooterNavigationProps {
  activeRoute?: 'Dashboard' | 'Jobs' | 'Users';
  scrollY?: Animated.Value;
  todaysJobsCount?: number;
  isLoading?: boolean;
}

const HRFooterNavigation: React.FC<HRFooterNavigationProps> = ({ activeRoute, scrollY, todaysJobsCount, isLoading = false }) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollThreshold = 50;

  const handleNavigation = (target: 'home' | 'jobs' | 'users') => {
    // Map routes based on role
    const isAgency = user?.role === 'AGENCY';
    const isHealthcare = user?.role === 'DOCTOR' || user?.role === 'NURSE';
    let routeName = '';
    
    if (isHealthcare) {
      // Healthcare provider routes
      if (target === 'home') routeName = 'HealthcareProviderDashboard';
      else if (target === 'jobs') routeName = 'Assignments';
      else routeName = 'MyAssignments';
    } else if (isAgency) {
      // Agency routes
      if (target === 'home') routeName = 'AgencyDashboard';
      else if (target === 'jobs') routeName = 'AgencyJobs';
      else routeName = 'AgencyNurses';
    } else {
      // HR routes
      if (target === 'home') routeName = 'HRDashboard';
      else if (target === 'jobs') routeName = 'HRJobs';
      else routeName = 'HRUsers';
    }
    (navigation as any).navigate(routeName as never);
  };

  useEffect(() => {
    if (scrollY) {
      const listener = scrollY.addListener(({ value }) => {
        const currentScrollY = value;
        const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
        const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

        if (scrollDelta > 10) {
          if (scrollDirection === 'down' && currentScrollY > scrollThreshold) {
            // Scroll down - hide footer
            Animated.spring(translateY, {
              toValue: 150, // Move footer down out of view
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }).start();
          } else if (scrollDirection === 'up') {
            // Scroll up - show footer
            Animated.spring(translateY, {
              toValue: 0, // Move footer back to visible position
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }).start();
          }
        }

        lastScrollY.current = currentScrollY;
      });

      return () => scrollY.removeListener(listener);
    }
  }, [scrollY, translateY]);

  // Show skeleton if loading
  if (isLoading) {
    return <SkeletonFooter />;
  }

  return (
    <Animated.View style={[styles.floatingContainer, { transform: [{ translateY }] }]}>
      <View style={styles.footerWrapper}>
        <View style={styles.footerRow}>
          {/* Dashboard/Home - Left */}
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => handleNavigation('home')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <FontAwesomeIcon
                icon={(user?.role === 'DOCTOR' || user?.role === 'NURSE') ? "user-md" : "home"}
                size={Responsive.iconSize(24)}
                color="#FFFFFF"
              />
              <Text style={styles.label}>{(user?.role === 'DOCTOR' || user?.role === 'NURSE') ? 'Dashboard' : 'Home'}</Text>
            </View>
          </TouchableOpacity>

          {/* Job Assignments/Jobs - Center */}
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => handleNavigation('jobs')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <FontAwesomeIcon
                icon={(user?.role === 'DOCTOR' || user?.role === 'NURSE') ? "calendar-check" : "briefcase"}
                size={Responsive.iconSize(24)}
                color="#FFFFFF"
              />
              {activeRoute === 'Jobs' && typeof todaysJobsCount === 'number' && todaysJobsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{todaysJobsCount}</Text>
                </View>
              )}
              <Text style={styles.label}>{(user?.role === 'DOCTOR' || user?.role === 'NURSE') ? 'Job Assignments' : 'Jobs'}</Text>
            </View>
          </TouchableOpacity>

          {/* My Jobs/Users - Right */}
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => handleNavigation('users')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <FontAwesomeIcon
                icon={(user?.role === 'DOCTOR' || user?.role === 'NURSE') ? "clipboard-list" : (user?.role === 'AGENCY' ? "users" : "users")}
                size={Responsive.iconSize(24)}
                color="#FFFFFF"
              />
              <Text style={styles.label}>
                {(user?.role === 'DOCTOR' || user?.role === 'NURSE')
                  ? 'My Jobs'
                  : (user?.role === 'AGENCY')
                    ? 'Nurses'
                    : (user?.role === 'HOSPITAL_ADMIN')
                      ? 'Staff'
                      : 'Users'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Responsive.verticalScale(-60),
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  footerWrapper: {
    backgroundColor: '#1C2A3A',
    width: '100%',
    paddingBottom: Responsive.verticalScale(50),
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#1C2A3A',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: Responsive.verticalScale(4),
    paddingBottom: Responsive.verticalScale(10),
    paddingHorizontal: Responsive.scale(10),
    minHeight: Responsive.verticalScale(50),
  },
  footerButton: {
    padding: Responsive.scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: Responsive.verticalScale(4),
    fontSize: Responsive.fontSize(Typography.fontSize.xs - 1),
    fontFamily: Typography.fontFamily.regular,
    color: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: Responsive.verticalScale(-6),
    right: Responsive.scale(-10),
    backgroundColor: '#B71C1C',
    borderRadius: Responsive.scale(10),
    minWidth: Responsive.scale(20),
    height: Responsive.verticalScale(20),
    paddingHorizontal: Responsive.scale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: Responsive.fontSize(Typography.fontSize.xs - 2),
    fontFamily: Typography.fontFamily.bold,
  },
});

export default HRFooterNavigation;
