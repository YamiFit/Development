/**
 * Providers Service
 * Handles all meal provider-related API calls
 */

import { supabase } from "@/supabaseClient";
import { mapWorkingHoursRows } from "@/utils/time";

/**
 * Get all active/available meal providers (public listing)
 * @returns {Promise<object>} - Providers data
 */
export const getActiveProviders = async () => {
  try {
    const { data, error } = await supabase
      .from("meal_providers")
      .select(
        "id,business_name,provider_name,profile_image_url,address,phone,email,whatsapp,is_active,is_verified"
      )
      .order("business_name", { ascending: true });

    if (error) throw error;

    const providers = data || [];
    const providerIds = providers.map((p) => p.id).filter(Boolean);

    let hoursByProvider = {};
    if (providerIds.length) {
      const { data: hoursRows, error: hoursError } = await supabase
        .from("provider_working_hours")
        .select("provider_id, day_of_week, is_open, open_time, close_time, delivery_slots")
        .in("provider_id", providerIds);

      if (!hoursError && Array.isArray(hoursRows)) {
        hoursByProvider = hoursRows.reduce((acc, row) => {
          if (!row?.provider_id) return acc;
          acc[row.provider_id] = acc[row.provider_id] || [];
          acc[row.provider_id].push(row);
          return acc;
        }, {});
      } else if (hoursError) {
        console.error("⚠️ Error fetching provider working hours:", hoursError);
      }
    }

    const mapped = providers.map((provider) => ({
      ...provider,
      working_hours: mapWorkingHoursRows(hoursByProvider[provider.id]),
    }));

    return { data: mapped, error: null };
  } catch (error) {
    console.error("❌ Error fetching active providers:", error);
    return { data: [], error };
  }
};

/**
 * Get provider details by provider ID (public view)
 * @param {string} providerId - Provider ID
 * @returns {Promise<object>} - Provider data
 */
export const getProviderById = async (providerId) => {
  try {
    const { data, error } = await supabase
      .from("meal_providers")
      .select(
        "id,business_name,provider_name,profile_image_url,address,phone,email,whatsapp,bio,category,rating,total_reviews,is_active,is_verified"
      )
      .eq("id", providerId)
      // Allow null/true but exclude explicit false
      .neq("is_active", false)
      .single();

    if (error) throw error;

    let working_hours = null;
    if (data?.id) {
      const { data: hoursRows, error: hoursError } = await supabase
        .from("provider_working_hours")
        .select("day_of_week, is_open, open_time, close_time, delivery_slots")
        .eq("provider_id", data.id);

      if (!hoursError && Array.isArray(hoursRows)) {
        working_hours = mapWorkingHoursRows(hoursRows);
      } else if (hoursError) {
        console.error("⚠️ Error fetching provider working hours by id:", hoursError);
      }
    }

    return { data: { ...data, working_hours }, error: null };
  } catch (error) {
    console.error("❌ Error fetching provider by id:", error);
    return { data: null, error };
  }
};

/**
 * Get provider profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Provider data
 */
export const getProviderProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("meal_providers")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If no row found, return null data without error (expected case for new providers)
      if (error.code === "PGRST116") {
        return { data: null, error: null };
      }

      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Create provider profile
 * @param {string} userId - User ID
 * @param {object} providerData - Provider profile data
 * @returns {Promise<object>} - Created provider data
 */
