import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import LinearGradient from 'react-native-linear-gradient';
import GlobalHeader from '../../components/GlobalHeader';
import HRFooterNavigation from '../../components/HRFooterNavigation';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { User } from '../../types';
import ApiService from '../../services/api';
import Responsive from '../../utils/responsive';

const HRUsersScreen: React.FC = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'DOCTOR' | 'NURSE'>('ALL');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const [tabAnimation] = useState(new Animated.Value(0));
  const [modalAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    console.log('🚀 HRUsersScreen mounted, loading users...');
    loadUsers();
  }, []);

  const loadUsers = async (pageNum = 1, refresh = false) => {
    try {
      console.log('🔧 Loading users - page:', pageNum, 'refresh:', refresh);
      
      const response = await ApiService.getAllUsers({
        page: pageNum,
        limit: 100, // Increased limit to get all users
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      console.log('📊 API Response:', JSON.stringify(response, null, 2));

      // FIX: Backend returns { users: [...], pagination: {...} }
      const usersData = response.users || response.data || [];
      const pagination = response.pagination || response;

      console.log('👥 Users Data:', usersData);
      console.log('📄 Pagination:', pagination);
      console.log('📊 Users count:', usersData.length);

      if (refresh || pageNum === 1) {
        setUsers(usersData);
      } else {
        setUsers(prev => [...prev, ...usersData]);
      }

      setHasMore(pagination.page < pagination.totalPages);
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      Alert.alert('Error', 'Failed to load users. Please try again.');
      if (refresh || pageNum === 1) {
        setUsers([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadUsers(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadUsers(nextPage);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DOCTOR':
        return '#EF4444';
      case 'NURSE':
        return '#06B6D4';
      case 'HR':
        return '#8B5CF6';
      case 'ADMIN':
        return '#F59E0B';
      default:
        return Colors.primary;
    }
  };

  const getRoleGradient = (role: string): [string, string] => {
    switch (role) {
      case 'DOCTOR':
        return ['#EF4444', '#DC2626'];
      case 'NURSE':
        return ['#06B6D4', '#0891B2'];
      case 'HR':
        return ['#8B5CF6', '#7C3AED'];
      case 'ADMIN':
        return ['#F59E0B', '#D97706'];
      default:
        return [Colors.primary, Colors.primaryDark];
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DOCTOR':
        return 'user-md';
      case 'NURSE':
        return 'user-nurse';
      case 'HR':
        return 'users';
      case 'ADMIN':
        return 'user-cog';
      default:
        return 'user';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredUsers = users.filter(user => {
    // Role filter
    const roleMatch = selectedRole === 'ALL' || user.role === selectedRole;
    
    // Search filter
    const searchMatch = searchQuery === '' || 
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    return roleMatch && searchMatch;
  });

  console.log('🔍 Current state:', {
    users: users.length,
    filteredUsers: filteredUsers.length,
    isLoading,
    searchQuery,
    selectedRole
  });

  const handleUserPress = (user: User) => {
    console.log('User pressed:', user.id);
  };

  const handleRoleChange = (role: 'ALL' | 'DOCTOR' | 'NURSE') => {
    Animated.sequence([
      Animated.timing(tabAnimation, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(tabAnimation, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSelectedRole(role);
  };

  const openFilterModal = () => {
    setShowFilterModal(true);
    Animated.timing(modalAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeFilterModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowFilterModal(false);
    });
  };

  const UserCard = ({ user }: { user: User }) => (
    <TouchableOpacity 
      style={styles.userCard} 
      onPress={() => handleUserPress(user)}
      activeOpacity={0.8}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.8)']}
        style={styles.userCardGradient}>
        
        {/* Top Section - Header with Avatar and Role */}
      <View style={styles.userHeader}>
          <LinearGradient
            colors={getRoleGradient(user.role)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarContainer}>
            <FontAwesomeIcon icon={getRoleIcon(user.role)} size={Responsive.iconSize(28)} color="#FFFFFF" />
          </LinearGradient>

        <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
            {user.firstName} {user.lastName}
          </Text>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) + '20' }]}>
                <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                  {user.role}
                </Text>
              </View>
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: user.isActive ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.statusLabel}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        {/* Middle Section - Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <FontAwesomeIcon icon="building" size={Responsive.iconSize(14)} color={Colors.primary} />
            </View>
            <Text style={styles.detailLabel}>Department</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {user.department || 'Not specified'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <FontAwesomeIcon icon="map-marker-alt" size={Responsive.iconSize(14)} color={Colors.primary} />
            </View>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {user.location || 'Not specified'}
            </Text>
      </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <FontAwesomeIcon icon="phone" size={Responsive.iconSize(14)} color={Colors.primary} />
        </View>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {user.phone || 'Not specified'}
            </Text>
        </View>

        {user.specialization && (
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <FontAwesomeIcon icon="stethoscope" size={Responsive.iconSize(14)} color={Colors.primary} />
              </View>
              <Text style={styles.detailLabel}>Specialization</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {user.specialization}
              </Text>
          </View>
        )}
      </View>

        {/* Bottom Section - Footer with Actions */}
      <View style={styles.userFooter}>
        <Text style={styles.joinDate}>Joined {formatDate(user.createdAt)}</Text>
        <View style={styles.userActions}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
              <FontAwesomeIcon icon="edit" size={Responsive.iconSize(16)} color={Colors.primary} />
          </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
              <FontAwesomeIcon icon="envelope" size={Responsive.iconSize(16)} color="#06B6D4" />
          </TouchableOpacity>
        </View>
      </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  if (isLoading && users.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animated.View style={{ opacity: animatedValue }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Global Header */}
      <GlobalHeader
        title="Staff Management"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={openFilterModal}
            activeOpacity={0.7}>
            <FontAwesomeIcon icon="filter" size={Responsive.iconSize(20)} color={Colors.white} />
          </TouchableOpacity>
        }
      />
      
      {/* Subtitle */}
      {/* <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>
          {searchQuery ? `${filteredUsers.length} of ${users.length} found` : `${users.length} total staff`}
        </Text>
      </View> */}

      {/* Enhanced Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesomeIcon icon="search" size={Responsive.iconSize(18)} color={Colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or role..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              activeOpacity={0.6}>
              <FontAwesomeIcon icon="times" size={Responsive.iconSize(18)} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>


      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserCard user={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        // Disabled infinite scroll since we load all users at once
        // onEndReached={loadMore}
        // onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <FontAwesomeIcon icon="users" size={Responsive.iconSize(48)} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search terms' : 'No users available at the moment'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.retryButton} onPress={() => loadUsers(1, true)}>
                <Text style={styles.retryButtonText}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Filter Modal */}
      {showFilterModal && (
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: modalAnimation,
            }
          ]}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                  {
                    translateY: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}>
            <Text style={styles.modalTitle}>Filter Options</Text>
            <TouchableOpacity 
              style={[styles.modalOption, selectedRole === 'ALL' && styles.modalOptionActive]}
              onPress={() => {
                setSelectedRole('ALL');
                closeFilterModal();
              }}>
              <Text style={[styles.modalOptionText, selectedRole === 'ALL' && styles.modalOptionTextActive]}>
                Show All Staff
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalOption, selectedRole === 'DOCTOR' && styles.modalOptionActive]}
              onPress={() => {
                setSelectedRole('DOCTOR');
                closeFilterModal();
              }}>
              <Text style={[styles.modalOptionText, selectedRole === 'DOCTOR' && styles.modalOptionTextActive]}>
                Show Doctors Only
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalOption, selectedRole === 'NURSE' && styles.modalOptionActive]}
              onPress={() => {
                setSelectedRole('NURSE');
                closeFilterModal();
              }}>
              <Text style={[styles.modalOptionText, selectedRole === 'NURSE' && styles.modalOptionTextActive]}>
                Show Nurses Only
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={closeFilterModal}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
      
      <HRFooterNavigation activeRoute="Users" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  subtitleContainer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  filterButton: {
    width: Responsive.scale(40),
    height: Responsive.verticalScale(40),
    borderRadius: Responsive.scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#F8FAFC',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
    paddingVertical: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  listContainer: {
    padding: Responsive.scale(Spacing.lg),
    paddingTop: Responsive.verticalScale(Spacing.md),
    paddingBottom: Responsive.verticalScale(80),
  },
  userCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userCardGradient: {
    padding: Spacing.lg,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    width: Responsive.scale(56),
    height: Responsive.verticalScale(56),
    borderRadius: Responsive.scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
  },
  roleText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  userEmail: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: Responsive.scale(8),
    height: Responsive.verticalScale(8),
    borderRadius: Responsive.scale(4),
    marginRight: Spacing.xs,
  },
  statusLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
    marginHorizontal: -Spacing.xs,
  },
  detailItem: {
    width: '50%',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  detailIcon: {
    width: Responsive.scale(24),
    height: Responsive.verticalScale(24),
    borderRadius: Responsive.scale(12),
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  joinDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },
  userActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: Responsive.scale(36),
    height: Responsive.verticalScale(36),
    borderRadius: Responsive.scale(18),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    margin: Spacing.lg,
    minWidth: 280,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalOptionText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modalOptionTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  modalCloseButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.md,
  },
  modalCloseText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default HRUsersScreen;
