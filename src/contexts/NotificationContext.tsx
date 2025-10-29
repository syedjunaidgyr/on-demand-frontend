import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Notification } from '../types';

// Dummy notification data
const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Job Assignment',
    message: 'You have been assigned to Emergency Room shift on Dec 15, 2024',
    type: 'assignment',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    relatedId: 'job-001',
  },
  {
    id: '2',
    title: 'Shift Reminder',
    message: 'Your shift at General Hospital starts in 3 hours',
    type: 'warning',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    relatedId: 'job-002',
  },
  {
    id: '3',
    title: 'Payment Processed',
    message: 'Your payment of $1,250.00 has been processed successfully',
    type: 'success',
    isRead: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'New Application Received',
    message: 'Dr. Sarah Johnson has applied for the Cardiology position',
    type: 'info',
    isRead: false,
    createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    relatedId: 'job-005',
  },
  {
    id: '5',
    title: 'Assignment Cancelled',
    message: 'Your ICU shift scheduled for Dec 18 has been cancelled',
    type: 'error',
    isRead: false,
    createdAt: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    title: 'Profile Update Required',
    message: 'Please update your license information to continue receiving assignments',
    type: 'warning',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    title: 'New Job Posted',
    message: 'A new ICU shift matching your profile has been posted',
    type: 'job',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    relatedId: 'job-003',
  },
  {
    id: '8',
    title: 'Assignment Accepted',
    message: 'Your request for the Pediatrics shift has been accepted',
    type: 'success',
    isRead: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    relatedId: 'job-004',
  },
  {
    id: '9',
    title: 'Timesheet Approved',
    message: 'Your timesheet for Week 48 has been approved by HR',
    type: 'success',
    isRead: true,
    createdAt: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '10',
    title: 'Document Upload Required',
    message: 'Please upload your vaccination certificate by Dec 25, 2024',
    type: 'warning',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '11',
    title: 'System Maintenance',
    message: 'The app will undergo maintenance on Dec 20, 2024 from 2 AM to 4 AM',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '12',
    title: 'Bonus Payment',
    message: 'You have received a bonus of $500 for exceptional performance',
    type: 'success',
    isRead: true,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '13',
    title: 'New Message',
    message: 'You have a new message from Dr. Michael Brown regarding shift swap',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '14',
    title: 'Training Mandatory',
    message: 'Complete the mandatory COVID-19 safety training by end of month',
    type: 'warning',
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '15',
    title: 'Holiday Schedule',
    message: 'Holiday shift schedule for December has been posted',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  deleteNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
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

