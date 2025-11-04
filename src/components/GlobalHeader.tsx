import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  backButtonStyle?: any;
  headerStyle?: any;
  statusBarStyle?: 'light-content' | 'dark-content';
  statusBarBackgroundColor?: string;
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
  backButtonStyle,
  headerStyle,
  statusBarStyle,
  statusBarBackgroundColor,
}) => {
  const insets = useSafeAreaInsets();
  const computedTopPadding = Math.max(insets.top || 0, Platform.OS === 'android' ? 10 : 0);
  const resolvedStatusBarBg = statusBarBackgroundColor || backgroundColor;
  const resolvedBarStyle = statusBarStyle || (backgroundColor === '#FFFFFF' ? 'dark-content' : 'light-content');
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['top']}> 
      <StatusBar translucent={false} backgroundColor={resolvedStatusBarBg} barStyle={resolvedBarStyle} />
      <View style={[styles.header, headerStyle, { backgroundColor, paddingTop: computedTopPadding }]}>
        <View style={styles.headerContent}>
          {showBackButton && (
            <TouchableOpacity
              style={[styles.backButton, backButtonStyle]}
              onPress={onBackPress}>
              <FontAwesomeIcon icon="arrow-left" size={20} color={titleColor} />
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
    zIndex: 10,
  },
  header: {
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#d1d5db',
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
    minWidth: 40,
    alignItems: 'flex-end',
    flexDirection: 'row',
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
