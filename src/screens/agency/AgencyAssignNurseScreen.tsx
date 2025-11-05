import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, TextInput, FlatList, Alert, StatusBar, ScrollView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import GlobalHeader from '../../components/GlobalHeader';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { FontAwesomeIcon } from '../../utils/icons';
import ApiService from '../../services/api';
import { useAuth } from '../../navigation/AppNavigator';

type ParamList = {
  AgencyAssignNurse: { jobId: string; hourlyRate?: number; mode?: 'FULL' | 'PARTIAL' | 'SEGMENTS' };
};

interface Segment {
  id: string;
  userId: string | number | null;
  startDate: Date | null;
  endDate: Date | null;
  showStartPicker: boolean;
  showEndPicker: boolean;
}

const AgencyAssignNurseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'AgencyAssignNurse'>>();
  const { user } = useAuth();
  const jobId = route.params?.jobId as string;
  const [mode, setMode] = useState<'FULL' | 'PARTIAL' | 'SEGMENTS'>(route.params?.mode || 'FULL');
  const [hourlyRate, setHourlyRate] = useState<string>(route.params?.hourlyRate ? String(route.params.hourlyRate) : '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pool, setPool] = useState<any[]>([]);
  const [nurses, setNurses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | number | null>(null);
  const [job, setJob] = useState<any>(null);
  const [segments, setSegments] = useState<Segment[]>([
    { id: '1', userId: null, startDate: null, endDate: null, showStartPicker: false, showEndPicker: false }
  ]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const agencyId = user?.id;
        if (!agencyId) throw new Error('No agency id');
        
        // Load job details to get date range
        try {
          const jobData = await ApiService.getJobById(jobId);
          const actualJob = jobData.job || jobData;
          setJob(actualJob);
        } catch (e) {
          console.error('Failed to load job:', e);
        }

        const res = await ApiService.getAgencyNurses(agencyId);
        setPool(res.pool || []);
        setNurses(res.nurses || []);
      } catch (e) {
        Alert.alert('Error', 'Failed to load nurses.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, jobId]);

  const eligiblePool = (pool || []).filter((m: any) => String(m.status || '').toUpperCase() !== 'REVOKED');

  const items = eligiblePool.map((m: any) => {
    const fallback = nurses.find((x: any) => String(x.id) === String(m.nurseId)) || {};
    const n = m.nurse || fallback || {};
    return { id: n.id, firstName: n.firstName, lastName: n.lastName, email: n.email, status: m.status };
  }).filter((n: any) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      String(n.firstName || '').toLowerCase().includes(q) ||
      String(n.lastName || '').toLowerCase().includes(q) ||
      String(n.email || '').toLowerCase().includes(q)
    );
  });

  const formatDateForAPI = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getJobDateRange = () => {
    if (!job?.startDate || !job?.endDate) return null;
    const start = new Date(job.startDate);
    const end = new Date(job.endDate);
    return { start, end };
  };

  const validateSegments = (): string | null => {
    const dateRange = getJobDateRange();
    if (!dateRange) {
      return 'Job date range not available';
    }

    // Check all segments have required fields
    for (const seg of segments) {
      if (!seg.userId) {
        return 'Please select a nurse for all segments';
      }
      if (!seg.startDate || !seg.endDate) {
        return 'Please select start and end dates for all segments';
      }
      if (seg.startDate > seg.endDate) {
        return 'Start date must be before end date';
      }
      // Check dates are within job range
      if (seg.startDate < dateRange.start || seg.endDate > dateRange.end) {
        return `All dates must be within job range: ${formatDateForDisplay(dateRange.start)} to ${formatDateForDisplay(dateRange.end)}`;
      }
    }

    // Check for overlaps
    const sortedSegments = [...segments].sort((a, b) => {
      if (!a.startDate || !b.startDate) return 0;
      return a.startDate.getTime() - b.startDate.getTime();
    });

    for (let i = 0; i < sortedSegments.length - 1; i++) {
      const current = sortedSegments[i];
      const next = sortedSegments[i + 1];
      if (!current.endDate || !next.startDate) continue;
      
      // Check if current segment ends after next starts (overlap)
      if (current.endDate >= next.startDate) {
        return 'Segments cannot overlap. Please adjust date ranges.';
      }
    }

    return null;
  };

  const addSegment = () => {
    setSegments([...segments, {
      id: Date.now().toString(),
      userId: null,
      startDate: null,
      endDate: null,
      showStartPicker: false,
      showEndPicker: false
    }]);
  };

  const removeSegment = (id: string) => {
    if (segments.length === 1) {
      Alert.alert('Cannot Remove', 'At least one segment is required.');
      return;
    }
    setSegments(segments.filter(s => s.id !== id));
  };

  const updateSegment = (id: string, updates: Partial<Segment>) => {
    setSegments(segments.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const submit = async () => {
    try {
      const rate = parseFloat(hourlyRate || '0');
      if (!rate || isNaN(rate)) {
        Alert.alert('Hourly Rate', 'Enter a valid hourly rate.');
        return;
      }

      if (mode === 'SEGMENTS') {
        const validationError = validateSegments();
        if (validationError) {
          Alert.alert('Validation Error', validationError);
          return;
        }

        setSubmitting(true);
        await ApiService.assignNursesToAgencyJob(jobId, {
          mode: 'SEGMENTS',
          hourlyRate: rate,
          assignments: segments.map(seg => ({
            userId: seg.userId!,
            startDate: formatDateForAPI(seg.startDate),
            endDate: formatDateForAPI(seg.endDate),
          })),
        });
        Alert.alert('Success', `${segments.length} segment(s) assigned successfully.`, [
          { text: 'OK', onPress: () => (navigation as any).goBack() },
        ]);
      } else {
        // FULL or PARTIAL mode
        if (!selectedUserId) {
          Alert.alert('Select Nurse', 'Please select a nurse to assign.');
          return;
        }
        setSubmitting(true);
        await ApiService.assignNursesToAgencyJob(jobId, {
          mode,
          hourlyRate: rate,
          assignments: [{ userId: selectedUserId }],
        });
        Alert.alert('Success', 'Nurse assigned to job.', [
          { text: 'OK', onPress: () => (navigation as any).goBack() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to assign nurse.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedNurseName = (userId: string | number | null): string => {
    if (!userId) return 'Select nurse';
    const nurse = items.find(n => String(n.id) === String(userId));
    return nurse ? `${nurse.firstName} ${nurse.lastName}` : 'Select nurse';
  };

  const dateRange = getJobDateRange();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" translucent={false} />
      <GlobalHeader 
        title="Assign Nurse"
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        onBackPress={() => (navigation as any).goBack?.()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16 }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Hourly Rate</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 70"
              keyboardType="numeric"
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Mode</Text>
            <View style={styles.modeRow}>
              {(['FULL', 'PARTIAL', 'SEGMENTS'] as const).map(m => (
                <TouchableOpacity 
                  key={m} 
                  style={[styles.modeChip, mode === m && styles.modeChipActive]} 
                  onPress={() => {
                    setMode(m);
                    if (m !== 'SEGMENTS' && segments.length > 1) {
                      setSegments([segments[0]]);
                    }
                  }}>
                  <Text style={[styles.modeChipTxt, mode === m && styles.modeChipTxtActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {mode === 'SEGMENTS' && dateRange && (
            <View style={styles.infoBox}>
              <FontAwesomeIcon icon="info-circle" size={14} color={Colors.primary} />
              <Text style={styles.infoText}>
                Job period: {formatDateForDisplay(dateRange.start)} to {formatDateForDisplay(dateRange.end)}
              </Text>
            </View>
          )}

          {mode !== 'SEGMENTS' && (
            <View style={styles.searchBar}>
              <FontAwesomeIcon icon="search" size={16} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search nurses"
                placeholderTextColor={Colors.textTertiary}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <FontAwesomeIcon icon="times" size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {mode === 'SEGMENTS' && (
            <View style={styles.segmentsContainer}>
              <View style={styles.segmentsHeader}>
                <Text style={styles.segmentsTitle}>Segments</Text>
                <TouchableOpacity style={styles.addSegmentBtn} onPress={addSegment}>
                  <FontAwesomeIcon icon="plus" size={14} color={Colors.white} />
                  <Text style={styles.addSegmentText}>Add Segment</Text>
                </TouchableOpacity>
              </View>

              {segments.map((segment, index) => (
                <View key={segment.id} style={styles.segmentCard}>
                  <View style={styles.segmentHeader}>
                    <Text style={styles.segmentNumber}>Segment {index + 1}</Text>
                    {segments.length > 1 && (
                      <TouchableOpacity onPress={() => removeSegment(segment.id)}>
                        <FontAwesomeIcon icon="trash" size={16} color={Colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.segmentNurseSelect}
                    onPress={() => {
                      // Show nurse selection modal
                      const nurseList = items.map(n => ({
                        label: `${n.firstName} ${n.lastName}`,
                        value: n.id,
                      }));
                      Alert.alert(
                        'Select Nurse',
                        '',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          ...nurseList.map(n => ({
                            text: n.label,
                            onPress: () => updateSegment(segment.id, { userId: n.value }),
                          })),
                        ],
                        { cancelable: true }
                      );
                    }}>
                    <Text style={[styles.segmentNurseText, !segment.userId && styles.segmentNursePlaceholder]}>
                      {getSelectedNurseName(segment.userId)}
                    </Text>
                    <FontAwesomeIcon icon="chevron-down" size={14} color={Colors.textSecondary} />
                  </TouchableOpacity>

                  <View style={styles.dateRow}>
                    <View style={styles.dateInput}>
                      <Text style={styles.dateLabel}>Start Date</Text>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => updateSegment(segment.id, { showStartPicker: true })}>
                        <Text style={[styles.dateButtonText, !segment.startDate && styles.dateButtonPlaceholder]}>
                          {formatDateForDisplay(segment.startDate)}
                        </Text>
                        <FontAwesomeIcon icon="calendar" size={14} color={Colors.primary} />
                      </TouchableOpacity>
                      {segment.showStartPicker && (
                        <DateTimePicker
                          value={segment.startDate || dateRange?.start || new Date()}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          minimumDate={dateRange?.start || undefined}
                          maximumDate={segment.endDate || dateRange?.end || undefined}
                          onChange={(event, selectedDate) => {
                            updateSegment(segment.id, { 
                              showStartPicker: Platform.OS === 'ios',
                              startDate: selectedDate || segment.startDate 
                            });
                            if (Platform.OS !== 'ios') {
                              updateSegment(segment.id, { showStartPicker: false });
                            }
                          }}
                        />
                      )}
                    </View>

                    <View style={styles.dateInput}>
                      <Text style={styles.dateLabel}>End Date</Text>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => updateSegment(segment.id, { showEndPicker: true })}>
                        <Text style={[styles.dateButtonText, !segment.endDate && styles.dateButtonPlaceholder]}>
                          {formatDateForDisplay(segment.endDate)}
                        </Text>
                        <FontAwesomeIcon icon="calendar" size={14} color={Colors.primary} />
                      </TouchableOpacity>
                      {segment.showEndPicker && (
                        <DateTimePicker
                          value={segment.endDate || dateRange?.end || new Date()}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          minimumDate={segment.startDate || dateRange?.start || undefined}
                          maximumDate={dateRange?.end || undefined}
                          onChange={(event, selectedDate) => {
                            updateSegment(segment.id, { 
                              showEndPicker: Platform.OS === 'ios',
                              endDate: selectedDate || segment.endDate 
                            });
                            if (Platform.OS !== 'ios') {
                              updateSegment(segment.id, { showEndPicker: false });
                            }
                          }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {mode !== 'SEGMENTS' && (
          <>
            {loading ? (
              <View style={styles.center}> 
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading nurses…</Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {items.map((item) => (
                  <TouchableOpacity 
                    key={item.id}
                    style={[styles.nurseItem, selectedUserId === item.id && styles.nurseItemActive]} 
                    onPress={() => setSelectedUserId(item.id)}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarTxt}>
                        {(item.firstName || item.lastName || 'N').charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.nurseBody}>
                      <Text style={styles.nurseName}>{item.firstName} {item.lastName}</Text>
                      <Text style={styles.nurseSub}>{item.email}</Text>
                    </View>
                    {selectedUserId === item.id ? (
                      <FontAwesomeIcon icon="check-circle" size={18} color={Colors.primary} />
                    ) : (
                      <FontAwesomeIcon icon="circle" size={18} color={Colors.borderLight} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.primaryBtn, 
            (mode === 'SEGMENTS' ? segments.length === 0 : !selectedUserId) || submitting ? { opacity: 0.6 } : {}
          ]} 
          onPress={submit} 
          disabled={(mode === 'SEGMENTS' ? segments.length === 0 : !selectedUserId) || submitting}>
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.primaryBtnTxt}>
              {mode === 'SEGMENTS' ? `Assign ${segments.length} Segment(s)` : 'Assign'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  form: { paddingHorizontal: 16, paddingTop: 8 },
  inputRow: { marginBottom: 16 },
  label: { color: Colors.textPrimary, fontFamily: Typography.fontFamily.medium, marginBottom: 6, fontSize: 14 },
  input: { 
    height: 44, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: Colors.borderLight, 
    paddingHorizontal: 12, 
  },
  modeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  modeChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: Colors.borderLight, 
    backgroundColor: Colors.background 
  },
  modeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeChipTxt: { fontSize: 13, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary },
  modeChipTxtActive: { color: Colors.white },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.white, 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderWidth: 1, 
    borderColor: Colors.borderLight, 
    minHeight: 44 
  },
  searchInput: { flex: 1, marginLeft: 8, color: Colors.textPrimary, fontFamily: Typography.fontFamily.regular },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 8, color: Colors.textSecondary, fontFamily: Typography.fontFamily.medium },
  listContainer: { paddingHorizontal: 12, paddingTop: 8 },
  nurseItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.white, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: Colors.borderLight, 
    padding: 12, 
    marginBottom: 8 
  },
  nurseItemActive: { borderColor: Colors.primary, borderWidth: 2 },
  avatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#EEF2FF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  avatarTxt: { color: '#4F46E5', fontFamily: Typography.fontFamily.bold, fontSize: 14 },
  nurseBody: { flex: 1 },
  nurseName: { color: Colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: 14 },
  nurseSub: { color: Colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: 12, marginTop: 2 },
  footer: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    bottom: 0, 
    padding: 12, 
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight
  },
  primaryBtn: { 
    height: 48, 
    borderRadius: 12, 
    backgroundColor: Colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  primaryBtnTxt: { color: Colors.white, fontFamily: Typography.fontFamily.bold, fontSize: 16 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
  },
  segmentsContainer: {
    marginTop: 8,
  },
  segmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  segmentsTitle: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.bold,
    fontSize: 16,
  },
  addSegmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  addSegmentText: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
  },
  segmentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  segmentNumber: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
  },
  segmentNurseSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  segmentNurseText: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
  },
  segmentNursePlaceholder: {
    color: Colors.textTertiary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    marginBottom: 6,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dateButtonText: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
  },
  dateButtonPlaceholder: {
    color: Colors.textTertiary,
  },
});

export default AgencyAssignNurseScreen;
