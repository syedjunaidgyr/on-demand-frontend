import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';

import { Typography } from '../../constants/typography';

const ProfileSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isVerySmallScreen = screenHeight < 600;

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <GlobalHeader
        title="Settings"
        showBackButton={true}
        backgroundColor="#1C2A3A"
        titleColor="#FFFFFF"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}>

        {/* All Settings in One Card */}
        <View style={styles.section}>
          <View style={styles.actionsCard}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('EditProfile')}>
              <View style={styles.actionIcon}>
                <FontAwesomeIcon icon="edit" size={17} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Edit Profile</Text>
              <FontAwesomeIcon icon="arrow-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ChangePassword')}>
              <View style={styles.actionIcon}>
                <FontAwesomeIcon icon="lock" size={18} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Change Password</Text>
              <FontAwesomeIcon icon="arrow-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <FontAwesomeIcon icon="bell" size={17} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Notifications</Text>
              <FontAwesomeIcon icon="arrow-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <FontAwesomeIcon icon="shield-alt" size={17} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Privacy & Security</Text>
              <FontAwesomeIcon icon="arrow-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <FontAwesomeIcon icon="cog" size={17} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Preferences</Text>
              <FontAwesomeIcon icon="arrow-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <FontAwesomeIcon icon="question" size={17} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Help Center</Text>
              <FontAwesomeIcon icon="arrow-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <FontAwesomeIcon icon="envelope" size={17} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Contact Support</Text>
              <FontAwesomeIcon icon="arrow-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Powered By Section */}
        <View style={styles.poweredByContainer}>
          <Text style={styles.poweredByText}>Powered by</Text>
          <Image
            source={require('../../assets/footer_logo.png')}
            style={styles.companyLogo}
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flex: 1,
    marginTop: -5,
    backgroundColor: '#FFFFFF',
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1C2A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Typography.fontFamily.medium,
    color: '#111827',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 80,
  },
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 10,
    marginTop: 160,
  },
  poweredByText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280',
    marginRight: -25,
  },
  companyLogo: {
    height: 15,
    width: 95,
  },
});

export default ProfileSettingsScreen;
