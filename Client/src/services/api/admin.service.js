/**
 * Admin Service
 * Handles all admin-related API calls
 */

import { supabase } from "@/supabaseClient";

// ==================== DASHBOARD ====================

/**
 * Get admin dashboard statistics
 * @returns {Promise<object>} - Dashboard stats
 */
export const getDashboardStats = async () => {
  try {
    const { data, error } = await supabase
      .from("admin_dashboard_stats")
      .select("*")
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    return { data: null, error };
  }
};

/**
 * Get recent activity logs
 * @param {number} limit - Number of logs to fetch
 * @returns {Promise<object>} - Activity logs
 */
export const getRecentActivityLogs = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from("admin_activity_log")
      .select(`
        *,
        profiles:admin_id(full_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error("❌ Error fetching activity logs:", error);
    return { data: [], error };
  }
};

/**
 * Log admin activity
 * @param {object} activity - Activity details
 * @returns {Promise<object>} - Log result
 */
export const logAdminActivity = async (activity) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("admin_activity_log")
      .insert({
        admin_id: user?.id,
        action: activity.action,
        entity_type: activity.entityType,
        entity_id: activity.entityId,
        old_values: activity.oldValues || null,
        new_values: activity.newValues || null,
        reason: activity.reason || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error logging activity:", error);
    return { data: null, error };
  }
};

// ==================== PROVIDERS ====================

/**
 * Get all providers (admin view)
 * @param {object} filters - Optional filters
 * @returns {Promise<object>} - Providers data
 */
export const getAllProviders = async (filters = {}) => {
  try {
    let query = supabase
      .from("admin_providers_view")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(`business_name.ilike.%${filters.search}%,provider_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters.verified !== undefined && filters.verified !== "all") {
      query = query.eq("is_verified", filters.verified === "true");
    }

    if (filters.active !== undefined && filters.active !== "all") {
      query = query.eq("is_active", filters.active === "true");
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error("❌ Error fetching providers:", error);
    return { data: [], error };
  }
};

/**
 * Get provider details (admin view)
 * @param {string} providerId - Provider ID
 * @returns {Promise<object>} - Provider details
 */
export const getProviderDetails = async (providerId) => {
  try {
    const { data, error } = await supabase
      .from("admin_providers_view")
      .select("*")
      .eq("id", providerId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error fetching provider details:", error);
    return { data: null, error };
  }
};

/**
 * Verify/Unverify a provider
 * @param {string} providerId - Provider ID
 * @param {boolean} isVerified - Verification status
 * @param {string} reason - Reason for action
 * @returns {Promise<object>} - Update result
 */
export const verifyProvider = async (providerId, isVerified, reason = "") => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get current state for logging
    const { data: oldData } = await supabase
      .from("meal_providers")
      .select("is_verified, verified_at, verified_by")
      .eq("id", providerId)
      .single();

    const updateData = {
      is_verified: isVerified,
      verified_at: isVerified ? new Date().toISOString() : null,
      verified_by: isVerified ? user?.id : null,
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    };

    const { data, error } = await supabase
      .from("meal_providers")
      .update(updateData)
      .eq("id", providerId)
      .select()
      .single();

    if (error) throw error;

    // Log the activity
    await logAdminActivity({
      action: isVerified ? "verify_provider" : "unverify_provider",
      entityType: "meal_provider",
      entityId: providerId,
      oldValues: oldData,
      newValues: { is_verified: isVerified },
      reason,
    });

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error verifying provider:", error);
    return { data: null, error };
  }
};

/**
 * Toggle provider active status
 * @param {string} providerId - Provider ID
 * @param {boolean} isActive - Active status
 * @param {string} reason - Reason for action
 * @returns {Promise<object>} - Update result
 */
export const toggleProviderActive = async (providerId, isActive, reason = "") => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: oldData } = await supabase
      .from("meal_providers")
      .select("is_active")
      .eq("id", providerId)
      .single();

    const { data, error } = await supabase
      .from("meal_providers")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq("id", providerId)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity({
      action: isActive ? "activate_provider" : "deactivate_provider",
      entityType: "meal_provider",
      entityId: providerId,
      oldValues: oldData,
      newValues: { is_active: isActive },
      reason,
    });

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error toggling provider active:", error);
    return { data: null, error };
  }
};

