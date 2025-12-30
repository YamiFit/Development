/**
 * useDebounce Hook - Debounce value changes
 * Delays updating a value until after a specified delay
 */

import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {any} - Debounced value
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
