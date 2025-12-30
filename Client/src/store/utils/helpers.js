/**
 * Redux Utilities - Helper functions for Redux operations
 * DRY principle for common Redux patterns
 */

/**
 * Create initial state helper
 * Standardize initial state structure
 */
export const createInitialState = (additionalState = {}) => ({
  loading: false,
  error: null,
  ...additionalState,
});

/**
 * Create loading state reducer
 */
export const createLoadingReducer = (state, action) => {
  state.loading = action.payload;
};

/**
 * Create error state reducer
 */
export const createErrorReducer = (state, action) => {
  state.error = action.payload;
  state.loading = false;
};

/**
 * Create clear error reducer
 */
export const createClearErrorReducer = (state) => {
  state.error = null;
};

/**
 * Create reset state reducer
 */
export const createResetStateReducer = (initialState) => (state) => {
  Object.assign(state, initialState);
};

/**
 * Deep clone utility for immutable updates
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
};

/**
 * Merge objects deeply
 */
export const deepMerge = (target, source) => {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
};

/**
 * Check if value is object
 */
const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Create entity adapter helpers
 * For normalized state management
 */
export const createEntityHelpers = () => ({
  /**
   * Add entity to state
   */
  addEntity: (state, entity, idKey = 'id') => {
    state.entities[entity[idKey]] = entity;
    if (!state.ids.includes(entity[idKey])) {
      state.ids.push(entity[idKey]);
    }
  },

  /**
   * Update entity in state
   */
  updateEntity: (state, id, updates) => {
    if (state.entities[id]) {
      state.entities[id] = { ...state.entities[id], ...updates };
    }
  },

  /**
   * Remove entity from state
   */
  removeEntity: (state, id) => {
    delete state.entities[id];
    state.ids = state.ids.filter((entityId) => entityId !== id);
  },

  /**
   * Set all entities
   */
  setEntities: (state, entities, idKey = 'id') => {
    state.entities = {};
    state.ids = [];
    entities.forEach((entity) => {
      state.entities[entity[idKey]] = entity;
      state.ids.push(entity[idKey]);
    });
  },

  /**
   * Get all entities as array
   */
  selectAllEntities: (state) => {
    return state.ids.map((id) => state.entities[id]);
  },

  /**
   * Get entity by id
   */
  selectEntityById: (state, id) => {
    return state.entities[id];
  },
});

/**
 * Create pagination helpers
 */
export const createPaginationHelpers = () => ({
  initialState: {
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: false,
  },

  setPage: (state, page) => {
    state.pagination.page = page;
  },

  setPageSize: (state, pageSize) => {
    state.pagination.pageSize = pageSize;
    state.pagination.page = 1; // Reset to first page
  },

  setTotal: (state, total) => {
    state.pagination.total = total;
    state.pagination.hasMore = state.pagination.page * state.pagination.pageSize < total;
  },

  nextPage: (state) => {
    if (state.pagination.hasMore) {
      state.pagination.page += 1;
    }
  },

  prevPage: (state) => {
    if (state.pagination.page > 1) {
      state.pagination.page -= 1;
    }
  },
});

/**
 * Create filter helpers
 */
export const createFilterHelpers = () => ({
  initialState: {
    filters: {},
    sortBy: null,
    sortOrder: 'asc',
  },

  setFilter: (state, key, value) => {
    state.filters[key] = value;
  },

  removeFilter: (state, key) => {
    delete state.filters[key];
  },

  clearFilters: (state) => {
    state.filters = {};
  },

  setSorting: (state, sortBy, sortOrder = 'asc') => {
    state.sortBy = sortBy;
    state.sortOrder = sortOrder;
  },

  toggleSortOrder: (state) => {
    state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
  },
});

/**
 * Safe JSON parse with fallback
 */
export const safeJSONParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

/**
 * Safe JSON stringify
 */
export const safeJSONStringify = (value, fallback = '{}') => {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
};

/**
 * Create timestamp
 */
export const createTimestamp = () => new Date().toISOString();

/**
 * Is expired helper
 */
export const isExpired = (timestamp, expiryMs) => {
  if (!timestamp) return true;
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  return now - then > expiryMs;
};
