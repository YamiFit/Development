/**
 * Custom hook for form state management
 * Handles form data, validation, and submission
 */

import { useState, useCallback } from 'react';

/**
 * useForm hook
 * @param {object} initialValues - Initial form values
 * @param {function} onSubmit - Form submission handler
 * @param {function} validate - Validation function
 * @returns {object} - Form state and handlers
 */
export const useForm = (initialValues = {}, onSubmit, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle input change
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  }, [errors]);

  /**
   * Handle field blur
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate single field if validate function provided
    if (validate) {
      const validationResult = validate(values);
      if (validationResult.errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: validationResult.errors[name],
        }));
      }
    }
  }, [values, validate]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    if (validate) {
      const validationResult = validate(values);
      setErrors(validationResult.errors);

      if (!validationResult.isValid) {
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  /**
   * Reset form to initial values
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Set form values programmatically
   */
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  /**
   * Set form error programmatically
   */
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  /**
   * Set field as touched
   */
  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched((prev) => ({
      ...prev,
      [name]: isTouched,
    }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,
  };
};
