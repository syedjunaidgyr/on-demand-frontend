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
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import ApiService from '../../services/api';

const JobAssignmentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { jobId, acceptedAssignments } = route.params as { jobId: string; acceptedAssignments?: any[] };
  
  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    loadJobAndCandidates();
  }, [jobId, acceptedAssignments]);

  const loadJobAndCandidates = async () => {
    try {
      setIsLoading(true);
      
      // Load job details
      console.log('🔍 Loading job details for jobId:', jobId);
      const jobData = await ApiService.getJobById(jobId);
      console.log('📋 Job data received:', jobData);
      
      // Extract nested job data if it exists
      const actualJobData = jobData.job || jobData;
      console.log('📋 Actual job data:', actualJobData);
      console.log('📋 Job title:', actualJobData?.title);
      console.log('📋 Job description:', actualJobData?.description);
      setJob(actualJobData);
      
      // Use passed accepted assignments or load them
      if (acceptedAssignments) {
        console.log('🔍 Using passed accepted assignments:', acceptedAssignments);
        console.log('📦 Accepted assignments type:', typeof acceptedAssignments);
        console.log('📦 Accepted assignments length:', acceptedAssignments.length);
        console.log('📦 First assignment:', acceptedAssignments[0]);
        
        // Ensure we have an array
        const candidatesArray = Array.isArray(acceptedAssignments) ? acceptedAssignments : [];
        console.log('📋 Final candidates array:', candidatesArray);
        setCandidates(candidatesArray);
      } else {
        console.log('🔍 Loading accepted assignments for job:', jobId);
        const response = await ApiService.getAcceptedAssignments(jobId);
        const candidatesData = response.acceptedAssignments || response;
        setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      }
      
    } catch (error) {
      console.error('❌ Failed to load job or candidates data:', error);
      Alert.alert('Error', 'Failed to load job details or candidates data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCandidate = async (assignment: any) => {
    console.log('🎯 handleSelectCandidate called with assignment:', assignment);
    console.log('🎯 Assignment ID:', assignment.id);
    console.log('🎯 Assignment status:', assignment.status);
    console.log('🎯 Job ID:', jobId);
    
    const staff = assignment.staff || assignment.user;
    Alert.alert(
      'Select Candidate',
      `Are you sure you want to select ${staff.firstName} ${staff.lastName} for this job?\n\nJob: ${job.title}\nStaff: ${staff.firstName} ${staff.lastName}\nDepartment: ${staff.department}\nSpecialization: ${staff.specialization || 'N/A'}\n\nThis will confirm them for the job and reject all other candidates.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select',
          style: 'default',
          onPress: async () => {
            try {
              setIsSelecting(true);
              console.log('🔧 Selecting candidate:', assignment.id);
              console.log('🔧 Job ID:', jobId);
              console.log('🔧 Assignment ID string:', assignment.id.toString());
              
              await ApiService.selectCandidate(jobId, assignment.id.toString());
              
              Alert.alert(
                'Candidate Selected Successfully! 🎉', 
                `${staff.firstName} ${staff.lastName} has been selected for this job.\n\nAll other candidates have been automatically rejected.`,
                [
                  { 
                    text: 'OK', 
                    onPress: () => {
                      // Go back to job management screen
                      navigation.goBack();
                    }
                  }
                ]
              );
            } catch (error: any) {
              console.error('❌ Failed to select candidate:', error);
              Alert.alert(
                'Selection Failed', 
                error.message || 'Unable to select candidate. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsSelecting(false);
            }
          },
        },
      ]
    );
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
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
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

  const StaffCard = ({ staff }: { staff: any }) => (
    <View style={styles.staffCard}>
      <View style={styles.staffHeader}>
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{staff.firstName} {staff.lastName}</Text>
          <Text style={styles.staffRole}>{staff.role}</Text>
        </View>
        <View style={styles.compatibilityBadge}>
          <Text style={styles.compatibilityText}>Compatible</Text>
        </View>
      </View>
      
      <View style={styles.staffDetails}>
        <View style={styles.staffDetail}>
          <FontAwesomeIcon icon="user-md" size={16} color={Colors.textTertiary} />
          <Text style={styles.staffDetailText}>{staff.department}</Text>
        </View>
        
        {staff.specialization && (
          <View style={styles.staffDetail}>
            <FontAwesomeIcon icon="stethoscope" size={16} color={Colors.textTertiary} />
            <Text style={styles.staffDetailText}>{staff.specialization}</Text>
          </View>
        )}
        
        <View style={styles.staffDetail}>
          <FontAwesomeIcon icon="map-marker-alt" size={16} color={Colors.textTertiary} />
          <Text style={styles.staffDetailText}>{staff.location}</Text>
        </View>
        
        <View style={styles.staffDetail}>
          <FontAwesomeIcon icon="envelope" size={16} color={Colors.textTertiary} />
          <Text style={styles.staffDetailText}>{staff.email}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.assignButton}
        onPress={() => handleAssignJob(staff)}
        disabled={isAssigning}>
        {isAssigning ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <FontAwesomeIcon icon="user-plus" size={16} color={Colors.white} />
            <Text style={styles.assignButtonText}>Assign Job</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const CandidateCard = ({ assignment }: { assignment: any }) => {
    console.log('🎯 CandidateCard received assignment:', assignment);
    const staff = assignment.staff || assignment.user;
    console.log('👤 Extracted staff data:', staff);
    return (
      <View style={styles.staffCard}>
        <View style={styles.staffHeader}>
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>{staff.firstName} {staff.lastName}</Text>
            <Text style={styles.staffRole}>{staff.role}</Text>
          </View>
          <View style={[styles.compatibilityBadge, { backgroundColor: Colors.success }]}>
            <Text style={styles.compatibilityText}>Accepted</Text>
          </View>
        </View>
        
        <View style={styles.staffDetails}>
          <View style={styles.staffDetail}>
            <FontAwesomeIcon icon="user-md" size={16} color={Colors.textTertiary} />
            <Text style={styles.staffDetailText}>{staff.department}</Text>
          </View>
          
          {staff.specialization && (
            <View style={styles.staffDetail}>
              <FontAwesomeIcon icon="stethoscope" size={16} color={Colors.textTertiary} />
              <Text style={styles.staffDetailText}>{staff.specialization}</Text>
            </View>
          )}
          
          <View style={styles.staffDetail}>
            <FontAwesomeIcon icon="map-marker-alt" size={16} color={Colors.textTertiary} />
            <Text style={styles.staffDetailText}>{staff.location}</Text>
          </View>
          
          <View style={styles.staffDetail}>
            <FontAwesomeIcon icon="envelope" size={16} color={Colors.textTertiary} />
            <Text style={styles.staffDetailText}>{staff.email}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={() => handleSelectCandidate(assignment)}
          disabled={isSelecting}>
          {isSelecting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <FontAwesomeIcon icon="check" size={16} color={Colors.white} />
              <Text style={styles.selectButtonText}>Select Candidate</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading job and accepted candidates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <FontAwesomeIcon icon="exclamation-triangle" size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Job Not Found</Text>
          <Text style={styles.errorText}>The job you're looking for doesn't exist or has been removed.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
     

      <ScrollView style={styles.content}>
        {/* Job Information */}
        <View style={styles.jobCard}>
          {(() => {
            console.log('🎨 Rendering job card');
            console.log('📋 Job object:', job);
            console.log('📋 Job title:', job?.title);
            console.log('📋 Job description:', job?.description);
            return null;
          })()}
          <Text style={styles.jobTitle}>{job?.title || 'Loading...'}</Text>
          <Text style={styles.jobDescription}>{job?.description || 'Loading job details...'}</Text>
          
          <View style={styles.jobDetails}>
            <View style={styles.jobDetail}>
              <FontAwesomeIcon icon="building" size={16} color={Colors.textTertiary} />
              <Text style={styles.jobDetailText}>{job?.facilityName || 'Loading...'}</Text>
            </View>
            
            <View style={styles.jobDetail}>
              <FontAwesomeIcon icon="map-marker-alt" size={16} color={Colors.textTertiary} />
              <Text style={styles.jobDetailText}>{job?.location || 'Loading...'}</Text>
            </View>
            
            <View style={styles.jobDetail}>
              <FontAwesomeIcon icon="user-md" size={16} color={Colors.textTertiary} />
              <Text style={styles.jobDetailText}>{job?.department || 'Loading...'}</Text>
            </View>
            
            {job?.specialization && (
              <View style={styles.jobDetail}>
                <FontAwesomeIcon icon="stethoscope" size={16} color={Colors.textTertiary} />
                <Text style={styles.jobDetailText}>{job.specialization}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleTitle}>Schedule</Text>
            <Text style={styles.scheduleText}>
              {job?.startDate ? formatDate(job.startDate) : 'Loading...'} - {job?.endDate ? formatDate(job.endDate) : 'Loading...'}
            </Text>
            <Text style={styles.scheduleText}>
              {job?.startTime ? formatTime(job.startTime) : 'Loading...'} - {job?.endTime ? formatTime(job.endTime) : 'Loading...'}
            </Text>
            <Text style={styles.paymentText}>Rs/-{job?.hourlyRate || 'Loading...'}/hour</Text>
          </View>
        </View>

        {/* Compatible Staff */}
        <View style={styles.staffSection}>
          <Text style={styles.sectionTitle}>
            Accepted Candidates ({candidates.length})
          </Text>
          
          {(() => {
            console.log('🎨 Rendering candidates section');
            console.log('📊 Candidates state:', candidates);
            console.log('📊 Candidates length:', candidates.length);
            console.log('📊 Is candidates array?', Array.isArray(candidates));
            
            if (candidates.length > 0) {
              console.log('✅ Rendering candidates list');
              return candidates.map((assignment) => (
                <CandidateCard key={assignment.id} assignment={assignment} />
              ));
            } else {
              console.log('❌ Rendering no candidates message');
              return (
                <View style={styles.noStaffCard}>
                  <FontAwesomeIcon icon="users" size={48} color={Colors.textTertiary} />
                  <Text style={styles.noStaffTitle}>No Accepted Candidates</Text>
                  <Text style={styles.noStaffText}>
                    No staff members have accepted this job assignment yet.
                  </Text>
                </View>
              );
            }
          })()}
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
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  jobTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  jobDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  jobDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  jobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobDetailText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textTertiary,
    marginLeft: Spacing.sm,
  },
  scheduleInfo: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  scheduleTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  scheduleText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  paymentText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
  staffSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  staffCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  staffRole: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  compatibilityBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  compatibilityText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
  staffDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  staffDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffDetailText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textTertiary,
    marginLeft: Spacing.sm,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
  },
  assignButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.success,
  },
  selectButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  noStaffCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing['2xl'],
    alignItems: 'center',
    ...Shadow.md,
  },
  noStaffTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  noStaffText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
});

export default JobAssignmentScreen;
