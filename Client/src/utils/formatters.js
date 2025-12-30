/**
 * Formatter Utilities
 * Common formatting functions for display
 */

/**
 * Format price to currency string
 * @param {number|string} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} - Formatted price
 */
export const formatPrice = (amount, currency = 'USD') => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'full')
 * @returns {string} - Formatted date
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  };

  return new Intl.DateTimeFormat('en-US', options[format] || options.short).format(dateObj);
};

/**
 * Format time to readable string
 * @param {string} time - Time string (HH:MM:SS or HH:MM)
 * @param {boolean} use24Hour - Use 24-hour format
 * @returns {string} - Formatted time
 */
export const formatTime = (time, use24Hour = false) => {
  if (!time) return 'N/A';

  const [hours, minutes] = time.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) return 'Invalid Time';

  if (use24Hour) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Format datetime to readable string
 * @param {string|Date} datetime - Datetime to format
 * @returns {string} - Formatted datetime
 */
export const formatDateTime = (datetime) => {
  if (!datetime) return 'N/A';

  const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;

  if (isNaN(dateObj.getTime())) return 'Invalid DateTime';

  const date = formatDate(dateObj, 'short');
  const time = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${date} at ${time}`;
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} - Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const now = new Date();
  const diff = now - dateObj;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;

  return formatDate(dateObj, 'short');
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return 'N/A';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX for 10-digit numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Format as +X (XXX) XXX-XXXX for 11-digit numbers (with country code)
  if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return original for other lengths
  return phone;
};

/**
 * Format number with commas
 * @param {number|string} num - Number to format
 * @returns {string} - Formatted number
 */
export const formatNumber = (num) => {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;

  if (isNaN(numValue)) return '0';

  return new Intl.NumberFormat('en-US').format(numValue);
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength) + '...';
};

/**
 * Format order ID (truncate for display)
 * @param {string} orderId - Order ID (UUID)
 * @returns {string} - Formatted order ID
 */
export const formatOrderId = (orderId) => {
  if (!orderId) return 'N/A';

  // Show first 8 characters of UUID
  return `#${orderId.slice(0, 8).toUpperCase()}`;
};

/**
 * Format meal category for display
 * @param {string} category - Category value
 * @returns {string} - Formatted category
 */
export const formatCategory = (category) => {
  if (!category) return 'N/A';

  // Capitalize first letter
  return category.charAt(0).toUpperCase() + category.slice(1);
};

/**
 * Format status for display
 * @param {string} status - Status value
 * @returns {string} - Formatted status
 */
export const formatStatus = (status) => {
  if (!status) return 'N/A';

  // Replace underscores with spaces and capitalize each word
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format percentage
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (isNaN(value)) return '0%';

  return `${value.toFixed(decimals)}%`;
};

/**
 * Format day of week
 * @param {string|number} dayOfWeek - Day of week ('sunday', 'monday', etc. or 0-6)
 * @returns {string} - Day name
 */
export const formatDayOfWeek = (dayOfWeek) => {
  // If it's a string, capitalize it
  if (typeof dayOfWeek === 'string') {
    return dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
  }

  // If it's a number, use the array
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Invalid Day';
};
