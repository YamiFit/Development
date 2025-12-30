/**
 * Redux Action Creators - Reusable async action patterns
 * DRY principle for Redux async operations
 */

/**
 * Generic async action wrapper
 * Handles loading states and errors consistently
 */
export const createAsyncAction = (
  asyncFn,
  { onStart, onSuccess, onError, onFinally } = {}
) => {
  return async (dispatch, ...args) => {
    try {
      // Dispatch start action
      if (onStart) {
        dispatch(onStart());
      }

      // Execute async function
      const result = await asyncFn(...args);

      // Dispatch success action
      if (onSuccess && result.data) {
        dispatch(onSuccess(result.data));
      }

      // Execute finally callback
      if (onFinally) {
        dispatch(onFinally());
      }

      return result;
    } catch (error) {
      // Dispatch error action
      if (onError) {
        dispatch(onError(error.message || 'An error occurred'));
      }

      // Execute finally callback
      if (onFinally) {
        dispatch(onFinally());
      }

      return { error };
    }
  };
};

/**
 * Create standardized async thunk pattern
 */
export const createStandardAsyncThunk = (
  name,
  asyncFn,
  { setLoading, setError, clearError, setData }
) => {
  return async (dispatch, ...args) => {
    dispatch(setLoading(true));
    if (clearError) dispatch(clearError());

    try {
      const result = await asyncFn(...args);

      if (result.error) {
        if (setError) dispatch(setError(result.error.message));
        return result;
      }

      if (result.data && setData) {
        dispatch(setData(result.data));
      }

      dispatch(setLoading(false));
      return result;
    } catch (error) {
      if (setError) dispatch(setError(error.message));
      dispatch(setLoading(false));
      return { error };
    }
  };
};

/**
 * Optimistic update wrapper
 * Updates state immediately, reverts on error
 */
export const optimisticUpdate = async (
  dispatch,
  {
    updateAction,
    updatePayload,
    revertAction,
    revertPayload,
    asyncFn,
    setError,
  }
) => {
  // Apply optimistic update
  dispatch(updateAction(updatePayload));

  try {
    // Execute async operation
    const result = await asyncFn();

    if (result.error) {
      // Revert on error
      if (revertAction) {
        dispatch(revertAction(revertPayload));
      }
      if (setError) {
        dispatch(setError(result.error.message));
      }
    }

    return result;
  } catch (error) {
    // Revert on exception
    if (revertAction) {
      dispatch(revertAction(revertPayload));
    }
    if (setError) {
      dispatch(setError(error.message));
    }
    return { error };
  }
};

/**
 * Batch dispatch helper
 * Dispatch multiple actions at once
 */
export const batchDispatch = (dispatch, actions) => {
  actions.forEach((action) => dispatch(action));
};

/**
 * Conditional dispatch helper
 * Only dispatch if condition is met
 */
export const conditionalDispatch = (dispatch, condition, action) => {
  if (condition) {
    dispatch(action);
  }
};

/**
 * Debounced dispatch helper
 * Prevents rapid-fire dispatches
 */
export const createDebouncedDispatch = (dispatch, delay = 300) => {
  let timeoutId = null;

  return (action) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      dispatch(action);
      timeoutId = null;
    }, delay);
  };
};

/**
 * Throttled dispatch helper
 * Limits dispatch frequency
 */
export const createThrottledDispatch = (dispatch, limit = 300) => {
  let lastDispatch = 0;

  return (action) => {
    const now = Date.now();
    if (now - lastDispatch >= limit) {
      dispatch(action);
      lastDispatch = now;
    }
  };
};
