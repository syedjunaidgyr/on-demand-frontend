import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Shadow, BorderRadius } from '../../constants/spacing';
import ApiService from '../../services/api';
import HRFooterNavigation from '../../components/HRFooterNavigation';
import GlobalHeader from '../../components/GlobalHeader';
import Responsive from '../../utils/responsive';

type RootStackParamList = {
  ReportDetails: { reportId: number };
};

type ReportDetailsRouteProp = RouteProp<RootStackParamList, 'ReportDetails'>;

interface ReportDetails {
  id: number;
  title: string;
  type: string;
  summary: any;
  totalRecords: number;
  generatedAt: string;
  data?: any[];
}

const ReportDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ReportDetailsRouteProp>();
  const { reportId } = route.params;
  
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportDetails();
  }, [reportId]);

  const loadReportDetails = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would fetch the report details from the API
      // For now, we'll simulate the data
      const mockReport: ReportDetails = {
        id: reportId,
        title: 'Sample Report',
        type: 'JOB_POSTINGS',
        summary: {
          totalJobs: 45,
          byStatus: { ACTIVE: 20, ASSIGNED: 15, COMPLETED: 10 },
          byDepartment: { 'General Surgery': 10, 'Cardiology': 8 },
          totalAssignments: 60,
          totalHours: 480,
          totalPayment: 91200,
        },
        totalRecords: 45,
        generatedAt: new Date().toISOString(),
        data: [],
      };
      
      setReport(mockReport);
    } catch (error) {
      console.error('Failed to load report details:', error);
      Alert.alert('Error', 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = () => {
    Alert.alert('Export', 'Export functionality will be implemented');
  };

  const formatSummaryLabel = (key: string) => {
    switch (key) {
      case 'totalJobs':
        return 'Total Jobs';
      case 'totalAssignments':
        return 'Total Assignments';
      case 'totalHours':
        return 'Total Hours';
      case 'totalPayment':
        return 'Total Payment';
      case 'totalCheckIns':
        return 'Total Check-ins';
      case 'totalWorkHours':
        return 'Total Work Hours';
      case 'totalBreakTime':
        return 'Total Break Time';
      case 'lateArrivals':
        return 'Late Arrivals';
      case 'earlyDepartures':
        return 'Early Departures';
      case 'attendanceRate':
        return 'Attendance Rate';
      case 'totalNoShows':
        return 'Total No-shows';
      case 'totalExpectedPayment':
        return 'Total Expected Payment';
      case 'averageHoursMissed':
        return 'Average Hours Missed';
      case 'totalPayoutAmount':
        return 'Total Payout Amount';
      case 'completedPayments':
        return 'Completed Payments';
      case 'pendingPayments':
        return 'Pending Payments';
      case 'byStatus':
        return 'By Status';
      case 'byDepartment':
        return 'By Department';
      case 'byUser':
        return 'By User';
      case 'byRole':
        return 'By Role';
      default:
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
  };

  const formatSummaryValue = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (key === 'byStatus') {
        return Object.entries(value)
          .map(([status, count]) => `${status}: ${count}`)
          .join(', ');
      } else if (key === 'byDepartment') {
        return Object.entries(value)
          .map(([dept, count]) => `${dept}: ${count}`)
          .join(', ');
      } else if (key === 'byUser') {
        return Object.entries(value)
          .map(([user, count]) => `${user}: ${count}`)
          .join(', ');
      } else if (key === 'byRole') {
        return Object.entries(value)
          .map(([role, count]) => `${role}: ${count}`)
          .join(', ');
      } else {
        return Object.entries(value)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
      }
    }
    return value;
  };

  const renderSummaryItem = (label: string, value: any) => (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{formatSummaryLabel(label)}</Text>
      <Text style={styles.summaryValue}>
        {formatSummaryValue(label.toLowerCase().replace(/\s+/g, ''), value)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading report details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <FontAwesomeIcon icon="exclamation-triangle" size={Responsive.iconSize(48)} color={Colors.error} />
          <Text style={styles.errorText}>Report not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <GlobalHeader 
        title="Report Details"
        backgroundColor={Colors.primary}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <FontAwesomeIcon icon="download" size={Responsive.iconSize(20)} color={Colors.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Report Info Card */}
        <View style={styles.reportInfoCard}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <View style={styles.reportMeta}>
            <View style={styles.reportMetaItem}>
              <FontAwesomeIcon icon="file-alt" size={Responsive.iconSize(16)} color={Colors.textSecondary} />
              <Text style={styles.reportMetaText}>{report.type}</Text>
            </View>
            <View style={styles.reportMetaItem}>
              <FontAwesomeIcon icon="calendar" size={Responsive.iconSize(16)} color={Colors.textSecondary} />
              <Text style={styles.reportMetaText}>{formatDate(report.generatedAt)}</Text>
            </View>
            <View style={styles.reportMetaItem}>
              <FontAwesomeIcon icon="database" size={16} color={Colors.textSecondary} />
              <Text style={styles.reportMetaText}>{report.totalRecords} records</Text>
            </View>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Summary Statistics</Text>
          {report.summary && Object.entries(report.summary).map(([key, value]) => (
            <View key={key}>
              {renderSummaryItem(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value)}
            </View>
          ))}
        </View>

        {/* Export Options */}
        <View style={styles.exportCard}>
          <Text style={styles.sectionTitle}>Export Options</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity style={styles.exportOption} onPress={handleExport}>
              <FontAwesomeIcon icon="file-alt" size={24} color={Colors.primary} />
              <Text style={styles.exportOptionText}>CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportOption} onPress={handleExport}>
              <FontAwesomeIcon icon="file-pdf" size={24} color={Colors.error} />
              <Text style={styles.exportOptionText}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportOption} onPress={handleExport}>
              <FontAwesomeIcon icon="file-excel" size={24} color={Colors.success} />
              <Text style={styles.exportOptionText}>Excel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <HRFooterNavigation activeRoute="Reports" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  exportButton: {
    padding: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  reportInfoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.lg,
    ...Shadow.md,
  },
  reportTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  reportMeta: {
    gap: Spacing.sm,
  },
  reportMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reportMetaText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  summaryValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  exportCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing['2xl'],
    ...Shadow.md,
  },
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  exportOption: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    minWidth: 80,
  },
  exportOptionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
});

export default ReportDetailsScreen;
