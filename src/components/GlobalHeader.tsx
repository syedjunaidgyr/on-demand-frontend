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
import { Spacing } from '../constants/spacing';

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
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
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
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
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
