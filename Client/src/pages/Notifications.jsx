/**
 * Notifications Page
 * Full page view of all notifications with tabs and actions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  FiBell, FiCheck, FiCheckCircle, FiTrash2, FiInbox, 
  FiMail, FiRefreshCw, FiFilter
} from 'react-icons/fi';

// Notification type icons and colors (same as NotificationBell)
const getNotificationIcon = (type) => {
  switch (type) {
    case 'order_created':
    case 'order_status_changed':
      return '🛒';
    case 'message_received':
      return '💬';
    case 'appointment_created':
    case 'appointment_updated':
    case 'appointment_cancelled':
      return '📅';
    case 'coach_assigned':
    case 'client_assigned':
      return '👤';
    case 'provider_signup':
      return '🏪';
    default:
      return '🔔';
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case 'order_created':
      return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    case 'order_status_changed':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'message_received':
      return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
    case 'appointment_created':
    case 'appointment_updated':
      return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    case 'appointment_cancelled':
      return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    case 'coach_assigned':
    case 'client_assigned':
      return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [refreshing, setRefreshing] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    unreadNotifications
  } = useNotifications();

  // Filter notifications based on active tab
  const displayedNotifications = activeTab === 'unread' 
    ? unreadNotifications 
    : notifications;

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.url) {
      navigate(notification.url);
    }
  };

  // Format time
  const formatTime = (date) => {
    try {
      const d = new Date(date);
      const now = new Date();
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return formatDistanceToNow(d, { addSuffix: true });
      } else if (diffDays < 7) {
        return format(d, 'EEEE, h:mm a');
      } else {
        return format(d, 'MMM d, yyyy');
      }
    } catch {
      return '';
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/10 rounded-xl">
                <FiBell className="text-2xl text-success" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {t('notifications.title', 'Notifications')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {unreadCount > 0 
                    ? t('notifications.unreadCount', '{{count}} unread notifications', { count: unreadCount })
                    : t('notifications.allCaughtUp', 'All caught up!')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <FiRefreshCw className={`${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{t('common.refresh', 'Refresh')}</span>
              </button>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiCheckCircle />
                  <span className="hidden sm:inline">{t('notifications.markAllRead', 'Mark all read')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4 border-b border-border">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-success text-success'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FiInbox />
            {t('notifications.all', 'All')}
            <span className="px-2 py-0.5 text-xs bg-muted rounded-full">
              {notifications.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'unread'
                ? 'border-success text-success'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FiMail />
            {t('notifications.unread', 'Unread')}
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-destructive/10 text-destructive rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notification List */}
        <div className="bg-card rounded-xl shadow border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-success border-t-transparent" />
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              {activeTab === 'unread' ? (
                <>
                  <FiInbox size={48} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium">{t('notifications.noUnread', 'No unread notifications')}</p>
                  <p className="text-sm mt-1">{t('notifications.allCaughtUp', "You're all caught up!")}</p>
                </>
              ) : (
                <>
                  <FiBell size={48} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium">{t('notifications.empty', 'No notifications yet')}</p>
                  <p className="text-sm mt-1">{t('notifications.emptyDescription', "We'll notify you when something happens")}</p>
                </>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {displayedNotifications.map((notification) => (
                <li
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    flex items-start gap-4 px-4 sm:px-6 py-4 cursor-pointer transition-colors
                    ${notification.is_read 
                      ? 'bg-card hover:bg-accent/50' 
                      : 'bg-success/5 hover:bg-success/10'}
                  `}
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-base font-medium ${notification.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-success rounded-full" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    
                    {notification.body && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                    )}

                    {/* Entity badge */}
                    {notification.entity_type && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded capitalize">
                        {notification.entity_type}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-1">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                        title={t('notifications.markRead', 'Mark as read')}
                      >
                        <FiCheck size={16} className="text-success" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                      title={t('notifications.delete', 'Delete')}
                    >
                      <FiTrash2 size={16} className="text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
