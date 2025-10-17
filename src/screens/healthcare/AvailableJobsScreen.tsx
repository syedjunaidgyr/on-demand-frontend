import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { Job, User } from '../../types';
import ApiService from '../../services/api';

const AvailableJobsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAvailableJobs();
  }, []);

  const loadAvailableJobs = async () => {
    try {
      // Load user profile first to determine role
      const userData = await ApiService.getProfile();
      setUser(userData);

      // Load role-specific available jobs
      const jobsData = userData.role === 'DOCTOR'
        ? await ApiService.getAvailableJobs()
        : await ApiService.getNurseAvailableJobs();

      setJobs(jobsData.data);
    } catch (error) {
      console.error('Failed to load available jobs:', error);
      Alert.alert('Error', 'Failed to load available jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAvailableJobs();
    setRefreshing(false);
  };

  const handleApplyJob = async (job: Job) => {
    Alert.alert(
      'Apply for Job',
      `Are you sure you want to apply for "${job.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            try {
              if (user?.role === 'DOCTOR') {
                await ApiService.applyForDoctorJob(job.id);
              } else {
                await ApiService.applyForNurseJob(job.id);
              }
              
              Alert.alert('Success', 'Application submitted successfully!');
              loadAvailableJobs(); // Refresh the list
            } catch (error: any) {
              console.error('Job application error:', error);
              Alert.alert(
                'Application Not Available', 
                error.message || 'Job application feature is not yet available. Please contact HR directly to express interest in this position.',
                [
                  { text: 'OK', style: 'default' },
                  { 
                    text: 'Contact HR', 
                    onPress: () => {
                      // TODO: Implement contact HR functionality
                      Alert.alert('Contact HR', 'Please reach out to HR at hr@locum.com or call (555) 123-4567');
                    }
                  }
                ]
              );
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRoleConfig = () => {
    if (!user) return { color: Colors.primary, title: 'Available Jobs' };
    
    switch (user.role) {
      case 'DOCTOR':
        return {
          color: Colors.doctor,
          title: 'Available Medical Jobs'
        };
      case 'NURSE':
        return {
          color: Colors.nurse,
          title: 'Available Nursing Jobs'
        };
      default:
        return {
          color: Colors.primary,
          title: 'Available Jobs'
        };
    }
  };

  const JobCard = ({ job }: { job: Job }) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => (navigation as any).navigate('JobDetails', { jobId: job.id })}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <View style={[styles.jobStatus, { backgroundColor: Colors.success }]}>
          <Text style={styles.jobStatusText}>Available</Text>
        </View>
      </View>
      
      <Text style={styles.jobDescription}>{job.description}</Text>
      
      <View style={styles.jobDetails}>
        <View style={styles.jobDetail}>
          <FontAwesomeIcon icon="map-marker-alt" size={16} color={Colors.textTertiary} />
          <Text style={styles.jobDetailText}>{job.location}</Text>
        </View>
        
        <View style={styles.jobDetail}>
          <FontAwesomeIcon icon="calendar" size={16} color={Colors.textTertiary} />
          <Text style={styles.jobDetailText}>
            {formatDate(job.startDate)}
          </Text>
        </View>
        
        <View style={styles.jobDetail}>
          <FontAwesomeIcon icon="clock" size={16} color={Colors.textTertiary} />
          <Text style={styles.jobDetailText}>
            {formatTime(job.startTime)} - {formatTime(job.endTime)}
          </Text>
        </View>
        
        <View style={styles.jobDetail}>
          <FontAwesomeIcon icon="dollar-sign" size={16} color={Colors.textTertiary} />
          <Text style={styles.jobDetailText}>${job.hourlyRate}/hour</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.applyButton, { backgroundColor: getRoleConfig().color }]}
        onPress={() => handleApplyJob(job)}>
        <FontAwesomeIcon icon="plus" size={16} color={Colors.white} />
        <Text style={styles.applyButtonText}>Apply Now</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading available jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const roleConfig = getRoleConfig();

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: roleConfig.color }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <FontAwesomeIcon icon="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{roleConfig.title}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <FontAwesomeIcon icon="briefcase" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>No Available Jobs</Text>
            <Text style={styles.emptyStateText}>
              There are no available jobs at the moment. Check back later for new opportunities.
            </Text>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: roleConfig.color }]}
              onPress={onRefresh}>
              <FontAwesomeIcon icon="redo" size={16} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadow.sm,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  jobTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  jobStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  jobStatusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
  jobDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  jobDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  jobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.lg,
    marginBottom: Spacing.sm,
    minWidth: '45%',
  },
  jobDetailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    marginLeft: Spacing.xs,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  applyButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['2xl'],
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
});

export default AvailableJobsScreen;
