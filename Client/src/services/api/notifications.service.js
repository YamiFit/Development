/**
 * Notifications Service
 * API service for notification operations
 */

import { supabase } from '@/supabaseClient';

export const notificationsService = {
  /**
   * Get notifications for current user
   * @param {Object} options - Query options
   * @param {number} options.limit - Max notifications to fetch
   * @param {number} options.offset - Offset for pagination
   * @param {boolean} options.unreadOnly - Only fetch unread notifications
   */
  async getNotifications({ limit = 20, offset = 0, unreadOnly = false } = {}) {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    const { data, error } = await supabase.rpc('get_unread_notification_count');
    return { count: data || 0, error };
  },

  /**
   * Mark a single notification as read
   * @param {string} notificationId - UUID of the notification
   */
  async markAsRead(notificationId) {
    const { data, error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId
    });
    return { success: data, error };
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const { data, error } = await supabase.rpc('mark_all_notifications_read');
    return { count: data, error };
  },

  /**
   * Delete a notification
   * @param {string} notificationId - UUID of the notification
   */
  async deleteNotification(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    return { error };
  },

  /**
   * Subscribe to real-time notification updates
   * @param {string} userId - User ID to subscribe for
   * @param {Function} onInsert - Callback for new notifications
   * @param {Function} onUpdate - Callback for updated notifications
   * @param {Function} onDelete - Callback for deleted notifications
   * @returns {Object} Subscription object with unsubscribe method
   */
  subscribeToNotifications(userId, { onInsert, onUpdate, onDelete }) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${userId}`
        },
        (payload) => {
          if (onInsert) onInsert(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${userId}`
        },
        (payload) => {
          if (onUpdate) onUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${userId}`
        },
        (payload) => {
          if (onDelete) onDelete(payload.old);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }
};

export default notificationsService;
