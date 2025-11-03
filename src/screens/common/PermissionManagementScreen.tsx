import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';
import ApiService from '../../services/api';
import { Typography } from '../../constants/typography';
import Responsive from '../../utils/responsive';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../navigation/AppNavigator';

interface Permission {
  id: number;
  code: string;
  name: string;
  category: string;
  resource: string;
  action: string;
  scope: string;
  description?: string;
}

interface PermissionGroup {
  global: Permission[];
  hospital: Permission[];
  unit: Permission[];
}

const PermissionManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const [myPermissions, setMyPermissions] = useState<PermissionGroup | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<PermissionGroup | null>(null);
  const [permissionMasters, setPermissionMasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'all' | 'users' | 'masters'>('my');

  const loadMyPermissions = async () => {
    try {
      const res = await ApiService.getMyPermissions();
      setMyPermissions(res.permissions || { global: [], hospital: [], unit: [] });
    } catch (e: any) {
      console.error('Failed to load permissions:', e);
    }
  };

  const loadAllPermissions = async () => {
    try {
      const res = await ApiService.getAllPermissions({ limit: 1000 });
      setAllPermissions(res.permissions || res || []);
    } catch (e: any) {
      console.error('Failed to load all permissions:', e);
    }
  };

  const loadPermissionMasters = async () => {
    try {
      const res = await ApiService.getPermissionMasters({ limit: 100 });
      setPermissionMasters(res.masters || res || []);
    } catch (e: any) {
      console.error('Failed to load permission masters:', e);
    }
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([
      loadMyPermissions(),
      activeTab === 'all' && loadAllPermissions(),
      activeTab === 'masters' && loadPermissionMasters(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleGrantPermission = async (userId: number, permissionCode: string) => {
    Alert.prompt(
      'Grant Permission',
      `Enter optional details for ${permissionCode}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Grant',
          onPress: async (notes) => {
            try {
              await ApiService.grantPermission(userId, {
                permissionCode,
                notes: notes || undefined,
              });
              Alert.alert('Success', 'Permission granted');
              if (selectedUserId === userId) {
                const res = await ApiService.getUserPermissions(userId);
                setUserPermissions(res.permissions || { global: [], hospital: [], unit: [] });
              }
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to grant permission');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleRevokePermission = async (userId: number, permissionCode: string) => {
    Alert.alert(
      'Revoke Permission',
      `Are you sure you want to revoke ${permissionCode}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.revokePermission(userId, { permissionCode });
              Alert.alert('Success', 'Permission revoked');
              if (selectedUserId === userId) {
                const res = await ApiService.getUserPermissions(userId);
                setUserPermissions(res.permissions || { global: [], hospital: [], unit: [] });
              }
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to revoke permission');
            }
          },
        },
      ]
    );
  };

  const renderPermissionItem = (permission: Permission, scope: 'global' | 'hospital' | 'unit', canManage = false, userId?: number) => (
    <View key={permission.id} style={styles.permissionItem}>
      <View style={styles.permissionInfo}>
        <Text style={styles.permissionCode}>{permission.code}</Text>
        <Text style={styles.permissionName}>{permission.name}</Text>
        <View style={styles.permissionMeta}>
          <Text style={styles.permissionCategory}>{permission.category}</Text>
          <Text style={styles.permissionScope}>{scope.toUpperCase()}</Text>
        </View>
      </View>
      {canManage && userId && (
        <TouchableOpacity
          style={styles.revokeButton}
          onPress={() => handleRevokePermission(userId, permission.code)}>
          <Text style={styles.revokeButtonText}>Revoke</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const filteredPermissions = allPermissions.filter((p) =>
    searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader
        title="Permission Management"
        showBackButton={true}
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}
        backButtonStyle={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#d1d5db' }}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}>
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>My Permissions</Text>
        </TouchableOpacity>
        {(user?.role === 'ADMIN' || user?.role === 'HR') && (
          <>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' && styles.tabActive]}
              onPress={() => setActiveTab('all')}>
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All Permissions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'masters' && styles.tabActive]}
              onPress={() => setActiveTab('masters')}>
              <Text style={[styles.tabText, activeTab === 'masters' && styles.tabTextActive]}>Templates</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {activeTab === 'my' && myPermissions && (
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Global Permissions</Text>
              {myPermissions.global.length > 0 ? (
                myPermissions.global.map((p) => renderPermissionItem(p, 'global'))
              ) : (
                <Text style={styles.emptyText}>No global permissions</Text>
              )}

              <Text style={styles.sectionTitle}>Hospital Permissions</Text>
              {myPermissions.hospital.length > 0 ? (
                myPermissions.hospital.map((p) => renderPermissionItem(p, 'hospital'))
              ) : (
                <Text style={styles.emptyText}>No hospital permissions</Text>
              )}

              <Text style={styles.sectionTitle}>Unit Permissions</Text>
              {myPermissions.unit.length > 0 ? (
                myPermissions.unit.map((p) => renderPermissionItem(p, 'unit'))
              ) : (
                <Text style={styles.emptyText}>No unit permissions</Text>
              )}
            </View>
          )}

          {activeTab === 'all' && (
            <View style={styles.content}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search permissions..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.textSecondary}
              />
              <FlatList
                data={filteredPermissions}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => renderPermissionItem(item, 'global')}
                scrollEnabled={false}
                ListEmptyComponent={<Text style={styles.emptyText}>No permissions found</Text>}
              />
            </View>
          )}

          {activeTab === 'masters' && (
            <View style={styles.content}>
              <Text style={styles.emptyText}>Permission Masters/Templates feature coming soon</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontFamily: Typography.fontFamily.bold },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginTop: 16, marginBottom: 12 },
  permissionItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  permissionInfo: { flex: 1 },
  permissionCode: { fontSize: 14, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary },
  permissionName: { fontSize: 16, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, marginTop: 4 },
  permissionMeta: { flexDirection: 'row', gap: 8, marginTop: 8 },
  permissionCategory: { fontSize: 12, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, backgroundColor: Colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  permissionScope: { fontSize: 12, fontFamily: Typography.fontFamily.bold, color: Colors.primary, backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  revokeButton: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  revokeButtonText: { fontSize: 12, fontFamily: Typography.fontFamily.bold, color: '#B91C1C' },
  searchInput: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, fontSize: 15, fontFamily: Typography.fontFamily.regular, borderWidth: 1, borderColor: Colors.border },
  emptyText: { fontSize: 14, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 20 },
});

export default PermissionManagementScreen;

