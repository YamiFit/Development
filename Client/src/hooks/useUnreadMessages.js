/**
 * useUnreadMessages Hook
 * Manages unread message count state with realtime updates
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getUnreadMessageCount, 
  subscribeToUnreadCount 
} from '@/services/api/coach.service';
import { useAuth } from '@/hooks/useAuthRedux';

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { count } = await getUnreadMessageCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToUnreadCount(user.id, (newCount) => {
      setUnreadCount(newCount);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [user?.id]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refresh,
    hasUnread: unreadCount > 0,
  };
};

export default useUnreadMessages;
