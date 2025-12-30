/**
 * Validation Utilities
 * Common validation functions for forms and inputs
 */

/**
 * Validate meal form data
 * @param {object} formData - Meal form data
 * @returns {object} - Errors object
 */
export const validateMealForm = (formData) => {
  const errors = {};

  // Required fields
  if (!formData.name?.trim()) {
    errors.name = 'Meal name is required';
  }

  if (!formData.category) {
    errors.category = 'Category is required';
  }

  if (!formData.price || parseFloat(formData.price) <= 0) {
    errors.price = 'Price must be greater than 0';
  }

  // Nutritional values validation
  const nutritionalFields = ['calories', 'protein', 'carbs', 'fats'];
  nutritionalFields.forEach(field => {
    if (formData[field] === undefined || formData[field] === '' || parseFloat(formData[field]) < 0) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be 0 or greater`;
    }
  });

  // Optional nutritional fields
  const optionalNutritionalFields = ['fiber', 'sugar', 'sodium'];
  optionalNutritionalFields.forEach(field => {
    if (formData[field] !== undefined && formData[field] !== '' && parseFloat(formData[field]) < 0) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be 0 or greater`;
    }
  });

  return errors;
};

/**
 * Validate image file
 * @param {File} file - Image file
 * @returns {object} - Validation result {valid, error}
 */
export const validateImage = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be less than 5MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  return { valid: true };
};

/**
 * Validate price value
 * @param {number|string} price - Price value
 * @returns {boolean} - Is valid
 */
export const validatePrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice > 0 && numPrice < 10000;
};

/**
 * Validate nutrition value
 * @param {number|string} value - Nutrition value
 * @returns {boolean} - Is valid
 */
export const validateNutrition = (value) => {
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue >= 0;
};

/**
 * Validate provider profile data
 * @param {object} profileData - Provider profile data
 * @returns {object} - Errors object
 */
export const validateProviderProfile = (profileData) => {
  const errors = {};

  if (!profileData.business_name?.trim()) {
    errors.business_name = 'Business name is required';
  }

  if (!profileData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
    errors.email = 'Invalid email format';
  }

  if (!profileData.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^\+?[\d\s\-()]+$/.test(profileData.phone)) {
    errors.phone = 'Invalid phone number format';
  }

  if (!profileData.address?.trim()) {
    errors.address = 'Address is required';
  }

  return errors;
};

/**
 * Validate working hours data
 * @param {object} hoursData - Working hours data {is_open, open_time, close_time}
 * @returns {object} - Errors object
 */
export const validateWorkingHours = (hoursData) => {
  const errors = {};

  if (hoursData.is_open) {
    if (!hoursData.open_time) {
      errors.open_time = 'Opening time is required when open';
    }

    if (!hoursData.close_time) {
      errors.close_time = 'Closing time is required when open';
    }

    // Check if close time is after open time
    if (hoursData.open_time && hoursData.close_time) {
      const [openHour, openMin] = hoursData.open_time.split(':').map(Number);
      const [closeHour, closeMin] = hoursData.close_time.split(':').map(Number);

      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;

      if (closeMinutes <= openMinutes) {
        errors.close_time = 'Closing time must be after opening time';
      }
    }
  }

  return errors;
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - Is valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number
 * @returns {boolean} - Is valid
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone);
};

/**
 * Check if object has any errors
 * @param {object} errors - Errors object
 * @returns {boolean} - Has errors
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};
