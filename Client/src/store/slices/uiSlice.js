/**
 * UI Slice - UI state management
 * Handles modal states, sidebar, and other UI elements
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  addMealOpen: false,
  sidebarOpen: false,
  mobileMenuOpen: false,
  activeTab: null,
  loading: {},
  modals: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Add meal modal
    openAddMeal: (state) => {
      state.addMealOpen = true;
    },
    closeAddMeal: (state) => {
      state.addMealOpen = false;
    },

    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openSidebar: (state) => {
      state.sidebarOpen = true;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },

    // Mobile menu
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    closeMobileMenu: (state) => {
      state.mobileMenuOpen = false;
    },

    // Active tab
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },

    // Generic loading states
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    clearLoading: (state, action) => {
      const key = action.payload;
      delete state.loading[key];
    },

    // Generic modal management
    openModal: (state, action) => {
      const { name, data } = action.payload;
      state.modals[name] = { open: true, data };
    },
    closeModal: (state, action) => {
      const name = action.payload;
      if (state.modals[name]) {
        state.modals[name].open = false;
      }
    },
    setModalData: (state, action) => {
      const { name, data } = action.payload;
      if (state.modals[name]) {
        state.modals[name].data = data;
      }
    },
  },
});

export const {
  openAddMeal,
  closeAddMeal,
  toggleSidebar,
  openSidebar,
  closeSidebar,
  toggleMobileMenu,
  closeMobileMenu,
  setActiveTab,
  setLoading,
  clearLoading,
  openModal,
  closeModal,
  setModalData,
} = uiSlice.actions;

export default uiSlice.reducer;
