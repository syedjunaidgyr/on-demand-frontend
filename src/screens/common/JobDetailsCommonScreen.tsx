import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import LinearGradient from 'react-native-linear-gradient';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { Job } from '../../types';
import ApiService from '../../services/api';

const JobDetailsCommonScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { jobId } = route.params as { jobId: string };
  
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      console.log('🔍 Loading job details for jobId:', jobId);
      
      // Try the general jobs endpoint first (should work for all users)
      try {
        const jobData = await ApiService.getJobById(jobId);
        console.log('📋 Job details loaded from general endpoint:', jobData);
        setJob(jobData);
        return;
      } catch (generalError) {
        console.log('General endpoint failed, trying staff-specific approach:', generalError);
      }
      
      // Fallback: try to get job from available or upcoming jobs
      const userData = await ApiService.getProfile();
      console.log('🔍 Loading job details for user role:', userData.role);
      
      if (userData.role === 'DOCTOR' || userData.role === 'NURSE') {
        // Try to get from available jobs first
        const availableJobs = await ApiService.getAvailableJobs();
        let jobData = availableJobs.data.find(job => job.id.toString() === jobId);
        
        if (!jobData) {
          // If not found in available jobs, try upcoming jobs
          const upcomingJobs = await ApiService.getUpcomingJobs();
          jobData = upcomingJobs.find(job => job.id.toString() === jobId);
        }
        
        if (jobData) {
          console.log('📋 Job details loaded from staff endpoints:', jobData);
          setJob(jobData);
          return;
        }
      }
      
      throw new Error('Job not found in any available endpoints');
    } catch (error) {
      console.error('❌ Failed to load job details:', error);
      Alert.alert('Error', 'Failed to load job details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return Colors.urgent;
      case 'HIGH':
        return Colors.high;
      case 'MEDIUM':
        return Colors.medium;
      case 'LOW':
        return Colors.low;
      default:
        return Colors.primary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return Colors.success;
      case 'CANCELLED':
        return Colors.error;
      case 'COMPLETED':
        return Colors.info;
      case 'FILLED':
        return Colors.warning;
      default:
        return Colors.textTertiary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <FontAwesomeIcon icon="exclamation-triangle" size={48} color={Colors.error}  />
          <Text style={styles.errorText}>Job not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <FontAwesomeIcon icon="arrow-left" size={24} color={Colors.white}  />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={2}>{job.title}</Text>
              <View style={styles.headerMeta}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
                  <Text style={styles.priorityText}>{job.priority}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                  <Text style={styles.statusText}>{job.status}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.shareButton}>
              <FontAwesomeIcon icon="share" size={24} color={Colors.white}  />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Job Overview */}
        <View style={styles.section}>
          <View style={styles.overviewCard}>
            <View style={styles.rateContainer}>
              <Text style={styles.rateAmount}>${job.hourlyRate}</Text>
              <Text style={styles.rateLabel}>per hour</Text>
            </View>
            <View style={styles.overviewDetails}>
              <View style={styles.overviewRow}>
                <FontAwesomeIcon icon="building" size={20} color={Colors.textTertiary}  />
                <Text style={styles.overviewText}>{job.department}</Text>
              </View>
              <View style={styles.overviewRow}>
                <FontAwesomeIcon icon="map-marker-alt" size={20} color={Colors.textTertiary}  />
                <Text style={styles.overviewText}>{job.location}</Text>
              </View>
              <View style={styles.overviewRow}>
                <FontAwesomeIcon icon="schedule" size={20} color={Colors.textTertiary}  />
                <Text style={styles.overviewText}>
                  {formatDate(job.startDate)} - {formatDate(job.endDate)}
                </Text>
              </View>
              <View style={styles.overviewRow}>
                <FontAwesomeIcon icon="clock" size={20} color={Colors.textTertiary}  />
                <Text style={styles.overviewText}>
                  {formatTime(job.startTime)} - {formatTime(job.endTime)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{job.description}</Text>
          </View>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          <View style={styles.requirementsCard}>
            <View style={styles.requirementItem}>
              <FontAwesomeIcon icon="school" size={20} color={Colors.primary}  />
              <View style={styles.requirementContent}>
                <Text style={styles.requirementLabel}>Experience</Text>
                <Text style={styles.requirementValue}>{job.requirements.experience}</Text>
              </View>
            </View>
            
            {job.requirements.boardCertified && (
              <View style={styles.requirementItem}>
                <FontAwesomeIcon icon="verified" size={20} color={Colors.primary}  />
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementLabel}>Board Certification</Text>
                  <Text style={styles.requirementValue}>Required</Text>
                </View>
              </View>
            )}

            {job.requirements.skills.length > 0 && (
              <View style={styles.requirementItem}>
                <FontAwesomeIcon icon="star" size={20} color={Colors.primary}  />
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementLabel}>Required Skills</Text>
                  <View style={styles.skillsContainer}>
                    {job.requirements.skills.map((skill, index) => (
                      <View key={index} style={styles.skillTag}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <View style={styles.benefitsCard}>
            {job.benefits.mealAllowance && (
              <View style={styles.benefitItem}>
                <FontAwesomeIcon icon="restaurant" size={20} color={Colors.success}  />
                <Text style={styles.benefitText}>Meal Allowance</Text>
              </View>
            )}
            {job.benefits.parking && (
              <View style={styles.benefitItem}>
                <FontAwesomeIcon icon="local-parking" size={20} color={Colors.success}  />
                <Text style={styles.benefitText}>Free Parking</Text>
              </View>
            )}
            {job.benefits.malpractice && (
              <View style={styles.benefitItem}>
                <FontAwesomeIcon icon="security" size={20} color={Colors.success}  />
                <Text style={styles.benefitText}>Malpractice Insurance</Text>
              </View>
            )}
          </View>
        </View>

        {/* Facility Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facility Information</Text>
          <View style={styles.facilityCard}>
            <Text style={styles.facilityName}>{job.facilityName}</Text>
            <View style={styles.facilityAddress}>
              <FontAwesomeIcon icon="map-marker-alt" size={16} color={Colors.textTertiary}  />
              <Text style={styles.facilityAddressText}>
                {job.facilityAddress.street}, {job.facilityAddress.city}, {job.facilityAddress.state} {job.facilityAddress.zipCode}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactItem}>
              <FontAwesomeIcon icon="user" size={20} color={Colors.primary}  />
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Contact Person</Text>
                <Text style={styles.contactValue}>{job.contactPerson.name}</Text>
                <Text style={styles.contactSubValue}>{job.contactPerson.position}</Text>
              </View>
            </View>
            
            <View style={styles.contactItem}>
              <FontAwesomeIcon icon="phone" size={20} color={Colors.primary}  />
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{job.contactPerson.phone}</Text>
              </View>
            </View>
            
            <View style={styles.contactItem}>
              <FontAwesomeIcon icon="envelope" size={20} color={Colors.primary}  />
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{job.contactPerson.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Assignment Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assignment Status</Text>
          <View style={styles.assignmentCard}>
            <View style={styles.assignmentInfo}>
              <Text style={styles.assignmentLabel}>Current Assignments</Text>
              <Text style={styles.assignmentValue}>
                {job.currentAssignments} / {job.maxAssignments}
              </Text>
            </View>
            <View style={styles.assignmentProgress}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${(job.currentAssignments / job.maxAssignments) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Notes */}
        {job.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{job.notes}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryButton}>
            <FontAwesomeIcon icon="send" size={20} color={Colors.white}  />
            <Text style={styles.primaryButtonText}>Apply for Job</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <FontAwesomeIcon icon="favorite-border" size={20} color={Colors.primary}  />
            <Text style={styles.secondaryButtonText}>Save Job</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.error,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  shareButton: {
    padding: Spacing.sm,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  overviewCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  rateContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rateAmount: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  rateLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  overviewDetails: {
    gap: Spacing.sm,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  descriptionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  descriptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  requirementsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  requirementContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  requirementLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  requirementValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  skillTag: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  skillText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  benefitsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  benefitText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  facilityCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  facilityName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  facilityAddress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  facilityAddressText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  contactCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  contactContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  contactLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  contactValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  contactSubValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  assignmentCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  assignmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  assignmentLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  assignmentValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  assignmentProgress: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  notesCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  notesText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  actionSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadow.sm,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
});

export default JobDetailsCommonScreen;
