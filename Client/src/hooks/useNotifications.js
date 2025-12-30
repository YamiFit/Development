/**
 * useNotifications Hook
 * Real-time notifications management with Supabase subscriptions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsService } from '@/services/api/notifications.service';
import { useAuth } from '@/hooks/useAuthRedux';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await notificationsService.getNotifications(options);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setNotifications(data || []);
    }

    setLoading(false);
  }, [user?.id]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    const { count, error: countError } = await notificationsService.getUnreadCount();

    if (!countError) {
      setUnreadCount(count);
    }
  }, [user?.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    const { error: markError } = await notificationsService.markAsRead(notificationId);

    if (!markError) {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    return { error: markError };
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const { error: markError } = await notificationsService.markAllAsRead();

    if (!markError) {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    }

    return { error: markError };
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    const { error: deleteError } = await notificationsService.deleteNotification(notificationId);

    if (!deleteError) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }

    return { error: deleteError };
  }, [notifications]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount()
    ]);
  }, [fetchNotifications, fetchUnreadCount]);

  // Initial fetch and real-time subscription
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Initial fetch
    refresh();

    // Set up real-time subscription
    subscriptionRef.current = notificationsService.subscribeToNotifications(user.id, {
      onInsert: (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        if (!newNotification.is_read) {
          setUnreadCount(prev => prev + 1);
        }
        
        // Optional: Play notification sound or show browser notification
        if (Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.body,
            icon: '/favicon/favicon-32x32.png'
          });
        }
      },
      onUpdate: (updatedNotification) => {
        setNotifications(prev =>
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        );
        // Recalculate unread count
        fetchUnreadCount();
      },
      onDelete: (deletedNotification) => {
        setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id));
        fetchUnreadCount();
      }
    });

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [user?.id, refresh, fetchUnreadCount]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return Notification.permission;
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasUnread: unreadCount > 0,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    requestNotificationPermission,
    // Computed values
    unreadNotifications: notifications.filter(n => !n.is_read),
    readNotifications: notifications.filter(n => n.is_read)
  };
}

export default useNotifications;
