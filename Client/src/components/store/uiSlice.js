import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    addMealOpen: false,
    sidebarOpen: true,
  },
  reducers: {
    openAddMeal(state) {
      state.addMealOpen = true;
    },
    closeAddMeal(state) {
      state.addMealOpen = false;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    closeSidebar(state) {
      state.sidebarOpen = false;
    },
  },
});

export const { openAddMeal, closeAddMeal, toggleSidebar, closeSidebar } =
  uiSlice.actions;
export default uiSlice.reducer;
