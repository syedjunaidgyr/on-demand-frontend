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
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';
import ApiService from '../../services/api';
import HospitalAdminApi from '../../services/hospitalAdminApi';
import { Typography } from '../../constants/typography';
import Responsive from '../../utils/responsive';
import { useGlobalStyles } from '../../theme/globalStyles';
import { useAppColors } from '../../hooks/useAppColors';
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

interface Hospital {
  id: number;
  name: string;
  code: string;
}

const PermissionManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const g = useGlobalStyles();
  const appColors = useAppColors();
  const isAdmin = user?.role === 'ADMIN';
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN';

  const [userProfile, setUserProfile] = useState<any>(null);
  const [myPermissions, setMyPermissions] = useState<PermissionGroup | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<PermissionGroup | null>(null);
  const [permissionMasters, setPermissionMasters] = useState<any[]>([]);
  const [hospitalPermissions, setHospitalPermissions] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'permissions' | 'masters' | 'userPerms' | 'grants' | 'hospitalPerms'>('permissions');
  const [showHospitalPicker, setShowHospitalPicker] = useState(false);

  // Forms
  const [permForm, setPermForm] = useState({ name: '', code: '', description: '', category: '', resource: '', action: '', scope: '' });
  const [masterForm, setMasterForm] = useState({ name: '', code: '', role: '', description: '', isDefault: false });
  const [grantForm, setGrantForm] = useState({ userId: '', permissionCode: '', hospitalId: '', unitCode: '', expiresAt: '', notes: '' });
  const [revokeForm, setRevokeForm] = useState({ userId: '', permissionCode: '', hospitalId: '', unitCode: '' });
  const [applyMasterForm, setApplyMasterForm] = useState({ userId: '', masterId: '', hospitalId: '', unitCode: '' });
  const [userPermsUserId, setUserPermsUserId] = useState('');
  // Generic pickers
  const [showUserPicker, setShowUserPicker] = useState<false | 'userPerms' | 'grants' | 'revoke' | 'apply'>(false);
  const [pickerUsers, setPickerUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Permission picker modal state
  const [showPermissionPicker, setShowPermissionPicker] = useState<false | 'grant' | 'revoke'>(false);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [showMasterPicker, setShowMasterPicker] = useState(false);
  const [masterSearch, setMasterSearch] = useState('');

  // Load user profile to get hospitalId for Hospital Admin
  useEffect(() => {
    // Respect initialTab from navigation
    try {
      const initialTab = (route as any)?.params?.initialTab;
      if (initialTab) setActiveTab(initialTab);
    } catch {}

    const loadUserProfile = async () => {
      try {
        const profile: any = await ApiService.getProfile();
        setUserProfile(profile);
        // Auto-set hospitalId for Hospital Admin
        if (isHospitalAdmin && profile?.hospitalId) {
          setSelectedHospitalId(profile.hospitalId as number);
          setGrantForm({ ...grantForm, hospitalId: String(profile.hospitalId) });
          setRevokeForm({ ...revokeForm, hospitalId: String(profile.hospitalId) });
          setApplyMasterForm({ ...applyMasterForm, hospitalId: String(profile.hospitalId) });
        }
      } catch (e: any) {
        console.error('Failed to load user profile:', e);
      }
    };
    loadUserProfile();
  }, []);

  // Load hospitals list for Admin
  useEffect(() => {
    if (isAdmin) {
      const loadHospitals = async () => {
        try {
          const res = await ApiService.listHospitals();
          setHospitals(res.hospitals || res || []);
        } catch (e: any) {
          console.error('Failed to load hospitals:', e);
        }
      };
      loadHospitals();
    }
  }, [isAdmin]);

  const loadMyPermissions = async () => {
    try {
      const params: any = {};
      if (isHospitalAdmin && userProfile?.hospitalId) {
        params.hospitalId = userProfile.hospitalId;
      }
      const res = await ApiService.getMyPermissions(params);
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

  const loadHospitalPermissions = async () => {
    if (!selectedHospitalId) {
      setHospitalPermissions([]);
      return;
    }
    try {
      const res = await ApiService.getHospitalPermissions(selectedHospitalId);
      setHospitalPermissions(res.permissions || []);
    } catch (e: any) {
      console.error('Failed to load hospital permissions:', e);
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load hospital permissions');
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      await loadMyPermissions();
      if (activeTab === 'permissions') await loadAllPermissions();
      if (activeTab === 'masters') await loadPermissionMasters();
      if (activeTab === 'hospitalPerms') await loadHospitalPermissions();
      if (activeTab === 'userPerms' && userPermsUserId) {
        const params: any = {};
        if (isHospitalAdmin && userProfile?.hospitalId) {
          params.hospitalId = userProfile.hospitalId;
        }
        const res = await ApiService.getUserPermissions(Number(userPermsUserId), params);
        setUserPermissions(res.permissions || { global: [], hospital: [], unit: [] });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeTab, selectedHospitalId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleGrantPermission = async () => {
    try {
      const data: any = {
        permissionCode: grantForm.permissionCode,
      };
      
      // For Hospital Admin, always use their hospitalId
      if (isHospitalAdmin && userProfile?.hospitalId) {
        data.hospitalId = userProfile.hospitalId;
      } else if (isAdmin && grantForm.hospitalId) {
        data.hospitalId = Number(grantForm.hospitalId);
      }
      
      if (grantForm.unitCode) {
        data.unitCode = grantForm.unitCode;
      }
      if (grantForm.expiresAt) {
        data.expiresAt = grantForm.expiresAt;
      }
      if (grantForm.notes) {
        data.notes = grantForm.notes;
      }

      await ApiService.grantPermission(Number(grantForm.userId), data);
      Alert.alert('Success', 'Permission granted successfully');
      setGrantForm({ userId: '', permissionCode: '', hospitalId: '', unitCode: '', expiresAt: '', notes: '' });
      if (isHospitalAdmin) {
        setGrantForm({ ...grantForm, hospitalId: String(userProfile?.hospitalId || '') });
      }
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to grant permission');
    }
  };

  const handleRevokePermission = async (userIdParam?: number, permissionCodeParam?: string) => {
    try {
      // Determine source: direct item action vs form
      const targetUserId = typeof userIdParam === 'number' ? userIdParam : Number(revokeForm.userId);
      const rawCode = permissionCodeParam ?? revokeForm.permissionCode;
      if (!targetUserId || !rawCode) {
        Alert.alert('Validation', 'User ID and permission code are required');
        return;
      }

      // Accept numeric IDs or string codes
      const isNumeric = /^\d+$/.test(String(rawCode));
      const data: any = {
        permissionCode: isNumeric ? String(rawCode) : String(rawCode).toUpperCase(),
      };
      
      // For Hospital Admin, always use their hospitalId
      if (isHospitalAdmin && userProfile?.hospitalId) {
        data.hospitalId = userProfile.hospitalId;
      } else if (isAdmin && revokeForm.hospitalId) {
        data.hospitalId = Number(revokeForm.hospitalId);
      }
      
      if (revokeForm.unitCode) {
        data.unitCode = revokeForm.unitCode;
      }
      await ApiService.revokePermission(targetUserId, data);
      Alert.alert('Success', 'Permission revoked successfully');
      setRevokeForm({ userId: '', permissionCode: '', hospitalId: '', unitCode: '' });
      if (isHospitalAdmin) {
        setRevokeForm({ ...revokeForm, hospitalId: String(userProfile?.hospitalId || '') });
      }
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to revoke permission');
    }
  };

  const handleApplyMaster = async () => {
    try {
      const data: any = {
        masterId: Number(applyMasterForm.masterId),
      };
      
      // For Hospital Admin, always use their hospitalId
      if (isHospitalAdmin && userProfile?.hospitalId) {
        data.hospitalId = userProfile.hospitalId;
      } else if (isAdmin && applyMasterForm.hospitalId) {
        data.hospitalId = Number(applyMasterForm.hospitalId);
      }
      
      if (applyMasterForm.unitCode) {
        data.unitCode = applyMasterForm.unitCode;
      }

      await ApiService.applyPermissionMaster(Number(applyMasterForm.userId), data);
      Alert.alert('Success', 'Permission master applied successfully');
      setApplyMasterForm({ userId: '', masterId: '', hospitalId: '', unitCode: '' });
      if (isHospitalAdmin) {
        setApplyMasterForm({ ...applyMasterForm, hospitalId: String(userProfile?.hospitalId || '') });
      }
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to apply permission master');
    }
  };

  const renderPermissionItem = (permission: Permission, scope: 'global' | 'hospital' | 'unit', canManage = false, userId?: number) => (
    <View key={permission.id} style={[styles.permissionItem, { backgroundColor: appColors.accentText }]}>
      <View style={styles.permissionInfo}>
        <Text style={[styles.permissionCode, { color: appColors.textPrimary }]}>{permission.code}</Text>
        <Text style={[styles.permissionName, { color: appColors.textPrimary }]}>{permission.name}</Text>
        <View style={styles.permissionMeta}>
          <Text style={[styles.permissionCategory, { color: appColors.textSecondary, backgroundColor: appColors.background }]}>{permission.category}</Text>
          <Text style={[styles.permissionScope, { color: appColors.primary }]}>{scope.toUpperCase()}</Text>
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

  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);

  return (
    <SafeAreaView style={g.appBackground}>
      <StatusBar backgroundColor={appColors.background} barStyle={appColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />
      
      <GlobalHeader
        title="Permission Management"
        showBackButton={true}
        backgroundColor={appColors.accentText}
        titleColor={appColors.textPrimary}
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}
        backButtonStyle={{ backgroundColor: appColors.accentText, borderWidth: 1, borderColor: appColors.border }}
      />

      {/* Role Indicator */}
      {/* {(isHospitalAdmin || isAdmin) && (
        <View style={[styles.roleIndicator, { backgroundColor: isAdmin ? '#DCFCE7' : '#DBEAFE' }]}>
          <Text style={[styles.roleText, { color: isAdmin ? '#166534' : '#1E40AF' }]}>
            {isAdmin ? 'System Admin - Full Access' : `Hospital Admin - Hospital ID: ${userProfile?.hospitalId || 'N/A'}`}
          </Text>
        </View>
      )} */}

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: appColors.accentText, borderBottomColor: appColors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          <TouchableOpacity style={[styles.tab, activeTab === 'permissions' && styles.tabActive]} onPress={() => setActiveTab('permissions')}>
            <Text style={[styles.tabText, activeTab === 'permissions' && styles.tabTextActive, { color: activeTab === 'permissions' ? appColors.primary : appColors.textSecondary }]}>Permissions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'masters' && styles.tabActive]} onPress={() => setActiveTab('masters')}>
            <Text style={[styles.tabText, activeTab === 'masters' && styles.tabTextActive, { color: activeTab === 'masters' ? appColors.primary : appColors.textSecondary }]}>Masters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'userPerms' && styles.tabActive]} onPress={() => setActiveTab('userPerms')}>
            <Text style={[styles.tabText, activeTab === 'userPerms' && styles.tabTextActive, { color: activeTab === 'userPerms' ? appColors.primary : appColors.textSecondary }]}>User Perms</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'grants' && styles.tabActive]} onPress={() => setActiveTab('grants')}>
            <Text style={[styles.tabText, activeTab === 'grants' && styles.tabTextActive, { color: activeTab === 'grants' ? appColors.primary : appColors.textSecondary }]}>Grants</Text>
          </TouchableOpacity>
          {(isAdmin || isHospitalAdmin) && (
            <TouchableOpacity style={[styles.tab, activeTab === 'hospitalPerms' && styles.tabActive]} onPress={() => setActiveTab('hospitalPerms')}>
              <Text style={[styles.tabText, activeTab === 'hospitalPerms' && styles.tabTextActive, { color: activeTab === 'hospitalPerms' ? appColors.primary : appColors.textSecondary }]}>Hospital</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Quick actions to jump to sections */}
      <View style={[styles.quickNavRow, { backgroundColor: appColors.accentText, borderColor: appColors.border }]}>
        <TouchableOpacity style={styles.quickNavBtn} onPress={() => setActiveTab('permissions')}>
          <Text style={[styles.quickNavText, { color: appColors.textPrimary }]}>Definitions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickNavBtn} onPress={() => setActiveTab('masters')}>
          <Text style={[styles.quickNavText, { color: appColors.textPrimary }]}>Masters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickNavBtn} onPress={() => setActiveTab('userPerms')}>
          <Text style={[styles.quickNavText, { color: appColors.textPrimary }]}>User Perms</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickNavBtn} onPress={() => setActiveTab('grants')}>
          <Text style={[styles.quickNavText, { color: appColors.textPrimary }]}>Grants</Text>
        </TouchableOpacity>
        {(isAdmin || isHospitalAdmin) && (
          <TouchableOpacity style={styles.quickNavBtn} onPress={() => setActiveTab('hospitalPerms')}>
            <Text style={[styles.quickNavText, { color: appColors.textPrimary }]}>Hospital</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text style={[styles.loadingText, { color: appColors.textSecondary }]}>Loading...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appColors.primary} />}>
          
          {activeTab === 'permissions' && (
            <View style={styles.content}>
              <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>All Permissions</Text>
              <TextInput 
                style={[styles.searchInput, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} 
                placeholder="Filter by name/code..." 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
                placeholderTextColor={appColors.textSecondary} 
              />
              <FlatList
                data={filteredPermissions}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => renderPermissionItem(item, 'global')}
                scrollEnabled={false}
                ListEmptyComponent={<Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No permissions found</Text>}
              />
              {(isAdmin || isHospitalAdmin) && (
                <>
                  <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Add Permission</Text>
                  <View style={{ gap: 8 }}>
                    <TextInput style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} placeholder="Name" value={permForm.name} onChangeText={(v)=>setPermForm({...permForm,name:v})} placeholderTextColor={appColors.textSecondary} />
                    <TextInput style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} placeholder="Code (UPPER_SNAKE)" autoCapitalize="characters" value={permForm.code} onChangeText={(v)=>setPermForm({...permForm,code:v})} placeholderTextColor={appColors.textSecondary} />
                    <TextInput style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} placeholder="Description" value={permForm.description} onChangeText={(v)=>setPermForm({...permForm,description:v})} placeholderTextColor={appColors.textSecondary} />
                    <TextInput style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} placeholder="Category" value={permForm.category} onChangeText={(v)=>setPermForm({...permForm,category:v})} placeholderTextColor={appColors.textSecondary} />
                    <TextInput style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} placeholder="Resource" value={permForm.resource} onChangeText={(v)=>setPermForm({...permForm,resource:v})} placeholderTextColor={appColors.textSecondary} />
                    <TextInput style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} placeholder="Action (CREATE/READ/UPDATE/DELETE/ASSIGN/APPROVE/REJECT/EXPORT/IMPORT)" autoCapitalize="characters" value={permForm.action} onChangeText={(v)=>setPermForm({...permForm,action:v})} placeholderTextColor={appColors.textSecondary} />
                    <TextInput style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} placeholder="Scope (GLOBAL/HOSPITAL/UNIT)" autoCapitalize="characters" value={permForm.scope} onChangeText={(v)=>setPermForm({...permForm,scope:v})} placeholderTextColor={appColors.textSecondary} />
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: appColors.primary }]} onPress={async()=>{ 
                      try{ 
                        const allowedActions = ['CREATE','READ','UPDATE','DELETE','ASSIGN','APPROVE','REJECT','EXPORT','IMPORT'];
                        const payload:any = {
                          name: permForm.name?.trim(),
                          code: String(permForm.code||'').trim().toUpperCase(),
                          description: permForm.description?.trim() || undefined,
                          category: String(permForm.category||'').trim().toUpperCase(),
                          resource: String(permForm.resource||'').trim().toUpperCase(),
                          action: String(permForm.action||'').trim().toUpperCase(),
                          scope: String(permForm.scope||'').trim().toUpperCase(),
                        };
                        if (!payload.name || !payload.code || !payload.category || !payload.resource || !payload.action) {
                          Alert.alert('Validation','Please fill all required fields');
                          return;
                        }
                        if (!allowedActions.includes(payload.action)) {
                          Alert.alert('Validation','Action must be one of: '+allowedActions.join(', '));
                          return;
                        }
                        if (isHospitalAdmin) {
                          payload.scope = 'HOSPITAL';
                        }
                        await ApiService.createPermission(payload);
                        Alert.alert('Success','Permission created');
                        await loadAllPermissions();
                        setPermForm({ name: '', code: '', description: '', category: '', resource: '', action: '', scope: '' });
                      }catch(e:any){ 
                        Alert.alert('Error', e?.response?.data?.message||e?.message||'Failed'); 
                      } 
                    }}>
                      <Text style={[styles.primaryBtnText, { color: appColors.accentText }]}>Create</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              {/* Info box removed; Hospital Admins can create hospital-scoped permissions */}
            </View>
          )}

          {activeTab === 'masters' && (
            <View style={styles.content}>
              <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Permission Masters</Text>
              {(isAdmin || isHospitalAdmin) && (
                <View style={{ gap: 8 }}>
                  <Text style={[styles.sectionSubtitle, { color: appColors.textSecondary, fontSize: 13, marginBottom: 8 }]}>
                    {isHospitalAdmin ? 'Create permission masters for your hospital' : 'Create system-wide permission masters'}
                  </Text>
                  <TextInput style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} placeholder="Name" value={masterForm.name} onChangeText={(v)=>setMasterForm({...masterForm,name:v})} placeholderTextColor={appColors.textSecondary} />
                  <TextInput style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} placeholder="Code" value={masterForm.code} onChangeText={(v)=>setMasterForm({...masterForm,code:v})} placeholderTextColor={appColors.textSecondary} />
                  <TextInput style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} placeholder="Role" value={masterForm.role} onChangeText={(v)=>setMasterForm({...masterForm,role:v})} placeholderTextColor={appColors.textSecondary} />
                  <TextInput style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} placeholder="Description (optional)" value={masterForm.description || ''} onChangeText={(v)=>setMasterForm({...masterForm,description:v})} placeholderTextColor={appColors.textSecondary} />
                  {isHospitalAdmin && (
                    <View style={[styles.infoBox, { backgroundColor: '#DBEAFE', marginTop: 8 }]}>
                      <Text style={[styles.infoText, { color: '#1E40AF', fontSize: 12 }]}>
                        Note: Hospital Admin can create permission masters. These will be scoped to your hospital.
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: appColors.primary }]} onPress={async()=>{ 
                    try{ 
                      const masterData: any = { 
                        ...masterForm, 
                        isDefault: false 
                      };
                      // Hospital Admin masters are implicitly hospital-scoped via backend
                      await ApiService.createPermissionMaster(masterData);
                      Alert.alert('Success','Permission master created successfully');
                      await loadPermissionMasters();
                      setMasterForm({ name: '', code: '', role: '', description: '', isDefault: false });
                    }catch(e:any){ 
                      Alert.alert('Error', e?.response?.data?.message||e?.message||'Failed to create permission master'); 
                    } 
                  }}>
                    <Text style={[styles.primaryBtnText, { color: appColors.accentText }]}>Create Master</Text>
                  </TouchableOpacity>
                </View>
              )}
              <FlatList
                data={permissionMasters}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <View style={[styles.permissionItem, { backgroundColor: appColors.accentText }]}>
                    <View style={styles.permissionInfo}>
                      <Text style={[styles.permissionCode, { color: appColors.textPrimary }]}>{item.code}</Text>
                      <Text style={[styles.permissionName, { color: appColors.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.permissionCategory, { color: appColors.textSecondary }]}>
                        Role: {item.role || 'N/A'} | {item.description || 'No description'}
                      </Text>
                      {item.permissions && (
                        <Text style={[styles.permissionCategory, { color: appColors.textSecondary, fontSize: 11, marginTop: 4 }]}>
                          {item.permissions.length} global, {item.hospitalPermissions?.length || 0} hospital, {item.unitPermissions?.length || 0} unit permissions
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                scrollEnabled={false}
                ListEmptyComponent={<Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No permission masters found</Text>}
              />
            </View>
          )}

          {activeTab === 'userPerms' && (
            <View style={styles.content}>
              <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>User Permissions</Text>
              <TouchableOpacity 
                style={[styles.input, styles.pickerInput, { backgroundColor: appColors.accentText, borderColor: appColors.border }]} 
                onPress={async () => {
                  try {
                    setShowUserPicker('userPerms');
                    // Lightweight load of users (role-aware)
                    const res: any = isHospitalAdmin
                      ? await HospitalAdminApi.getUsers({ page: 1, limit: 200, ...(userSearch ? { search: userSearch } : {}) } as any)
                      : await ApiService.getAllUsers({ page: 1, limit: 200 });
                    setPickerUsers((res && (res.users || res.data)) || res || []);
                  } catch (e) {
                    setPickerUsers([]);
                  }
                }}>
                <Text style={[styles.pickerText, { color: userPermsUserId ? appColors.textPrimary : appColors.textSecondary }]}>
                  {userPermsUserId ? `User ID: ${userPermsUserId}` : 'Select User'}
                </Text>
                <FontAwesomeIcon icon="chevron-down" size={16} color={appColors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: appColors.primary }]} 
                onPress={async()=>{ 
                  try{ 
                    const params: any = {};
                    if (isHospitalAdmin && userProfile?.hospitalId) {
                      params.hospitalId = userProfile.hospitalId;
                    }
                    const res = await ApiService.getUserPermissions(Number(userPermsUserId), params);
                    setUserPermissions(res.permissions||{global:[],hospital:[],unit:[]});
                  }catch(e:any){ 
                    Alert.alert('Error', e?.response?.data?.message||e?.message||'Failed'); 
                  } 
                }}>
                <Text style={[styles.primaryBtnText, { color: appColors.accentText }]}>Load</Text>
              </TouchableOpacity>
              {userPermissions && (
                <>
                  <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Global</Text>
                  {userPermissions.global?.map(p=>renderPermissionItem(p,'global'))}
                  {userPermissions.global?.length === 0 && <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No global permissions</Text>}
                  <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Hospital</Text>
                  {userPermissions.hospital?.map(p=>renderPermissionItem(p,'hospital'))}
                  {userPermissions.hospital?.length === 0 && <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No hospital permissions</Text>}
                  <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Unit</Text>
                  {userPermissions.unit?.map(p=>renderPermissionItem(p,'unit'))}
                  {userPermissions.unit?.length === 0 && <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No unit permissions</Text>}
                </>
              )}
            </View>
          )}

          {activeTab === 'grants' && (
            <View style={styles.content}>
              <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Grant Permission</Text>
              <View style={{ gap: 8 }}>
                <TouchableOpacity 
                  style={[styles.input, styles.pickerInput, { backgroundColor: appColors.accentText, borderColor: appColors.border }]} 
                  onPress={async () => {
                    try {
                      setShowUserPicker('grants');
                      const res: any = isHospitalAdmin
                        ? await HospitalAdminApi.getUsers({ page: 1, limit: 200, ...(userSearch ? { search: userSearch } : {}) } as any)
                        : await ApiService.getAllUsers({ page: 1, limit: 200 });
                      setPickerUsers((res && (res.users || res.data)) || res || []);
                    } catch (e) { setPickerUsers([]); }
                  }}>
                  <Text style={[styles.pickerText, { color: grantForm.userId ? appColors.textPrimary : appColors.textSecondary }]}>
                    {grantForm.userId ? `User ID: ${grantForm.userId}` : 'Select User'}
                  </Text>
                  <FontAwesomeIcon icon="chevron-down" size={16} color={appColors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.input, styles.pickerInput, { backgroundColor: appColors.accentText, borderColor: appColors.border }]} 
                  onPress={() => setShowPermissionPicker('grant')}>
                  <Text style={[styles.pickerText, { color: grantForm.permissionCode ? appColors.textPrimary : appColors.textSecondary }]}>
                    {grantForm.permissionCode ? `Permission ID/Code: ${grantForm.permissionCode}` : 'Select Permission'}
                  </Text>
                  <FontAwesomeIcon icon="chevron-down" size={16} color={appColors.textSecondary} />
                </TouchableOpacity>
                {isAdmin && (
                  <TouchableOpacity 
                    style={[styles.input, styles.pickerInput, { backgroundColor: appColors.accentText, borderColor: appColors.border }]} 
                    onPress={() => setShowHospitalPicker(true)}
                  >
                    <Text style={[styles.pickerText, { color: grantForm.hospitalId ? appColors.textPrimary : appColors.textSecondary }]}>
                      {grantForm.hospitalId ? `Hospital ID: ${grantForm.hospitalId}` : 'Select Hospital (optional for global)'}
                    </Text>
                    <FontAwesomeIcon icon="chevron-down" size={16} color={appColors.textSecondary} />
                  </TouchableOpacity>
                )}
                {isHospitalAdmin && (
                  <View style={[styles.infoBox, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={[styles.infoText, { color: '#1E40AF' }]}>
                      Hospital ID: {userProfile?.hospitalId || 'N/A'} (Auto-scoped to your hospital)
                    </Text>
                  </View>
                )}
                <TextInput 
                  style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} 
                  placeholder="Unit Code (optional, requires Hospital ID)" 
                  value={grantForm.unitCode} 
                  onChangeText={(v)=>setGrantForm({...grantForm,unitCode:v})} 
                  placeholderTextColor={appColors.textSecondary} 
                />
                <TextInput 
                  style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} 
                  placeholder="Expires At (ISO format, optional)" 
                  value={grantForm.expiresAt} 
                  onChangeText={(v)=>setGrantForm({...grantForm,expiresAt:v})} 
                  placeholderTextColor={appColors.textSecondary} 
                />
                <TextInput 
                  style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} 
                  placeholder="Notes (optional)" 
                  value={grantForm.notes} 
                  onChangeText={(v)=>setGrantForm({...grantForm,notes:v})} 
                  placeholderTextColor={appColors.textSecondary} 
                />
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: appColors.primary }]} onPress={handleGrantPermission}>
                  <Text style={[styles.primaryBtnText, { color: appColors.accentText }]}>Grant</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Revoke Permission</Text>
              <View style={{ gap: 8 }}>
                <TouchableOpacity 
                  style={[styles.input, styles.pickerInput, { backgroundColor: appColors.accentText, borderColor: appColors.border }]} 
                  onPress={async () => {
                    try {
                      setShowUserPicker('revoke');
                      const res: any = isHospitalAdmin
                        ? await HospitalAdminApi.getUsers({ page: 1, limit: 200, ...(userSearch ? { search: userSearch } : {}) } as any)
                        : await ApiService.getAllUsers({ page: 1, limit: 200 });
                      setPickerUsers((res && (res.users || res.data)) || res || []);
                    } catch (e) { setPickerUsers([]); }
                  }}>
                  <Text style={[styles.pickerText, { color: revokeForm.userId ? appColors.textPrimary : appColors.textSecondary }]}>
                    {revokeForm.userId ? `User ID: ${revokeForm.userId}` : 'Select User'}
                  </Text>
                  <FontAwesomeIcon icon="chevron-down" size={16} color={appColors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.input, styles.pickerInput, { backgroundColor: appColors.accentText, borderColor: appColors.border }]} 
                  onPress={() => setShowPermissionPicker('revoke')}>
                  <Text style={[styles.pickerText, { color: revokeForm.permissionCode ? appColors.textPrimary : appColors.textSecondary }]}>
                    {revokeForm.permissionCode ? `Permission ID/Code: ${revokeForm.permissionCode}` : 'Select Permission'}
                  </Text>
                  <FontAwesomeIcon icon="chevron-down" size={16} color={appColors.textSecondary} />
                </TouchableOpacity>
                {isAdmin && (
                  <TouchableOpacity 
                    style={[styles.input, styles.pickerInput, { backgroundColor: appColors.accentText, borderColor: appColors.border }]} 
                    onPress={() => Alert.alert('Info', 'Enter Hospital ID in the text field below if revoking hospital/unit-scoped permission')}
                  >
                    <Text style={[styles.pickerText, { color: appColors.textSecondary }]}>
                      Hospital ID (optional - enter manually)
                    </Text>
                  </TouchableOpacity>
                )}
                {isHospitalAdmin && (
                  <View style={[styles.infoBox, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={[styles.infoText, { color: '#1E40AF' }]}>
                      Hospital ID: {userProfile?.hospitalId || 'N/A'} (Auto-scoped)
                    </Text>
                  </View>
                )}
                <TextInput 
                  style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} 
                  placeholder="Hospital ID (optional, for hospital/unit scoped)" 
                  value={revokeForm.hospitalId} 
                  onChangeText={(v)=>setRevokeForm({...revokeForm,hospitalId:v})} 
                  keyboardType="number-pad" 
                  placeholderTextColor={appColors.textSecondary} 
                />
                <TextInput 
                  style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} 
                  placeholder="Unit Code (optional)" 
                  value={revokeForm.unitCode} 
                  onChangeText={(v)=>setRevokeForm({...revokeForm,unitCode:v})} 
                  placeholderTextColor={appColors.textSecondary} 
                />
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#EF4444' }]} onPress={() => handleRevokePermission()}>
                  <Text style={[styles.primaryBtnText, { color: appColors.accentText }]}>Revoke</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Apply Master</Text>
              <View style={{ gap: 8 }}>
                <TouchableOpacity 
                  style={[styles.input, styles.pickerInput, { backgroundColor: appColors.accentText, borderColor: appColors.border }]} 
                  onPress={async () => {
                    try {
                      setShowUserPicker('apply');
                      const res: any = isHospitalAdmin
                        ? await HospitalAdminApi.getUsers({ page: 1, limit: 200, ...(userSearch ? { search: userSearch } : {}) } as any)
                        : await ApiService.getAllUsers({ page: 1, limit: 200 });
                      setPickerUsers((res && (res.users || res.data)) || res || []);
                    } catch (e) { setPickerUsers([]); }
                  }}>
                  <Text style={[styles.pickerText, { color: applyMasterForm.userId ? appColors.textPrimary : appColors.textSecondary }]}>
                    {applyMasterForm.userId ? `User ID: ${applyMasterForm.userId}` : 'Select User'}
                  </Text>
                  <FontAwesomeIcon icon="chevron-down" size={16} color={appColors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.input, styles.pickerInput, { backgroundColor: appColors.accentText, borderColor: appColors.border }]} 
                  onPress={() => {
                    // Masters already loaded in permissionMasters
                    setShowMasterPicker(true);
                  }}>
                  <Text style={[styles.pickerText, { color: applyMasterForm.masterId ? appColors.textPrimary : appColors.textSecondary }]}>
                    {applyMasterForm.masterId ? `Master ID: ${applyMasterForm.masterId}` : 'Select Master'}
                  </Text>
                  <FontAwesomeIcon icon="chevron-down" size={16} color={appColors.textSecondary} />
                </TouchableOpacity>
                {isAdmin && (
                  <TextInput 
                    style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} 
                    placeholder="Hospital ID (optional)" 
                    value={applyMasterForm.hospitalId} 
                    onChangeText={(v)=>setApplyMasterForm({...applyMasterForm,hospitalId:v})} 
                    keyboardType="number-pad" 
                    placeholderTextColor={appColors.textSecondary} 
                  />
                )}
                {isHospitalAdmin && (
                  <View style={[styles.infoBox, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={[styles.infoText, { color: '#1E40AF' }]}>
                      Hospital ID: {userProfile?.hospitalId || 'N/A'} (Auto-scoped)
                    </Text>
                  </View>
                )}
                <TextInput 
                  style={[styles.input, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]} 
                  placeholder="Unit Code (optional)" 
                  value={applyMasterForm.unitCode} 
                  onChangeText={(v)=>setApplyMasterForm({...applyMasterForm,unitCode:v})} 
                  placeholderTextColor={appColors.textSecondary} 
                />
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: appColors.primary }]} onPress={handleApplyMaster}>
                  <Text style={[styles.primaryBtnText, { color: appColors.accentText }]}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'hospitalPerms' && (
            <View style={styles.content}>
              <Text style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Hospital Permissions</Text>
              {isAdmin && (
                <View style={{ marginBottom: 16 }}>
                  <TouchableOpacity 
                    style={[styles.input, styles.pickerInput, { backgroundColor: appColors.accentText, borderColor: appColors.border }]} 
                    onPress={() => setShowHospitalPicker(true)}
                  >
                    <Text style={[styles.pickerText, { color: selectedHospitalId ? appColors.textPrimary : appColors.textSecondary }]}>
                      {selectedHospital ? `${selectedHospital.name} (ID: ${selectedHospital.id})` : 'Select Hospital'}
                    </Text>
                    <FontAwesomeIcon icon="chevron-down" size={16} color={appColors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
              {isHospitalAdmin && (
                <View style={[styles.infoBox, { backgroundColor: '#DBEAFE', marginBottom: 16 }]}>
                  <Text style={[styles.infoText, { color: '#1E40AF' }]}>
                    Viewing permissions for your hospital: {userProfile?.hospitalId || 'N/A'}
                  </Text>
                </View>
              )}
              {selectedHospitalId || (isHospitalAdmin && userProfile?.hospitalId) ? (
                <FlatList
                  data={hospitalPermissions}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <View style={[styles.permissionItem, { backgroundColor: appColors.accentText }]}>
                      <View style={styles.permissionInfo}>
                        <Text style={[styles.permissionCode, { color: appColors.textPrimary }]}>{item.permission?.code || 'N/A'}</Text>
                        <Text style={[styles.permissionName, { color: appColors.textPrimary }]}>{item.permission?.name || 'N/A'}</Text>
                        <Text style={[styles.permissionCategory, { color: appColors.textSecondary }]}>
                          User: {item.user?.firstName} {item.user?.lastName} ({item.user?.email})
                        </Text>
                        {item.expiresAt && (
                          <Text style={[styles.permissionCategory, { color: '#EF4444' }]}>
                            Expires: {new Date(item.expiresAt).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                  scrollEnabled={false}
                  ListEmptyComponent={<Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No hospital permissions found</Text>}
                />
              ) : (
                <View style={[styles.infoBox, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.infoText, { color: '#92400E' }]}>
                    {isAdmin ? 'Please select a hospital to view permissions' : 'No hospital assigned'}
                  </Text>
                </View>
              )}
            </View>
          )}

        </ScrollView>
      )}

      {/* Hospital Picker Modal for Admin */}
      {isAdmin && (
        <Modal visible={showHospitalPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: appColors.accentText }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: appColors.textPrimary }]}>Select Hospital</Text>
                <TouchableOpacity onPress={() => setShowHospitalPicker(false)}>
                  <FontAwesomeIcon icon="times" size={20} color={appColors.textSecondary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={hospitals}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.hospitalOption, { backgroundColor: selectedHospitalId === item.id ? appColors.primary + '20' : 'transparent' }]}
                    onPress={() => {
                      setSelectedHospitalId(item.id);
                      setGrantForm({ ...grantForm, hospitalId: String(item.id) });
                      setShowHospitalPicker(false);
                    }}
                  >
                    <Text style={[styles.hospitalOptionText, { color: appColors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.hospitalOptionCode, { color: appColors.textSecondary }]}>{item.code}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No hospitals found</Text>}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Permission Picker Modal */}
      {!!showPermissionPicker && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: appColors.accentText }] }>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: appColors.textPrimary }]}>Select Permission</Text>
                <TouchableOpacity onPress={() => { setShowPermissionPicker(false); setPermissionSearch(''); }}>
                  <FontAwesomeIcon icon="times" size={20} color={appColors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={{ padding: 16 }}>
                <TextInput
                  style={[styles.searchInput, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]}
                  placeholder="Search by name or code"
                  placeholderTextColor={appColors.textSecondary}
                  value={permissionSearch}
                  onChangeText={setPermissionSearch}
                />
              </View>
              <FlatList
                data={allPermissions.filter(p => {
                  if (!permissionSearch) return true;
                  const q = permissionSearch.toLowerCase();
                  return (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q);
                })}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.hospitalOption]}
                    onPress={() => {
                      const pick = String(item.id);
                      if (showPermissionPicker === 'grant') {
                        setGrantForm({ ...grantForm, permissionCode: pick });
                      } else if (showPermissionPicker === 'revoke') {
                        setRevokeForm({ ...revokeForm, permissionCode: pick });
                      }
                      setShowPermissionPicker(false);
                      setPermissionSearch('');
                    }}
                  >
                    <Text style={[styles.hospitalOptionText, { color: appColors.textPrimary }]}>{item.name} ({item.code})</Text>
                    <Text style={[styles.hospitalOptionCode, { color: appColors.textSecondary }]}>ID: {item.id}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No permissions</Text>}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* User Picker Modal */}
      {!!showUserPicker && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: appColors.accentText }] }>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: appColors.textPrimary }]}>Select User</Text>
                <TouchableOpacity onPress={() => { setShowUserPicker(false); setUserSearch(''); }}>
                  <FontAwesomeIcon icon="times" size={20} color={appColors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={{ padding: 16 }}>
                <TextInput
                  style={[styles.searchInput, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]}
                  placeholder="Search by name or email"
                  placeholderTextColor={appColors.textSecondary}
                  value={userSearch}
                  onChangeText={setUserSearch}
                />
              </View>
              <FlatList
                data={pickerUsers.filter(u => {
                  if (!userSearch) return true;
                  const q = userSearch.toLowerCase();
                  const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
                  const email = (u.email || '').toLowerCase();
                  return name.includes(q) || email.includes(q);
                })}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.hospitalOption]}
                    onPress={() => {
                      const userId = String(item.id);
                      if (showUserPicker === 'userPerms') {
                        setUserPermsUserId(userId);
                      } else if (showUserPicker === 'grants') {
                        setGrantForm({ ...grantForm, userId });
                      } else if (showUserPicker === 'revoke') {
                        setRevokeForm({ ...revokeForm, userId });
                      } else if (showUserPicker === 'apply') {
                        setApplyMasterForm({ ...applyMasterForm, userId });
                      }
                      setShowUserPicker(false);
                      setUserSearch('');
                    }}
                  >
                    <Text style={[styles.hospitalOptionText, { color: appColors.textPrimary }]}>
                      {item.firstName} {item.lastName} ({item.email})
                    </Text>
                    <Text style={[styles.hospitalOptionCode, { color: appColors.textSecondary }]}>ID: {item.id} | Role: {item.role}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No users found</Text>}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Master Picker Modal */}
      {showMasterPicker && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: appColors.accentText }] }>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: appColors.textPrimary }]}>Select Permission Master</Text>
                <TouchableOpacity onPress={() => { setShowMasterPicker(false); setMasterSearch(''); }}>
                  <FontAwesomeIcon icon="times" size={20} color={appColors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={{ padding: 16 }}>
                <TextInput
                  style={[styles.searchInput, { backgroundColor: appColors.accentText, color: appColors.textPrimary, borderColor: appColors.border }]}
                  placeholder="Search by name or code"
                  placeholderTextColor={appColors.textSecondary}
                  value={masterSearch}
                  onChangeText={setMasterSearch}
                />
              </View>
              <FlatList
                data={permissionMasters.filter(m => {
                  if (!masterSearch) return true;
                  const q = masterSearch.toLowerCase();
                  return (m.name || '').toLowerCase().includes(q) || (m.code || '').toLowerCase().includes(q);
                })}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.hospitalOption]}
                    onPress={() => {
                      setApplyMasterForm({ ...applyMasterForm, masterId: String(item.id) });
                      setShowMasterPicker(false);
                      setMasterSearch('');
                    }}
                  >
                    <Text style={[styles.hospitalOptionText, { color: appColors.textPrimary }]}>{item.name} ({item.code})</Text>
                    <Text style={[styles.hospitalOptionCode, { color: appColors.textSecondary }]}>ID: {item.id} | Role: {item.role || 'N/A'}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No masters found</Text>}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  roleIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
  },
  tabContainer: {
    borderBottomWidth: 1,
    paddingHorizontal: 0,
  },
  tabScrollContent: {
    paddingHorizontal: 20,
  },
  quickNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  quickNavBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickNavText: {
    fontSize: 12,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  tabActive: {
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
  },
  tabTextActive: {
    fontFamily: Typography.fontFamily.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
  },
  scrollView: { flex: 1 },
  content: { padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
  },
  permissionItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  permissionInfo: { flex: 1 },
  permissionCode: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
  },
  permissionName: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 4,
  },
  permissionMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  permissionCategory: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  permissionScope: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  revokeButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  revokeButtonText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: '#B91C1C',
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 15,
    fontFamily: Typography.fontFamily.regular,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Typography.fontFamily.regular,
  },
  pickerInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.regular,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    paddingVertical: 20,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
  },
  hospitalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  hospitalOptionText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 4,
  },
  hospitalOptionCode: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
  },
});

export default PermissionManagementScreen;
