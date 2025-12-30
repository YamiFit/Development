/**
 * Meals Slice - Meals state management
 * Handles provider's meals data and filters
 */

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  meals: [],
  selectedMeal: null,
  filters: {
    category: "all",
    availability: "all",
    search: "",
  },
  loading: false,
  error: null,
};

const mealsSlice = createSlice({
  name: "meals",
  initialState,
  reducers: {
    // Set loading state
    setMealsLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set meals error
    setMealsError: (state, action) => {
      console.error("❌ Redux mealsSlice: setMealsError:", action.payload);
      state.error = action.payload;
      state.loading = false;
    },

    // Clear meals error
    clearMealsError: (state) => {
      state.error = null;
    },

    // Set meals list
    setMeals: (state, action) => {
      state.meals = action.payload;
      state.loading = false;
    },

    // Add new meal
    addMeal: (state, action) => {
      state.meals.unshift(action.payload);
    },

    // Update meal
    updateMeal: (state, action) => {
      const index = state.meals.findIndex(
        (meal) => meal.id === action.payload.id
      );

      if (index !== -1) {
        state.meals[index] = {
          ...state.meals[index],
          ...action.payload,
        };
      }

      // Update selected meal if it's the same
      if (state.selectedMeal?.id === action.payload.id) {
        state.selectedMeal = {
          ...state.selectedMeal,
          ...action.payload,
        };
      }
    },

    // Remove meal
    removeMeal: (state, action) => {
      state.meals = state.meals.filter((meal) => meal.id !== action.payload);

      // Clear selected meal if it's the removed one
      if (state.selectedMeal?.id === action.payload) {
        state.selectedMeal = null;
      }
    },

    // Toggle meal availability
    toggleMealAvailability: (state, action) => {
      const { mealId, isAvailable } = action.payload;
      const index = state.meals.findIndex((meal) => meal.id === mealId);

      if (index !== -1) {
        state.meals[index].is_available = isAvailable;
      }

      if (state.selectedMeal?.id === mealId) {
        state.selectedMeal.is_available = isAvailable;
      }
    },

    // Set selected meal
    setSelectedMeal: (state, action) => {
      state.selectedMeal = action.payload;
    },

    // Clear selected meal
    clearSelectedMeal: (state) => {
      state.selectedMeal = null;
    },

    // Set filters
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Clear all meals data
    clearMealsData: (state) => {
      state.meals = [];
      state.selectedMeal = null;
      state.filters = initialState.filters;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setMealsLoading,
  setMealsError,
  clearMealsError,
  setMeals,
  addMeal,
  updateMeal,
  removeMeal,
  toggleMealAvailability,
  setSelectedMeal,
  clearSelectedMeal,
  setFilters,
  clearFilters,
  clearMealsData,
} = mealsSlice.actions;

export default mealsSlice.reducer;
