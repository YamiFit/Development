/**
 * Meals Service
 * Handles all meal-related API calls
 */

import { supabase } from "@/supabaseClient";

/**
 * Get meals by provider with optional filters
 * @param {string} providerId - Provider ID
 * @param {object} filters - Optional filters {category, availability, search}
 * @returns {Promise<object>} - Meals data
 */
export const getMealsByProvider = async (providerId, filters = {}) => {
  try {
    let query = supabase
      .from("meals")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters.category && filters.category !== "all") {
      query = query.eq("category", filters.category);
    }

    if (filters.availability && filters.availability !== "all") {
      const isAvailable = filters.availability === "available";
      query = query.eq("is_available", isAvailable);
    }

    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error("❌ Error fetching meals:", error);
    return { data: [], error };
  }
};

/**
 * Get meal by ID
 * @param {string} mealId - Meal ID
 * @returns {Promise<object>} - Meal data
 */
export const getMealById = async (mealId) => {
  try {
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("id", mealId)
      .single();

    if (error) throw error;

    console.log("✅ Meal fetched:", data);
    return { data, error: null };
  } catch (error) {
    console.error("❌ Error fetching meal:", error);
    return { data: null, error };
  }
};

/**
 * Create new meal
 * @param {object} mealData - Meal data
 * @returns {Promise<object>} - Created meal data
 */
export const createMeal = async (mealData) => {
  try {
    const { data, error } = await supabase
      .from("meals")
      .insert(mealData)
      .select("*")
      .single();

    if (error) throw error;

    console.log("✅ Meal created:", data);
    return { data, error: null };
  } catch (error) {
    console.error("❌ Error creating meal:", error);
    return { data: null, error };
  }
};

/**
 * Update meal
 * @param {string} mealId - Meal ID
 * @param {object} updates - Meal updates
 * @returns {Promise<object>} - Updated meal data
 */
export const updateMeal = async (mealId, updates) => {
  try {
    const { data, error } = await supabase
      .from("meals")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mealId)
      .select("*")
      .single();

    if (error) throw error;

    console.log("✅ Meal updated:", data);
    return { data, error: null };
  } catch (error) {
    console.error("❌ Error updating meal:", error);
    return { data: null, error };
  }
};

/**
 * Delete meal (hard delete - permanently removes the record)
 * @param {string} mealId - Meal ID
 * @returns {Promise<object>} - Delete result
 */
export const deleteMeal = async (mealId) => {
  try {
    const { error } = await supabase
      .from("meals")
      .delete()
      .eq("id", mealId);

    if (error) throw error;

    console.log("✅ Meal deleted:", mealId);
    return { data: { id: mealId }, error: null };
  } catch (error) {
    console.error("❌ Error deleting meal:", error);
    return { data: null, error };
  }
};

/**
 * Toggle meal availability
 * @param {string} mealId - Meal ID
 * @param {boolean} isAvailable - Availability status
 * @returns {Promise<object>} - Update result
 */
export const toggleMealAvailability = async (mealId, isAvailable) => {
  try {
    const { data, error } = await supabase
      .from("meals")
      .update({ is_available: isAvailable })
      .eq("id", mealId)
      .select("*")
      .single();

    if (error) throw error;

    console.log("✅ Meal availability toggled:", data);
    return { data, error: null };
  } catch (error) {
    console.error("❌ Error toggling meal availability:", error);
    return { data: null, error };
  }
};

/**
 * Upload meal image to Supabase Storage
 * @param {string} mealId - Meal ID
 * @param {File} file - Image file
 * @returns {Promise<object>} - Upload result with URL
 */
export const uploadMealImage = async (mealId, file) => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${mealId}-${Date.now()}.${fileExt}`;
    const filePath = `meal-images/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from("meal-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("meal-images").getPublicUrl(filePath);

    // Update meal record with image URL
    const { data, error: updateError } = await supabase
      .from("meals")
      .update({ image_url: publicUrl })
      .eq("id", mealId)
      .select("*")
      .single();

    if (updateError) throw updateError;

    console.log("✅ Meal image uploaded:", publicUrl);
    return { data: { url: publicUrl, meal: data }, error: null };
  } catch (error) {
    console.error("❌ Error uploading meal image:", error);
    return { data: null, error };
  }
};

/**
 * Get meal statistics (reviews, orders count)
 * @param {string} mealId - Meal ID
 * @returns {Promise<object>} - Meal stats
 */
export const getMealStats = async (mealId) => {
  try {
    // Get reviews count
    const { count: reviewsCount, error: reviewsError } = await supabase
      .from("meal_reviews")
      .select("*", { count: "exact", head: true })
      .eq("meal_id", mealId);

    if (reviewsError) throw reviewsError;

    // Get orders count
    const { count: ordersCount, error: ordersError } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("meal_id", mealId);

    if (ordersError) throw ordersError;

    const stats = {
      reviewsCount: reviewsCount || 0,
      ordersCount: ordersCount || 0,
    };

    console.log("✅ Meal stats fetched:", stats);
    return { data: stats, error: null };
  } catch (error) {
    console.error("❌ Error fetching meal stats:", error);
    return { data: null, error };
  }
};
