import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../utils/icons';

interface HRFooterNavigationProps {
  activeRoute?: 'Dashboard' | 'Jobs' | 'Users'; // | 'Reports';
  scrollY?: Animated.Value; // Add scroll position for transparency
}

const HRFooterNavigation: React.FC<HRFooterNavigationProps> = ({ activeRoute, scrollY }) => {
  const navigation = useNavigation();
  const lastScrollY = useRef(0);
  const opacityValue = useRef(new Animated.Value(1)).current;

  const handleNavigation = (route: string) => {
    (navigation as any).navigate(route);
  };

  useEffect(() => {
    if (scrollY) {
      const listener = scrollY.addListener(({ value }) => {
        const currentScrollY = value;
        const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
        
        if (scrollDirection === 'down' && currentScrollY > 50) {
          // Scrolling down - fade out
          Animated.timing(opacityValue, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (scrollDirection === 'up' || currentScrollY < 50) {
          // Scrolling up or near top - show fully
          Animated.timing(opacityValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
        
        lastScrollY.current = currentScrollY;
      });

      return () => scrollY.removeListener(listener);
    }
  }, [scrollY, opacityValue]);

  const animatedOpacity = scrollY ? opacityValue : new Animated.Value(1);

  return (
    <Animated.View style={[styles.floatingContainer, { opacity: animatedOpacity }]}>
      <View style={styles.footerRow}>
        {/* Dashboard - Mail Icon */}
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => handleNavigation('HRDashboard')}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrapper}>
            <FontAwesomeIcon
              icon="envelope"
              size={28}
              color="#4A4A4A"
            />
            {/* Badge */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>99+</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Jobs - Message Icon */}
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => handleNavigation('HRJobs')}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrapper}>
            <FontAwesomeIcon
              icon="comment"
              size={28}
              color="#4A4A4A"
            />
            {/* Badge */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Users - Video Icon */}
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => handleNavigation('HRUsers')}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrapper}>
            <FontAwesomeIcon
              icon="video"
              size={28}
              color="#4A4A4A"
            />
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: 'box-none',
    zIndex: 1000,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F5E6D3',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  footerButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#B71C1C',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default HRFooterNavigation;
