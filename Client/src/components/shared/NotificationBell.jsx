/**
 * NotificationBell Component
 * Dropdown bell icon with real-time notification updates
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiCheckCircle, FiTrash2, FiX } from 'react-icons/fi';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';

// Notification type icons
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

// Notification type colors
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
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  }
};

export default function NotificationBell() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    hasUnread
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate to URL if present
    if (notification.url) {
      navigate(notification.url);
      setIsOpen(false);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  // Handle delete notification
  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return '';
    }
  };

  // Get display count (cap at 9+)
  const displayCount = unreadCount > 9 ? '9+' : unreadCount;

  // Recent notifications (show last 8)
  const recentNotifications = notifications.slice(0, 8);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label={t('notifications.title', 'Notifications')}
      >
        <FiBell className="text-xl text-gray-700 dark:text-gray-200" />
        
        {/* Unread Badge */}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {displayCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {t('notifications.title', 'Notifications')}
            </h3>
            <div className="flex items-center gap-2">
              {hasUnread && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                  title={t('notifications.markAllRead', 'Mark all as read')}
                >
                  <FiCheckCircle size={14} />
                  <span className="hidden sm:inline">{t('notifications.markAllRead', 'Mark all read')}</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <FiX size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent" />
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <FiBell size={32} className="mb-2 opacity-50" />
                <p className="text-sm">{t('notifications.empty', 'No notifications yet')}</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentNotifications.map((notification) => (
                  <li
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                      ${notification.is_read 
                        ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50' 
                        : 'bg-green-50/50 dark:bg-green-900/10 hover:bg-green-50 dark:hover:bg-green-900/20'}
                    `}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${notification.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                        )}
                      </div>
                      {notification.body && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title={t('notifications.markRead', 'Mark as read')}
                        >
                          <FiCheck size={14} className="text-green-600 dark:text-green-400" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title={t('notifications.delete', 'Delete')}
                      >
                        <FiTrash2 size={14} className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium py-1"
              >
                {t('notifications.viewAll', 'View all notifications')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
