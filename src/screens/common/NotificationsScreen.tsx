import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Notification } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import Responsive from '../../utils/responsive';

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { notifications, markAsRead, markAllAsRead, clearAllNotifications, deleteNotification, isLoading, refreshNotifications } = useNotifications();
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Mark all notifications as read and close modal
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setModalVisible(false);
  };

  // Clear all notifications and close modal
  const handleClearAll = () => {
    // clearAllNotifications(); // Commented out - not clearing notifications
    setModalVisible(false);
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'assignment':
        return { icon: 'clipboard-list', color: Colors.info };
      case 'job':
        return { icon: 'briefcase', color: Colors.primary };
      case 'success':
        return { icon: 'check-circle', color: Colors.success };
      case 'warning':
        return { icon: 'exclamation-triangle', color: Colors.warning };
      case 'error':
        return { icon: 'times-circle', color: Colors.error };
      case 'info':
      default:
        return { icon: 'info-circle', color: Colors.info };
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
  };

  // Group notifications by date
  const groupNotificationsByDate = () => {
    const grouped: { [key: string]: Notification[] } = {
      Today: [],
      Yesterday: [],
      'This Weekend': [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(notification => {
      const notifDate = new Date(notification.createdAt);
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      if (notifDay.getTime() === today.getTime()) {
        grouped.Today.push(notification);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        grouped.Yesterday.push(notification);
      } else {
        grouped['This Weekend'].push(notification);
      }
    });

    return grouped;
  };

  // Handle notification press
  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  // Handle delete confirmation
  const handleDeletePress = (id: string) => {
    setSelectedNotificationId(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (selectedNotificationId) {
      deleteNotification(selectedNotificationId);
      setDeleteModalVisible(false);
      setSelectedNotificationId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setSelectedNotificationId(null);
  };

  // Swipeable Notification Component
  const SwipeableNotification = ({ item }: { item: Notification }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const { icon, color } = getNotificationIcon(item.type);

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 10;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx < 0) {
            translateX.setValue(Math.max(gestureState.dx, -80));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -40) {
            Animated.spring(translateX, {
              toValue: -80,
              useNativeDriver: true,
            }).start();
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      })
    ).current;

    return (
      <View style={styles.swipeContainer}>
        {/* Delete Button Background - Hidden behind card */}
        <TouchableOpacity
          style={styles.deleteBackground}
          onPress={() => handleDeletePress(item.id)}
          activeOpacity={0.8}>
          <FontAwesomeIcon icon="trash" size={Responsive.iconSize(22)} color={Colors.white} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>

        {/* Notification Card */}
        <Animated.View
          style={[
            styles.swipeableCard,
            { transform: [{ translateX }] },
          ]}
          {...panResponder.panHandlers}>
          <TouchableOpacity
            style={[
              styles.notificationCard,
              !item.isRead && styles.unreadIndicator,
              item.isRead && styles.readCard,
            ]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: item.isRead ? '#E8E8E8' : color + '20' }
            ]}>
              <FontAwesomeIcon
                icon={icon}
                size={Responsive.iconSize(20)}
                color={item.isRead ? '#999999' : color}
              />
            </View>

            <View style={styles.textContent}>
              <Text style={[
                styles.notificationMessage,
                item.isRead && styles.readText
              ]}>
                {item.message}
              </Text>
              <Text style={[
                styles.notificationTime,
                item.isRead && styles.readTimeText
              ]}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>

            {!item.isRead && <View style={styles.unreadDot} />}
            {item.isRead && (
              <View style={styles.readCheckmark}>
                <FontAwesomeIcon icon="check" size={Responsive.iconSize(12)} color="#999999" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // Render notification item
  const renderNotification = (item: Notification) => {
    return <SwipeableNotification item={item} />;
  };

  const groupedNotifications = groupNotificationsByDate();

  return (
    <View style={styles.container}>
      <GlobalHeader
        title="Notifications"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity 
            onPress={() => setModalVisible(true)}
            style={styles.menuButton}>
            <FontAwesomeIcon icon="ellipsis-v" size={Responsive.iconSize(20)} color={Colors.white} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={Object.keys(groupedNotifications)}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        renderItem={({ item: section }) => {
          const sectionNotifications = groupedNotifications[section];
          if (sectionNotifications.length === 0) return null;

          return (
            <View key={section}>
              <Text style={styles.sectionHeader}>{section}</Text>
              {sectionNotifications.map(notification => (
                <View key={notification.id}>
                  {renderNotification(notification)}
                </View>
              ))}
            </View>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.emptyText}>Loading notifications...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesomeIcon icon="bell-slash" size={Responsive.iconSize(64)} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>
                You'll see notifications here when there are updates
              </Text>
            </View>
          )
        }
      />

      {/* Bottom Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleClearAll}>
              <Text style={styles.modalOptionText}>Clear All</Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleMarkAllAsRead}>
              <Text style={styles.modalOptionText}>Mark all as read</Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalOptionText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={cancelDelete}>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalIcon}>
              <FontAwesomeIcon icon="exclamation-triangle" size={Responsive.iconSize(40)} color={Colors.warning} />
            </View>
            
            <Text style={styles.deleteModalTitle}>Delete Notification?</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete this notification? This action cannot be undone.
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton, { marginRight: 8 }]}
                onPress={cancelDelete}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmButton, { marginLeft: 8 }]}
                onPress={confirmDelete}>
                <Text style={styles.confirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  menuButton: {
    padding: Responsive.scale(8),
  },
  listContent: {
    paddingBottom: Responsive.verticalScale(24),
  },
  sectionHeader: {
    fontSize: Responsive.fontSize(13),
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
    paddingHorizontal: Responsive.scale(16),
    paddingTop: Responsive.verticalScale(16),
    paddingBottom: Responsive.verticalScale(8),
    backgroundColor: '#F5F5F5',
  },
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeableCard: {
    backgroundColor: Colors.white,
    zIndex: 1,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: Responsive.scale(80),
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  deleteText: {
    color: Colors.white,
    fontSize: Responsive.fontSize(12),
    fontFamily: Typography.fontFamily.medium,
    marginTop: Responsive.verticalScale(4),
  },
  notificationCard: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Responsive.verticalScale(16),
    paddingHorizontal: Responsive.scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  unreadIndicator: {
    backgroundColor: '#F0F7FF',
    borderLeftWidth: Responsive.scale(3),
    borderLeftColor: Colors.primary,
  },
  readCard: {
    opacity: 0.6,
    backgroundColor: '#FAFAFA',
  },
  iconContainer: {
    width: Responsive.scale(40),
    height: Responsive.verticalScale(40),
    borderRadius: Responsive.scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Responsive.scale(12),
  },
  textContent: {
    flex: 1,
    marginRight: Responsive.scale(12),
  },
  notificationMessage: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    lineHeight: Responsive.verticalScale(20),
    marginBottom: Responsive.verticalScale(4),
  },
  readText: {
    color: '#999999',
    fontFamily: Typography.fontFamily.regular,
  },
  notificationTime: {
    fontSize: Responsive.fontSize(12),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },
  readTimeText: {
    color: '#BBBBBB',
  },
  unreadDot: {
    position: 'absolute',
    right: Responsive.scale(16),
    top: Responsive.verticalScale(16),
    width: Responsive.scale(10),
    height: Responsive.verticalScale(10),
    borderRadius: Responsive.scale(5),
    backgroundColor: '#FF3B30',
  },
  readCheckmark: {
    position: 'absolute',
    right: Responsive.scale(16),
    top: Responsive.verticalScale(20),
    width: Responsive.scale(20),
    height: Responsive.verticalScale(20),
    borderRadius: Responsive.scale(10),
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Responsive.verticalScale(80),
  },
  emptyText: {
    fontSize: Responsive.fontSize(18),
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textSecondary,
    marginTop: Responsive.verticalScale(16),
    marginBottom: Responsive.verticalScale(8),
  },
  emptySubtext: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: Responsive.scale(40),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Responsive.scale(20),
    borderTopRightRadius: Responsive.scale(20),
    paddingBottom: Responsive.verticalScale(34),
  },
  modalOption: {
    paddingVertical: Responsive.verticalScale(18),
    paddingHorizontal: Responsive.scale(20),
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  cancelText: {
    fontFamily: Typography.fontFamily.medium,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: Responsive.scale(20),
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Responsive.scale(20),
  },
  deleteModalContent: {
    backgroundColor: Colors.white,
    borderRadius: Responsive.scale(16),
    padding: Responsive.scale(24),
    width: '100%',
    maxWidth: Responsive.scale(340),
    alignItems: 'center',
  },
  deleteModalIcon: {
    width: Responsive.scale(70),
    height: Responsive.verticalScale(70),
    borderRadius: Responsive.scale(35),
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Responsive.verticalScale(16),
  },
  deleteModalTitle: {
    fontSize: Responsive.fontSize(20),
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Responsive.verticalScale(8),
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Responsive.verticalScale(20),
    marginBottom: Responsive.verticalScale(24),
  },
  deleteModalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: Responsive.verticalScale(12),
    paddingHorizontal: Responsive.scale(20),
    borderRadius: Responsive.scale(8),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  confirmButton: {
    backgroundColor: Colors.error,
  },
  confirmButtonText: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});

export default NotificationsScreen;