import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import ApiService from '../../services/api';
import { Typography } from '../../constants/typography';

type Params = {
  userId: number;
};

const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value ?? '-'}</Text>
  </View>
);

const AgencyNurseDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const { userId } = (route.params || {}) as Params;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getUserById(String(userId));
      setUser(res?.user || res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}> 
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loading}>Loading nurse…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{user?.firstName} {user?.lastName}</Text>
        <View style={styles.card}>
          <Row label="Email" value={user?.email} />
          <Row label="Phone" value={user?.phone} />
          <Row label="Role" value={user?.role} />
          <Row label="Department" value={user?.department} />
          <Row label="Location" value={user?.location} />
          <Row label="License" value={user?.licenseNumber} />
          <Row label="Last Login" value={user?.lastLogin} />
          <Row label="Address" value={user?.address?.street} />
          <Row label="City" value={user?.address?.city} />
          <Row label="State" value={user?.address?.state} />
          <Row label="Zip" value={user?.address?.zipCode} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F9FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loading: { marginTop: 8, color: '#6B7280', fontFamily: Typography.fontFamily.medium },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontFamily: Typography.fontFamily.bold, color: '#111827', marginBottom: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { color: '#6B7280', fontFamily: Typography.fontFamily.medium },
  value: { color: '#111827', fontFamily: Typography.fontFamily.medium, maxWidth: '60%' },
});

export default AgencyNurseDetailsScreen;