/**
 * Toggle provider temporarily disabled
 * @param {string} providerId - Provider ID
 * @param {boolean} isDisabled - Disabled status
 * @param {string} reason - Reason for action
 * @returns {Promise<object>} - Update result
 */
export const toggleProviderDisabled = async (providerId, isDisabled, reason = "") => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: oldData } = await supabase
      .from("meal_providers")
      .select("is_temporarily_disabled")
      .eq("id", providerId)
      .single();

    const { data, error } = await supabase
      .from("meal_providers")
      .update({
        is_temporarily_disabled: isDisabled,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq("id", providerId)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity({
      action: isDisabled ? "disable_provider" : "enable_provider",
      entityType: "meal_provider",
      entityId: providerId,
      oldValues: oldData,
      newValues: { is_temporarily_disabled: isDisabled },
      reason,
    });

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error toggling provider disabled:", error);
    return { data: null, error };
  }
};

/**
 * Update provider details (admin)
 * @param {string} providerId - Provider ID
 * @param {object} updates - Fields to update
 * @param {string} reason - Reason for update
 * @returns {Promise<object>} - Update result
 */
export const updateProviderAdmin = async (providerId, updates, reason = "") => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: oldData } = await supabase
      .from("meal_providers")
      .select("*")
      .eq("id", providerId)
      .single();

    const { data, error } = await supabase
      .from("meal_providers")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq("id", providerId)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity({
      action: "update_provider",
      entityType: "meal_provider",
      entityId: providerId,
      oldValues: oldData,
      newValues: updates,
      reason,
    });

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error updating provider:", error);
    return { data: null, error };
  }
};

// ==================== MEALS ====================

/**
 * Get all meals (admin view)
 * @param {object} filters - Optional filters
 * @returns {Promise<object>} - Meals data
 */
export const getAllMeals = async (filters = {}) => {
  try {
    let query = supabase
      .from("meals")
      .select(`
        *,
        meal_providers!inner(
          id,
          business_name,
          provider_name,
          is_verified,
          is_active
        )
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    if (filters.category && filters.category !== "all") {
      query = query.eq("category", filters.category);
    }

    if (filters.available !== undefined && filters.available !== "all") {
      query = query.eq("is_available", filters.available === "true");
    }

    if (filters.providerId) {
      query = query.eq("provider_id", filters.providerId);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
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
 * Update meal (admin)
 * @param {string} mealId - Meal ID
 * @param {object} updates - Fields to update
 * @param {string} reason - Reason for update
 * @returns {Promise<object>} - Update result
 */
export const updateMealAdmin = async (mealId, updates, reason = "") => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: oldData } = await supabase
      .from("meals")
      .select("*")
      .eq("id", mealId)
      .single();

    const { data, error } = await supabase
      .from("meals")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq("id", mealId)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity({
      action: "update_meal",
      entityType: "meal",
      entityId: mealId,
      oldValues: oldData,
      newValues: updates,
      reason,
    });

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error updating meal:", error);
    return { data: null, error };
  }
};

/**
 * Toggle meal availability (admin)
 * @param {string} mealId - Meal ID
 * @param {boolean} isAvailable - Availability status
 * @returns {Promise<object>} - Update result
 */
export const toggleMealAvailabilityAdmin = async (mealId, isAvailable) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("meals")
      .update({
        is_available: isAvailable,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq("id", mealId)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity({
      action: isAvailable ? "enable_meal" : "disable_meal",
      entityType: "meal",
      entityId: mealId,
      newValues: { is_available: isAvailable },
    });

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error toggling meal availability:", error);
    return { data: null, error };
  }
};

/**
 * Soft delete meal (admin)
 * @param {string} mealId - Meal ID
 * @param {string} reason - Reason for deletion
 * @returns {Promise<object>} - Delete result
 */
export const deleteMealAdmin = async (mealId, reason = "") => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("meals")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id,
        is_available: false,
      })
      .eq("id", mealId)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity({
      action: "delete_meal",
      entityType: "meal",
      entityId: mealId,
      reason,
    });

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error deleting meal:", error);
    return { data: null, error };
  }
};

// ==================== ORDERS ====================

/**
 * Get all orders (admin view)
 * @param {object} filters - Optional filters
 * @returns {Promise<object>} - Orders data
 */
export const getAllOrders = async (filters = {}) => {
  try {
    let query = supabase
      .from("admin_orders_view")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.search) {
      query = query.or(`customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%,id.ilike.%${filters.search}%`);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.providerId) {
      query = query.eq("provider_id", filters.providerId);
    }

    if (filters.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return { data: [], error };
  }
};

/**
 * Get order details with items
 * @param {string} orderId - Order ID
 * @returns {Promise<object>} - Order details
 */
export const getOrderDetails = async (orderId) => {
  try {
    const { data: order, error: orderError } = await supabase
      .from("admin_orders_view")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        *,
        meals(
          id,
          name,
          image_url,
          category,
          provider_id,
          meal_providers(business_name)
        )
      `)
      .eq("order_id", orderId);

    if (itemsError) throw itemsError;

    return { 
      data: { 
        ...order, 
        items: items || [] 
      }, 
      error: null 
    };
  } catch (error) {
    console.error("❌ Error fetching order details:", error);
    return { data: null, error };
  }
};

