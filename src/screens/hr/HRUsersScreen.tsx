import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { SkeletonUserCard, SkeletonSearchBar } from '../../components/SkeletonComponents';

const HRUsersScreen: React.FC = () => {
  const navigation = useNavigation();
  const scrollY = React.useRef(new Animated.Value(0)).current;
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

    // Search filter (name and department only)
    const q = searchQuery.trim().toLowerCase();
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const department = (user.department || '').toLowerCase();
    const searchMatch = q.length === 0 || fullName.includes(q) || department.includes(q);

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
      style={styles.jobCard}
      onPress={() => handleUserPress(user)}
      activeOpacity={0.8}>
      {/* Top row: Join date + edit */}
      <View style={styles.cardTopRow}>
        <Text style={styles.cardTimeText}>Joined {formatDate(user.createdAt)}</Text>
        <TouchableOpacity style={styles.editTopButton} onPress={() => handleUserPress(user)}>
          <FontAwesomeIcon icon="edit" size={Responsive.iconSize(16)} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.cardDivider} />

      {/* Main row: Avatar + Name on same line; details below */}
      <View style={styles.profileRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {(user.firstName || user.lastName || 'U').trim().charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {user.firstName} {user.lastName}
          </Text>
          {/* Subtitle row: Email • Department • Status */}
          <View style={styles.subtitleRow}>
            {!!user.email && (
              <Text style={styles.subtitleText} numberOfLines={1}>{user.email}</Text>
            )}
            {!!user.email && !!user.department && (
              <Text style={styles.subtitleDot}> • </Text>
            )}
            {!!user.department && (
              <Text style={styles.subtitleText} numberOfLines={1}>{user.department}</Text>
            )}
            {(!!user.email || !!user.department) && (
              <Text style={styles.subtitleDot}> • </Text>
            )}
            <View style={[styles.inlineStatusPill, { backgroundColor: (user.isActive ? '#10B981' : '#EF4444') + '1A' }]}>
              <Text style={[styles.inlineStatusText, { color: user.isActive ? '#10B981' : '#EF4444' }]} numberOfLines={1}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Compact info row: Role, Phone, Location */}
          <View style={styles.assignmentRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{user.role}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{user.phone || '—'}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{user.location || '—'}</Text>
            </View>
          </View>
        </View>
      </View>
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


  return (
    <View style={styles.container}>
      {/* Global Header */}
      <GlobalHeader
        title="Staff Management"
        showBackButton={true}
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16 }}
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
      {isLoading && users.length === 0 ? (
        <SkeletonSearchBar />
      ) : (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <FontAwesomeIcon icon="search" size={Responsive.iconSize(18)} color={Colors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or department"
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
      )}


      {/* Users List */}
      {isLoading && users.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}>
          {[...Array(5)].map((_, i) => (
            <SkeletonUserCard key={i} />
          ))}
        </ScrollView>
      ) : (
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
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
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
      )}

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
      
      <HRFooterNavigation activeRoute="Users" scrollY={scrollY} isLoading={isLoading} />
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
    paddingHorizontal: Responsive.scale(Spacing.md),
    paddingBottom: Responsive.verticalScale(Spacing.xs),
    backgroundColor: Colors.background,
    marginTop: Responsive.verticalScale(Spacing.md),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'] || BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
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
    paddingHorizontal: Responsive.scale(Spacing.md),
    paddingTop: Responsive.verticalScale(Spacing.xs),
    paddingBottom: Responsive.verticalScale(80),
  },
  // Adopt job card visual style from HRJobsScreen
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTimeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  editTopButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: -2,
  },
  avatarInitials: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: '#4C1D95',
  },
  profileContent: {
    flex: 1,
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
    flexShrink: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'nowrap',
  },
  subtitleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    flexShrink: 1,
    maxWidth: '45%',
  },
  subtitleDot: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginHorizontal: 6,
  },
  inlineStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inlineStatusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    textTransform: 'capitalize',
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
  },
  infoValue: {
    marginTop: 2,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
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
