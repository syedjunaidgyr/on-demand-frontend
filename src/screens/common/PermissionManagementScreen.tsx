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
  const [activeTab, setActiveTab] = useState<'permissions' | 'masters' | 'userPerms' | 'grants'>('permissions');
  // Forms
  const [permForm, setPermForm] = useState({ name: '', code: '', description: '', category: '', resource: '', action: '', scope: '' });
  const [masterForm, setMasterForm] = useState({ name: '', code: '', role: '', isDefault: false });
  const [grantForm, setGrantForm] = useState({ userId: '', permissionCode: '', hospitalId: '', unitCode: '', expiresAt: '', notes: '' });
  const [revokeForm, setRevokeForm] = useState({ userId: '', permissionCode: '', hospitalId: '', unitCode: '' });
  const [applyMasterForm, setApplyMasterForm] = useState({ userId: '', masterId: '', hospitalId: '', unitCode: '' });
  const [userPermsUserId, setUserPermsUserId] = useState('');

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
    try {
      await loadMyPermissions();
      if (activeTab === 'permissions') await loadAllPermissions();
      if (activeTab === 'masters') await loadPermissionMasters();
      if (activeTab === 'userPerms' && userPermsUserId) {
        const res = await ApiService.getUserPermissions(Number(userPermsUserId));
        setUserPermissions(res.permissions || { global: [], hospital: [], unit: [] });
      }
    } finally {
      setLoading(false);
    }
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
        <TouchableOpacity style={[styles.tab, activeTab === 'permissions' && styles.tabActive]} onPress={() => setActiveTab('permissions')}>
          <Text style={[styles.tabText, activeTab === 'permissions' && styles.tabTextActive]}>Permissions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'masters' && styles.tabActive]} onPress={() => setActiveTab('masters')}>
          <Text style={[styles.tabText, activeTab === 'masters' && styles.tabTextActive]}>Masters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'userPerms' && styles.tabActive]} onPress={() => setActiveTab('userPerms')}>
          <Text style={[styles.tabText, activeTab === 'userPerms' && styles.tabTextActive]}>User Permissions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'grants' && styles.tabActive]} onPress={() => setActiveTab('grants')}>
          <Text style={[styles.tabText, activeTab === 'grants' && styles.tabTextActive]}>Grants</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {activeTab === 'permissions' && (
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>All Permissions</Text>
              <TextInput style={styles.searchInput} placeholder="Filter by name/code..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={Colors.textSecondary} />
              <FlatList
                data={filteredPermissions}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => renderPermissionItem(item, 'global')}
                scrollEnabled={false}
                ListEmptyComponent={<Text style={styles.emptyText}>No permissions found</Text>}
              />
              {(user?.role === 'ADMIN') && (
                <>
                  <Text style={styles.sectionTitle}>Add Permission</Text>
                  <View style={{ gap: 8 }}>
                    <TextInput style={styles.input} placeholder="Name" value={permForm.name} onChangeText={(v)=>setPermForm({...permForm,name:v})} placeholderTextColor={Colors.textSecondary} />
                    <TextInput style={styles.input} placeholder="Code (UPPER_SNAKE)" autoCapitalize="characters" value={permForm.code} onChangeText={(v)=>setPermForm({...permForm,code:v})} placeholderTextColor={Colors.textSecondary} />
                    <TextInput style={styles.input} placeholder="Description" value={permForm.description} onChangeText={(v)=>setPermForm({...permForm,description:v})} placeholderTextColor={Colors.textSecondary} />
                    <TextInput style={styles.input} placeholder="Category" value={permForm.category} onChangeText={(v)=>setPermForm({...permForm,category:v})} placeholderTextColor={Colors.textSecondary} />
                    <TextInput style={styles.input} placeholder="Resource" value={permForm.resource} onChangeText={(v)=>setPermForm({...permForm,resource:v})} placeholderTextColor={Colors.textSecondary} />
                    <TextInput style={styles.input} placeholder="Action" value={permForm.action} onChangeText={(v)=>setPermForm({...permForm,action:v})} placeholderTextColor={Colors.textSecondary} />
                    <TextInput style={styles.input} placeholder="Scope" value={permForm.scope} onChangeText={(v)=>setPermForm({...permForm,scope:v})} placeholderTextColor={Colors.textSecondary} />
                    <TouchableOpacity style={styles.primaryBtn} onPress={async()=>{ try{ await ApiService.createPermission(permForm as any); Alert.alert('Success','Permission created'); await loadAllPermissions(); }catch(e:any){ Alert.alert('Error', e?.response?.data?.message||e?.message||'Failed'); } }}>
                      <Text style={styles.primaryBtnText}>Create</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}

          {activeTab === 'masters' && (
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Permission Masters</Text>
              {/* Simple create master form */}
              {(user?.role==='ADMIN') && (
                <View style={{ gap: 8 }}>
                  <TextInput style={styles.input} placeholder="Name" value={masterForm.name} onChangeText={(v)=>setMasterForm({...masterForm,name:v})} placeholderTextColor={Colors.textSecondary} />
                  <TextInput style={styles.input} placeholder="Code" value={masterForm.code} onChangeText={(v)=>setMasterForm({...masterForm,code:v})} placeholderTextColor={Colors.textSecondary} />
                  <TextInput style={styles.input} placeholder="Role" value={masterForm.role} onChangeText={(v)=>setMasterForm({...masterForm,role:v})} placeholderTextColor={Colors.textSecondary} />
                  <TouchableOpacity style={styles.primaryBtn} onPress={async()=>{ try{ await ApiService.createPermissionMaster({ ...masterForm, isDefault: false } as any); Alert.alert('Success','Master created'); await loadPermissionMasters(); }catch(e:any){ Alert.alert('Error', e?.response?.data?.message||e?.message||'Failed'); } }}>
                    <Text style={styles.primaryBtnText}>Create Master</Text>
                  </TouchableOpacity>
                </View>
              )}
              {/* Basic list placeholder */}
              <Text style={[styles.emptyText,{textAlign:'left',paddingHorizontal:0, paddingTop:12}]}>List and pick-lists can be expanded here.</Text>
            </View>
          )}

          {activeTab === 'userPerms' && (
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>User Permissions</Text>
              <TextInput style={styles.input} placeholder="User ID" value={userPermsUserId} onChangeText={setUserPermsUserId} keyboardType="number-pad" placeholderTextColor={Colors.textSecondary} />
              <TouchableOpacity style={styles.primaryBtn} onPress={async()=>{ try{ const res = await ApiService.getUserPermissions(Number(userPermsUserId)); setUserPermissions(res.permissions||{global:[],hospital:[],unit:[]}); }catch(e:any){ Alert.alert('Error', e?.response?.data?.message||e?.message||'Failed'); } }}>
                <Text style={styles.primaryBtnText}>Load</Text>
              </TouchableOpacity>
              {userPermissions && (
                <>
                  <Text style={styles.sectionTitle}>Global</Text>
                  {userPermissions.global?.map(p=>renderPermissionItem(p,'global'))}
                  <Text style={styles.sectionTitle}>Hospital</Text>
                  {userPermissions.hospital?.map(p=>renderPermissionItem(p,'hospital'))}
                  <Text style={styles.sectionTitle}>Unit</Text>
                  {userPermissions.unit?.map(p=>renderPermissionItem(p,'unit'))}
                </>
              )}
            </View>
          )}

          {activeTab === 'grants' && (
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Grant Permission</Text>
              <View style={{ gap: 8 }}>
                <TextInput style={styles.input} placeholder="User ID" value={grantForm.userId} onChangeText={(v)=>setGrantForm({...grantForm,userId:v})} keyboardType="number-pad" placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.input} placeholder="Permission Code" value={grantForm.permissionCode} onChangeText={(v)=>setGrantForm({...grantForm,permissionCode:v})} placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.input} placeholder="Hospital ID (optional)" value={grantForm.hospitalId} onChangeText={(v)=>setGrantForm({...grantForm,hospitalId:v})} keyboardType="number-pad" placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.input} placeholder="Unit Code (optional)" value={grantForm.unitCode} onChangeText={(v)=>setGrantForm({...grantForm,unitCode:v})} placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.input} placeholder="Expires At (ISO)" value={grantForm.expiresAt} onChangeText={(v)=>setGrantForm({...grantForm,expiresAt:v})} placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.input} placeholder="Notes" value={grantForm.notes} onChangeText={(v)=>setGrantForm({...grantForm,notes:v})} placeholderTextColor={Colors.textSecondary} />
                <TouchableOpacity style={styles.primaryBtn} onPress={async()=>{ try{ await ApiService.grantPermission(Number(grantForm.userId),{ permissionCode: grantForm.permissionCode, hospitalId: grantForm.hospitalId?Number(grantForm.hospitalId):undefined, unitCode: grantForm.unitCode||undefined, expiresAt: grantForm.expiresAt||undefined, notes: grantForm.notes||undefined }); Alert.alert('Success','Granted'); }catch(e:any){ Alert.alert('Error', e?.response?.data?.message||e?.message||'Failed'); } }}>
                  <Text style={styles.primaryBtnText}>Grant</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Revoke Permission</Text>
              <View style={{ gap: 8 }}>
                <TextInput style={styles.input} placeholder="User ID" value={revokeForm.userId} onChangeText={(v)=>setRevokeForm({...revokeForm,userId:v})} keyboardType="number-pad" placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.input} placeholder="Permission Code" value={revokeForm.permissionCode} onChangeText={(v)=>setRevokeForm({...revokeForm,permissionCode:v})} placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.input} placeholder="Hospital ID (optional)" value={revokeForm.hospitalId} onChangeText={(v)=>setRevokeForm({...revokeForm,hospitalId:v})} keyboardType="number-pad" placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.input} placeholder="Unit Code (optional)" value={revokeForm.unitCode} onChangeText={(v)=>setRevokeForm({...revokeForm,unitCode:v})} placeholderTextColor={Colors.textSecondary} />
                <TouchableOpacity style={styles.primaryBtn} onPress={async()=>{ try{ await ApiService.revokePermission(Number(revokeForm.userId),{ permissionCode: revokeForm.permissionCode, hospitalId: revokeForm.hospitalId?Number(revokeForm.hospitalId):undefined, unitCode: revokeForm.unitCode||undefined }); Alert.alert('Success','Revoked'); }catch(e:any){ Alert.alert('Error', e?.response?.data?.message||e?.message||'Failed'); } }}>
                  <Text style={styles.primaryBtnText}>Revoke</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Apply Master</Text>
              <View style={{ gap: 8 }}>
                <TextInput style={styles.input} placeholder="User ID" value={applyMasterForm.userId} onChangeText={(v)=>setApplyMasterForm({...applyMasterForm,userId:v})} keyboardType="number-pad" placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.input} placeholder="Master ID" value={applyMasterForm.masterId} onChangeText={(v)=>setApplyMasterForm({...applyMasterForm,masterId:v})} keyboardType="number-pad" placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.input} placeholder="Hospital ID (optional)" value={applyMasterForm.hospitalId} onChangeText={(v)=>setApplyMasterForm({...applyMasterForm,hospitalId:v})} keyboardType="number-pad" placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.input} placeholder="Unit Code (optional)" value={applyMasterForm.unitCode} onChangeText={(v)=>setApplyMasterForm({...applyMasterForm,unitCode:v})} placeholderTextColor={Colors.textSecondary} />
                <TouchableOpacity style={styles.primaryBtn} onPress={async()=>{ try{ await ApiService.applyPermissionMaster(Number(applyMasterForm.userId),{ masterId: Number(applyMasterForm.masterId), hospitalId: applyMasterForm.hospitalId?Number(applyMasterForm.hospitalId):undefined, unitCode: applyMasterForm.unitCode||undefined }); Alert.alert('Success','Master applied'); }catch(e:any){ Alert.alert('Error', e?.response?.data?.message||e?.message||'Failed'); } }}>
                  <Text style={styles.primaryBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
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