/**
 * Force cancel an order (admin only)
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<object>} - Cancel result
 */
export const forceCancelOrder = async (orderId, reason) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: oldData } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
        cancelled_by: user?.id,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity({
      action: "force_cancel_order",
      entityType: "order",
      entityId: orderId,
      oldValues: oldData,
      newValues: { status: "cancelled" },
      reason,
    });

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    return { data: null, error };
  }
};

/**
 * Update order status (admin)
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @param {string} reason - Reason for status change
 * @returns {Promise<object>} - Update result
 */
export const updateOrderStatusAdmin = async (orderId, status, reason = "") => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: oldData } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "cancelled") {
      updateData.cancelled_by = user?.id;
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancellation_reason = reason;
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity({
      action: "update_order_status",
      entityType: "order",
      entityId: orderId,
      oldValues: oldData,
      newValues: { status },
      reason,
    });

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    return { data: null, error };
  }
};

// ==================== USERS & ROLES ====================

/**
 * Get all users for admin management
 * @param {object} filters - Optional filters (search, limit, offset)
 * @returns {Promise<object>} - Users data
 */
export const getAllUsers = async (filters = {}) => {
  try {
    let query = supabase
      .from("profiles")
      .select("id, email, full_name, phone, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply search filter
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    // Apply role filter
    if (filters.role && filters.role !== "all") {
      query = query.eq("role", filters.role);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { data: data || [], count, error: null };
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return { data: [], count: 0, error };
  }
};

/**
 * Update a user's role
 * @param {string} userId - User ID to update
 * @param {string} newRole - New role value
 * @param {string} reason - Reason for change (optional)
 * @returns {Promise<object>} - Updated user data
 */
export const updateUserRole = async (userId, newRole, reason = "") => {
  try {
    // Validate role
    const validRoles = ["user", "meal_provider", "coach", "admin"];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}. Must be one of: ${validRoles.join(", ")}`);
    }

    // Get current role for logging
    const { data: currentUser, error: fetchError } = await supabase
      .from("profiles")
      .select("role, full_name, email")
      .eq("id", userId)
      .single();

    if (fetchError) throw fetchError;

    const oldRole = currentUser?.role;

    // Update role
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    // Log the activity
    await logAdminActivity({
      action: "update_user_role",
      entityType: "profile",
      entityId: userId,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
      reason: reason || `Changed role from ${oldRole} to ${newRole}`,
    });

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error updating user role:", error);
    return { data: null, error };
  }
};

/**
 * Get user count by role for stats
 * @returns {Promise<object>} - Role counts
 */
export const getUserRoleStats = async () => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role");

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      user: 0,
      meal_provider: 0,
      coach: 0,
      admin: 0,
    };

    data?.forEach((profile) => {
      if (stats[profile.role] !== undefined) {
        stats[profile.role]++;
      }
    });

    return { data: stats, error: null };
  } catch (error) {
    console.error("❌ Error fetching user role stats:", error);
    return { data: null, error };
  }
};