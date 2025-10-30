import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification } from '../types';
import ApiService from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  deleteNotification: (id: string) => void;
  refreshNotifications: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Helper function to map template name to notification type and title
const getNotificationTypeFromTemplate = (templateName: string): { type: Notification['type'], title: string } => {
  const name = templateName.toLowerCase();
  
  if (name.includes('candidateselected')) {
    return { type: 'success', title: 'Candidate Selected' };
  } else if (name.includes('jobcreated')) {
    return { type: 'job', title: 'Job Created' };
  } else if (name.includes('checkout')) {
    return { type: 'info', title: 'Check Out' };
  } else if (name.includes('checkin')) {
    return { type: 'info', title: 'Check In' };
  } else if (name.includes('assigned')) {
    return { type: 'assignment', title: 'New Assignment' };
  } else if (name.includes('accepted')) {
    return { type: 'success', title: 'Request Accepted' };
  } else if (name.includes('rejected') || name.includes('cancelled')) {
    return { type: 'error', title: 'Request Cancelled' };
  } else if (name.includes('reminder')) {
    return { type: 'warning', title: 'Reminder' };
  } else if (name.includes('payment')) {
    return { type: 'success', title: 'Payment' };
  }
  
  return { type: 'info', title: 'Notification' };
};

// Global reference to refresh function for external access
let globalRefreshNotifications: (() => Promise<void>) | null = null;

export const setGlobalRefreshNotifications = (refreshFn: () => Promise<void>) => {
  globalRefreshNotifications = refreshFn;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Fetch notifications from API
  const refreshNotifications = async () => {
    try {
      setIsLoading(true);
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) {
        console.log('⚠️ No user data found, skipping notification fetch');
        return;
      }

      const userData = JSON.parse(userDataStr);
      const apiNotifications = await ApiService.getNotifications(userData.id);

      // Transform API response to Notification format
      const transformedNotifications: Notification[] = apiNotifications.map((notif: any) => {
        const { type, title } = getNotificationTypeFromTemplate(notif.template_name);
        return {
          id: notif.notification_id,
          title,
          message: notif.message,
          type,
          isRead: notif.is_read === 1,
          createdAt: notif.createdAt,
          relatedId: notif.template_id, // Using template_id as relatedId
        };
      });

      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
      // Don't throw - just log and continue with empty array
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notifications on mount
  useEffect(() => {
    refreshNotifications();
  }, []);

  // Register global refresh function
  useEffect(() => {
    setGlobalRefreshNotifications(refreshNotifications);
  }, []);

  // Watch for storage changes (user logout/login)
  useEffect(() => {
    let lastUserId: string | null = null;
    
    const checkUserChange = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem('user_data');
        if (!userDataStr) {
          if (notifications.length > 0) {
            // User has logged out, clear notifications
            console.log('🧹 Clearing notifications due to logout');
            setNotifications([]);
          }
          lastUserId = null;
          return;
        }

        const userData = JSON.parse(userDataStr);
        const currentUserId = userData.id;

        // Check if user has changed (different user logged in)
        if (lastUserId !== null && lastUserId !== currentUserId && lastUserId !== undefined) {
          console.log('🔄 Different user logged in, refreshing notifications');
          await refreshNotifications();
        }

        // Check if user_data appeared (user logged in)
        if (lastUserId === null && currentUserId) {
          console.log('✅ User logged in, fetching notifications');
          await refreshNotifications();
        }

        lastUserId = currentUserId;
      } catch (error) {
        console.error('Error checking user change:', error);
      }
    };

    // Check for user changes periodically
    const interval = setInterval(checkUserChange, 1000);

    return () => clearInterval(interval);
  }, [notifications.length]);

  const markAsRead = async (id: string) => {
    try {
      await ApiService.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      // Still update UI optimistically
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) return;
      
      const userData = JSON.parse(userDataStr);
      await ApiService.markAllNotificationsAsRead(userData.id);
      
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      // Still update UI optimistically
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const deleteNotification = async (id: string) => {
    try {
      await ApiService.deleteNotification(id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      // Still update UI optimistically
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        deleteNotification,
        refreshNotifications,
        isLoading,
      }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

