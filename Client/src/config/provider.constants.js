/**
 * Provider Constants
 * Constants specific to meal provider functionality
 */

/**
 * Meal Categories
 */
export const MEAL_CATEGORIES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'dessert', label: 'Dessert' },
];

/**
 * Order Statuses
 */
export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'preparing', label: 'Preparing', color: 'orange' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'purple' },
  { value: 'delivered', label: 'Delivered', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
];

/**
 * Order Status Values (for filtering)
 */
export const ORDER_STATUS_VALUES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

/**
 * Meal Category Values
 */
export const MEAL_CATEGORY_VALUES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
  DESSERT: 'dessert',
};

/**
 * Filter Options for Meals
 */
export const MEAL_FILTER_OPTIONS = {
  CATEGORY: [
    { value: 'all', label: 'All Categories' },
    ...MEAL_CATEGORIES,
  ],
  AVAILABILITY: [
    { value: 'all', label: 'All Status' },
    { value: 'available', label: 'Available' },
    { value: 'unavailable', label: 'Unavailable' },
  ],
};

/**
 * Filter Options for Orders
 */
export const ORDER_FILTER_OPTIONS = {
  STATUS: [
    { value: 'all', label: 'All Statuses' },
    ...ORDER_STATUSES,
  ],
};

/**
 * Days of Week
 */
export const DAYS_OF_WEEK = [
  { value: 'sunday', label: 'Sunday', short: 'Sun' },
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
];

/**
 * Default Working Hours
 */
export const DEFAULT_WORKING_HOURS = {
  is_open: false,
  open_time: '09:00',
  close_time: '17:00',
  delivery_slots: [],
};

/**
 * Common Delivery Time Slots
 */
export const COMMON_DELIVERY_SLOTS = [
  '09:00-12:00',
  '12:00-15:00',
  '15:00-18:00',
  '18:00-21:00',
];

/**
 * Time Options (for select inputs)
 */
export const TIME_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
  const hourStr = hour.toString().padStart(2, '0');
  return [
    { value: `${hourStr}:00`, label: `${hourStr}:00` },
    { value: `${hourStr}:30`, label: `${hourStr}:30` },
  ];
}).flat();

/**
 * Image Upload Constraints
 */
export const IMAGE_UPLOAD_CONSTRAINTS = {
  maxSize: 5 * 1024 * 1024, // 5MB in bytes
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
};

/**
 * Meal Form Default Values
 */
export const MEAL_FORM_DEFAULTS = {
  name: '',
  description: '',
  category: '',
  price: '',
  calories: '',
  protein: '',
  carbs: '',
  fats: '',
  fiber: '',
  sugar: '',
  sodium: '',
  serving_size: '',
  preparation_time: '',
  ingredients: [],
  is_available: true,
};

/**
 * Provider Profile Default Values
 */
export const PROVIDER_PROFILE_DEFAULTS = {
  business_name: '',
  business_license: '',
  address: '',
  phone: '',
  email: '',
};

/**
 * Stats Card Icons Configuration
 */
export const STATS_ICONS = {
  meals: {
    icon: 'Package',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  orders: {
    icon: 'ShoppingCart',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  revenue: {
    icon: 'DollarSign',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  growth: {
    icon: 'TrendingUp',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
};

/**
 * Default Pagination
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
};

/**
 * Toast Messages
 */
export const TOAST_MESSAGES = {
  MEAL_CREATED: 'Meal created successfully',
  MEAL_UPDATED: 'Meal updated successfully',
  MEAL_DELETED: 'Meal deleted successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  WORKING_HOURS_UPDATED: 'Working hours updated successfully',
  IMAGE_UPLOADED: 'Image uploaded successfully',
  ERROR_GENERIC: 'An error occurred. Please try again.',
  ERROR_IMAGE_UPLOAD: 'Failed to upload image. Please try again.',
  ERROR_NETWORK: 'Network error. Please check your connection.',
};

/**
 * Provider Dashboard Quick Actions
 */
export const QUICK_ACTIONS = [
  {
    id: 'add_meal',
    title: 'Add Meal',
    description: 'Create a new meal offering',
    icon: 'Package',
    iconColor: 'text-blue-600',
    route: null, // Opens modal
  },
  {
    id: 'view_orders',
    title: 'View Orders',
    description: 'Manage pending orders',
    icon: 'ShoppingCart',
    iconColor: 'text-orange-600',
    route: '/provider/orders',
  },
  {
    id: 'sales_report',
    title: 'Sales Report',
    description: 'View revenue analytics',
    icon: 'DollarSign',
    iconColor: 'text-green-600',
    route: '/provider/revenue',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Business insights',
    icon: 'TrendingUp',
    iconColor: 'text-purple-600',
    route: '/provider/analytics',
  },
];
