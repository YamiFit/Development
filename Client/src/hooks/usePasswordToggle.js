/**
 * Custom hook for password visibility toggle
 */

import { useState, useCallback } from 'react';

export const usePasswordToggle = (initialState = false) => {
  const [isVisible, setIsVisible] = useState(initialState);

  const toggle = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const show = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    toggle,
    show,
    hide,
    inputType: isVisible ? 'text' : 'password',
  };
};
