import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';
import { useAuth } from '../../navigation/AppNavigator';
import HospitalAdminApi from '../../services/hospitalAdminApi';
import { useTheme } from '../../contexts/ThemeContext';

import { Typography } from '../../constants/typography';
import Responsive from '../../utils/responsive';
import { useGlobalStyles } from '../../theme/globalStyles';

const ProfileSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const g = useGlobalStyles();
  const { user } = useAuth();
  const { loadAndApplyDefaultTheme } = useTheme();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isVerySmallScreen = screenHeight < 600;
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN';
  const [themes, setThemes] = useState<any>(null);
  const [loadingThemes, setLoadingThemes] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState<string | null>(null);

  useEffect(() => {
    if (isHospitalAdmin) {
      loadThemes();
    }
  }, [isHospitalAdmin]);

  const loadThemes = async () => {
    try {
      setLoadingThemes(true);
      const res = await HospitalAdminApi.getThemes();
      setThemes(res);
      const current = res?.current;
      setCurrentThemeId(current ? (current.id || current) : null);
    } catch (e) {
      console.error('Failed to load themes:', e);
    } finally {
      setLoadingThemes(false);
    }
  };

  const handleThemeSelect = async (themeId: string) => {
    try {
      await HospitalAdminApi.setDefaultTheme(themeId);
      await loadAndApplyDefaultTheme();
      await loadThemes();
      Alert.alert('Success', 'Theme updated successfully');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to set theme');
    }
  };

  return (
    <SafeAreaView style={g.appBackground}>
      {/* Header with Back Button */}
      <GlobalHeader
        title="Settings"
        showBackButton={true}
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}
        backButtonStyle={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#d1d5db' }}
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
                <FontAwesomeIcon icon="edit" size={Responsive.iconSize(17)} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Edit Profile</Text>
              <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(16)} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ChangePassword')}>
              <View style={styles.actionIcon}>
                <FontAwesomeIcon icon="lock" size={Responsive.iconSize(18)} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Change Password</Text>
              <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(16)} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <FontAwesomeIcon icon="bell" size={17} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Notifications</Text>
              <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(16)} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <FontAwesomeIcon icon="shield-alt" size={17} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Privacy & Security</Text>
              <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(16)} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <FontAwesomeIcon icon="cog" size={17} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Preferences</Text>
              <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(16)} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <FontAwesomeIcon icon="question" size={17} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Help Center</Text>
              <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(16)} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <FontAwesomeIcon icon="envelope" size={17} color="#1C2A3A" />
              </View>
              <Text style={styles.actionButtonText}>Contact Support</Text>
              <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(16)} color="#9CA3AF" />
            </TouchableOpacity>

            {isHospitalAdmin && (
              <>
                <View style={styles.actionDivider} />

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('HospitalAdminThemes')}>
                  <View style={styles.actionIcon}>
                    <FontAwesomeIcon icon="palette" size={17} color="#1C2A3A" />
                  </View>
                  <Text style={styles.actionButtonText}>Manage Themes</Text>
                  <FontAwesomeIcon icon="arrow-right" size={Responsive.iconSize(16)} color="#9CA3AF" />
                </TouchableOpacity>
              </>
            )}

            {isHospitalAdmin && themes && (
              <>
                <View style={styles.actionDivider} />
                <View style={styles.themeSection}>
                  <View style={styles.themeSectionHeader}>
                    <Text style={styles.themeSectionTitle}>Select Theme</Text>
                    {loadingThemes && <ActivityIndicator size="small" color="#6366F1" />}
                  </View>
                  {(themes?.themes || themes || []).map((theme: any) => {
                    const themeId = theme.id || theme.name;
                    const isCurrent = currentThemeId === themeId;
                    return (
                      <TouchableOpacity
                        key={themeId}
                        style={[styles.themeOption, isCurrent && styles.themeOptionActive]}
                        onPress={() => handleThemeSelect(themeId)}
                        disabled={isCurrent}>
                        <View style={[styles.themeColorDot, { backgroundColor: theme.primaryColor || theme.color || '#3B82F6' }]} />
                        <Text style={[styles.themeOptionText, isCurrent && styles.themeOptionTextActive]}>
                          {theme.name || themeId}
                        </Text>
                        {isCurrent && (
                          <FontAwesomeIcon icon="check-circle" size={Responsive.iconSize(18)} color="#6366F1" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  {(!themes?.themes || themes?.themes?.length === 0) && !loadingThemes && (
                    <Text style={styles.themeEmptyText}>No themes available</Text>
                  )}
                </View>
              </>
            )}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flex: 1,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 0,
    backgroundColor: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 6,
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
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Typography.fontFamily.medium,
    color: '#111827',
  },
  actionDivider: {
    height: 0,
    backgroundColor: 'transparent',
    marginLeft: 0,
  },
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    marginTop: 4,
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
  themeSection: {
    paddingVertical: 12,
  },
  themeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  themeSectionTitle: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.medium,
    color: '#111827',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  themeOptionActive: {
    backgroundColor: '#EEF2FF',
  },
  themeColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  themeOptionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Typography.fontFamily.regular,
    color: '#111827',
  },
  themeOptionTextActive: {
    fontFamily: Typography.fontFamily.medium,
    color: '#6366F1',
  },
  themeEmptyText: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});

export default ProfileSettingsScreen;
