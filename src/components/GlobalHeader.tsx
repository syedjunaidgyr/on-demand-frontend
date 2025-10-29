import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { FontAwesomeIcon } from '../utils/icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface GlobalHeaderProps {
  title: string;
  showBackButton?: boolean;
  backgroundColor?: string;
  titleColor?: string;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showNotificationIcon?: boolean;
  notificationCount?: number;
  onNotificationPress?: () => void;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  title,
  showBackButton = true,
  backgroundColor = Colors.primary,
  titleColor = Colors.white,
  onBackPress,
  rightComponent,
  showNotificationIcon = false,
  notificationCount = 0,
  onNotificationPress,
}) => {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor }]}>
        <View style={styles.headerContent}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}>
              <FontAwesomeIcon icon="arrow-left" size={24} color={titleColor} />
            </TouchableOpacity>
          )}
          
          <Text style={[styles.headerTitle, { color: titleColor }]}>
            {title}
          </Text>
          
          <View style={styles.rightSection}>
            {showNotificationIcon ? (
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={onNotificationPress}>
                <FontAwesomeIcon icon="bell" size={22} color={titleColor} />
                {notificationCount > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : rightComponent ? (
              rightComponent
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    paddingTop: 0,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
    flex: 1,
    textAlign: 'center',
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerSpacer: {
    width: 40,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
  },
});

export default GlobalHeader;