export const createProviderProfile = async (userId, providerData) => {
  try {
    const { data, error } = await supabase
      .from("meal_providers")
      .insert({
        user_id: userId,
        ...providerData,
      })
      .select("*")
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update provider profile
 * @param {string} providerId - Provider ID
 * @param {object} updates - Profile updates
 * @returns {Promise<object>} - Update result
 */
export const updateProviderProfile = async (providerId, updates) => {
  try {
    const { data, error } = await supabase
      .from("meal_providers")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", providerId)
      .select("*")
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error updating provider profile:", error);
    return { data: null, error };
  }
};

/**
 * Get provider statistics (meals count, orders count, revenue)
 * @param {string} providerId - Provider ID
 * @returns {Promise<object>} - Provider stats
 */
export const getProviderStats = async (providerId) => {
  try {
    // Get meals count
    const { count: mealsCount, error: mealsError } = await supabase
      .from("meals")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", providerId)
      .eq("is_available", true);

    if (mealsError) throw mealsError;

    // Get orders with provider's meals and calculate revenue
    const { data: orderItems, error: ordersError } = await supabase
      .from("order_items")
      .select(
        `
        quantity,
        price,
        order_id,
        meals!inner(provider_id)
      `
      )
      .eq("meals.provider_id", providerId);

    if (ordersError) throw ordersError;

    // Calculate unique orders count and total revenue
    const uniqueOrders = new Set(orderItems.map((item) => item.order_id));
    const totalRevenue = orderItems.reduce((sum, item) => {
      return sum + parseFloat(item.price) * parseInt(item.quantity);
    }, 0);

    // Get pending orders count
    const { data: pendingOrderItems, error: pendingError } = await supabase
      .from("order_items")
      .select(
        `
        order_id,
        orders!inner(status),
        meals!inner(provider_id)
      `
      )
      .eq("meals.provider_id", providerId)
      .eq("orders.status", "pending");

    if (pendingError) throw pendingError;

    const pendingOrders = new Set(
      pendingOrderItems.map((item) => item.order_id)
    );

    const stats = {
      totalMeals: mealsCount || 0,
      activeOrders: pendingOrders.size || 0,
      monthlyRevenue: totalRevenue || 0,
      totalOrders: uniqueOrders.size || 0,
      growth: 0, // TODO: Calculate from previous period
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error("❌ Error fetching provider stats:", error);
    return { data: null, error };
  }
};

/**
 * Get provider working hours
 * @param {string} providerId - Provider ID
 * @returns {Promise<object>} - Working hours data
 */
export const getProviderWorkingHours = async (providerId) => {
  try {
    const { data, error } = await supabase
      .from("provider_working_hours")
      .select("*")
      .eq("provider_id", providerId);

    if (error) throw error;

    // Sort in correct week order (sunday first)
    const dayOrder = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const sortedData = (data || []).sort((a, b) => {
      return dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week);
    });

    return { data: sortedData, error: null };
  } catch (error) {
    console.error("❌ Error fetching working hours:", error);
    return { data: [], error };
  }
};

/**
 * Update working hours for a specific day
 * @param {string} providerId - Provider ID
 * @param {string} dayOfWeek - Day of week ('sunday', 'monday', 'tuesday', etc.)
 * @param {object} hoursData - Working hours data {is_open, open_time, close_time, delivery_slots}
 * @returns {Promise<object>} - Update result
 */
export const updateWorkingHours = async (providerId, dayOfWeek, hoursData) => {
  try {
    const { data, error } = await supabase
      .from("provider_working_hours")
      .upsert(
        {
          provider_id: providerId,
          day_of_week: dayOfWeek,
          ...hoursData,
        },
        {
          onConflict: "provider_id,day_of_week",
        }
      )
      .select("*")
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error updating working hours:", error);
    return { data: null, error };
  }
};

/**
 * Batch update working hours for all days
 * @param {string} providerId - Provider ID
 * @param {Array} weeklySchedule - Array of 7 objects with working hours data
 * @returns {Promise<object>} - Update result
 */
export const batchUpdateWorkingHours = async (providerId, weeklySchedule) => {
  try {
    const hoursData = weeklySchedule.map((day) => ({
      provider_id: providerId,
      ...day,
    }));

    const { data, error } = await supabase
      .from("provider_working_hours")
      .upsert(hoursData, {
        onConflict: "provider_id,day_of_week",
      })
      .select("*");

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error updating weekly schedule:", error);
    return { data: null, error };
  }
};
