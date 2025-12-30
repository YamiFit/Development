import { useState, useEffect, useCallback } from 'react';
import { intakeService } from '@/services/api/intake.service';

/**
 * Hook for managing daily intake tracking
 */
export function useIntakeTracking() {
  const [dailyIntake, setDailyIntake] = useState({
    calories_consumed: 0,
    protein_consumed: 0,
    carbs_consumed: 0,
    fats_consumed: 0,
    water_consumed: 0
  });
  const [meals, setMeals] = useState([]);
  const [waterEntries, setWaterEntries] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all today's data
  const fetchTodayData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [intake, todayMeals, todayWater, weekly] = await Promise.all([
        intakeService.getTodayIntake(),
        intakeService.getTodayMeals(),
        intakeService.getTodayWaterEntries(),
        intakeService.getWeeklyProgress()
      ]);

      setDailyIntake(intake);
      setMeals(todayMeals);
      setWaterEntries(todayWater);
      setWeeklyProgress(weekly);
    } catch (err) {
      console.error('Failed to fetch intake data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a meal
  const addMeal = useCallback(async (mealData) => {
    try {
      await intakeService.addMeal(mealData);
      // Refresh data
      await fetchTodayData();
      return true;
    } catch (err) {
      console.error('Failed to add meal:', err);
      setError(err.message);
      return false;
    }
  }, [fetchTodayData]);

  // Add water
  const addWater = useCallback(async (amount = 250) => {
    try {
      await intakeService.addWater(amount);
      // Optimistically update
      setDailyIntake(prev => ({
        ...prev,
        water_consumed: prev.water_consumed + amount
      }));
      setWaterEntries(prev => [{ amount, logged_at: new Date().toISOString() }, ...prev]);
      return true;
    } catch (err) {
      console.error('Failed to add water:', err);
      setError(err.message);
      // Revert on error
      await fetchTodayData();
      return false;
    }
  }, [fetchTodayData]);

  // Update exercise progress
  const updateExercise = useCallback(async (exerciseData) => {
    try {
      await intakeService.updateExerciseLog(exerciseData);
      // Refresh weekly data
      const weekly = await intakeService.getWeeklyProgress();
      setWeeklyProgress(weekly);
      return true;
    } catch (err) {
      console.error('Failed to update exercise:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // Delete a meal
  const deleteMeal = useCallback(async (mealId) => {
    try {
      await intakeService.deleteMeal(mealId);
      await fetchTodayData();
      return true;
    } catch (err) {
      console.error('Failed to delete meal:', err);
      setError(err.message);
      return false;
    }
  }, [fetchTodayData]);

  // Load data on mount
  useEffect(() => {
    fetchTodayData();
  }, [fetchTodayData]);

  return {
    // Data
    dailyIntake,
    meals,
    waterEntries,
    weeklyProgress,
    loading,
    error,
    // Actions
    addMeal,
    addWater,
    updateExercise,
    deleteMeal,
    refresh: fetchTodayData
  };
}

export default useIntakeTracking;
