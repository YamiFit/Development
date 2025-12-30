/**
 * Provider Orders Slice - Provider orders state management
 * Handles orders containing provider's meals
 */

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  orders: [],
  selectedOrder: null,
  filters: {
    status: "all",
    search: "",
  },
  loading: false,
  error: null,
};

const providerOrdersSlice = createSlice({
  name: "providerOrders",
  initialState,
  reducers: {
    // Set loading state
    setOrdersLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set orders error
    setOrdersError: (state, action) => {
      console.error(
        "❌ Redux providerOrdersSlice: setOrdersError:",
        action.payload
      );
      state.error = action.payload;
      state.loading = false;
    },

    // Clear orders error
    clearOrdersError: (state) => {
      state.error = null;
    },

    // Set orders list
    setOrders: (state, action) => {
      state.orders = action.payload;
      state.loading = false;
    },

    // Add new order
    addOrder: (state, action) => {
      state.orders.unshift(action.payload);
    },

    // Update order
    updateOrder: (state, action) => {
      const index = state.orders.findIndex(
        (order) => order.id === action.payload.id
      );

      if (index !== -1) {
        state.orders[index] = {
          ...state.orders[index],
          ...action.payload,
        };
      }

      // Update selected order if it's the same
      if (state.selectedOrder?.id === action.payload.id) {
        state.selectedOrder = {
          ...state.selectedOrder,
          ...action.payload,
        };
      }
    },

    // Update order status
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const index = state.orders.findIndex((order) => order.id === orderId);

      if (index !== -1) {
        state.orders[index].status = status;
      }

      // Update selected order if it's the same
      if (state.selectedOrder?.id === orderId) {
        state.selectedOrder.status = status;
      }
    },

    // Set selected order
    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload;
    },

    // Clear selected order
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },

    // Set filters
    setOrderFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    // Clear filters
    clearOrderFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Clear all orders data
    clearOrdersData: (state) => {
      state.orders = [];
      state.selectedOrder = null;
      state.filters = initialState.filters;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setOrdersLoading,
  setOrdersError,
  clearOrdersError,
  setOrders,
  addOrder,
  updateOrder,
  updateOrderStatus,
  setSelectedOrder,
  clearSelectedOrder,
  setOrderFilters,
  clearOrderFilters,
  clearOrdersData,
} = providerOrdersSlice.actions;

export default providerOrdersSlice.reducer;
