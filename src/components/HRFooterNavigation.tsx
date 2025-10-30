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

interface HRFooterNavigationProps {
  activeRoute?: 'Dashboard' | 'Jobs' | 'Users';
  scrollY?: Animated.Value;
}

const HRFooterNavigation: React.FC<HRFooterNavigationProps> = ({ activeRoute, scrollY }) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollThreshold = 50;

  const handleNavigation = (target: 'home' | 'jobs' | 'users') => {
    // Map routes based on role
    const isAgency = user?.role === 'AGENCY';
    let routeName = '';
    if (target === 'home') routeName = isAgency ? 'AgencyDashboard' : 'HRDashboard';
    else if (target === 'jobs') routeName = isAgency ? 'AgencyJobs' : 'HRJobs';
    else routeName = isAgency ? 'AgencyNurses' : 'HRUsers';
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

  return (
    <Animated.View style={[styles.floatingContainer, { transform: [{ translateY }] }]}>
      <View style={styles.footerWrapper}>
        <View style={styles.footerRow}>
          {/* Home - Left */}
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => handleNavigation('home')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <FontAwesomeIcon
                icon="home"
                size={Responsive.iconSize(24)}
                color="#FFFFFF"
              />
              <Text style={styles.label}>Home</Text>
            </View>
          </TouchableOpacity>

          {/* Jobs - Center */}
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => handleNavigation('jobs')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <FontAwesomeIcon
                icon="briefcase"
                size={Responsive.iconSize(24)}
                color="#FFFFFF"
              />
              {activeRoute === 'Jobs' && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>2</Text>
                </View>
              )}
              <Text style={styles.label}>Jobs</Text>
            </View>
          </TouchableOpacity>

          {/* Users - Right */}
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => handleNavigation('users')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <FontAwesomeIcon
                icon="users"
                size={Responsive.iconSize(24)}
                color="#FFFFFF"
              />
              <Text style={styles.label}>{user?.role === 'AGENCY' ? 'Nurses' : 'Users'}</Text>
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
