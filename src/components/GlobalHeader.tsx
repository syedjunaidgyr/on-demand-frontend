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
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  title,
  showBackButton = true,
  backgroundColor = Colors.primary,
  titleColor = Colors.white,
  onBackPress,
  rightComponent,
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
            {rightComponent || <View style={styles.headerSpacer} />}
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
});

export default GlobalHeader;
