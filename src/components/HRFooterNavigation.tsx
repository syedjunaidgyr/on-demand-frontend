import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../utils/icons';

interface HRFooterNavigationProps {
  activeRoute?: 'Dashboard' | 'Jobs' | 'Users' | 'Reports';
}

const HRFooterNavigation: React.FC<HRFooterNavigationProps> = ({ activeRoute }) => {
  const navigation = useNavigation();

  const handleNavigation = (route: string) => {
    (navigation as any).navigate(route);
  };

  return (
    <View style={styles.floatingContainer}>
      <View style={styles.footerRow}>
        {/* Dashboard */}
        <TouchableOpacity
          style={[
            styles.footerButton,
            activeRoute === 'Dashboard' && styles.activeButton
          ]}
          onPress={() => handleNavigation('HRDashboard')}
          activeOpacity={0.8}
        >
          <FontAwesomeIcon
            icon="home"
            size={20}
            color={activeRoute === 'Dashboard' ? '#FFFFFF' : '#9CA3AF'}
          />
          <Text style={[
            styles.labelText,
            activeRoute === 'Dashboard' && styles.activeLabelText
          ]}>Dashboard</Text>
        </TouchableOpacity>

        {/* Jobs */}
        <TouchableOpacity
          style={[
            styles.footerButton,
            activeRoute === 'Jobs' && styles.activeButton
          ]}
          onPress={() => handleNavigation('HRJobs')}
          activeOpacity={0.8}
        >
          <FontAwesomeIcon
            icon="briefcase"
            size={20}
            color={activeRoute === 'Jobs' ? '#FFFFFF' : '#9CA3AF'}
          />
          <Text style={[
            styles.labelText,
            activeRoute === 'Jobs' && styles.activeLabelText
          ]}>Jobs</Text>
        </TouchableOpacity>

        {/* Users */}
        <TouchableOpacity
          style={[
            styles.footerButton,
            activeRoute === 'Users' && styles.activeButton
          ]}
          onPress={() => handleNavigation('HRUsers')}
          activeOpacity={0.8}
        >
          <FontAwesomeIcon
            icon="users"
            size={20}
            color={activeRoute === 'Users' ? '#FFFFFF' : '#9CA3AF'}
          />
          <Text style={[
            styles.labelText,
            activeRoute === 'Users' && styles.activeLabelText
          ]}>Users</Text>
        </TouchableOpacity>

        {/* Reports */}
        <TouchableOpacity
          style={[
            styles.footerButton,
            activeRoute === 'Reports' && styles.activeButton
          ]}
          onPress={() => handleNavigation('Reports')}
          activeOpacity={0.8}
        >
          <FontAwesomeIcon
            icon="file-alt"
            size={20}
            color={activeRoute === 'Reports' ? '#FFFFFF' : '#9CA3AF'}
          />
          <Text style={[
            styles.labelText,
            activeRoute === 'Reports' && styles.activeLabelText
          ]}>Reports</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C2A3A',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  footerButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  activeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  labelText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeLabelText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default HRFooterNavigation;
