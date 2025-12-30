/**
 * Coach Service
 * Handles all coach-related API calls
 */

import { supabase } from "@/supabaseClient";

/**
 * Get coach profile by coach ID (user ID)
 * @param {string} coachId - Coach user ID
 * @returns {Promise<object>} - Coach profile data
 */
export const getCoachProfile = async (coachId) => {
  try {
    const { data, error } = await supabase
      .from("coach_profiles")
      .select("*")
      .eq("coach_id", coachId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found (not an error for us)
      throw error;
    }

    return { data: data || null, error: null };
  } catch (error) {
    console.error("❌ Error fetching coach profile:", error);
    return { data: null, error };
  }
};

/**
 * Check if coach profile exists
 * @param {string} coachId - Coach user ID
 * @returns {Promise<object>} - { exists: boolean }
 */
export const checkCoachProfileExists = async (coachId) => {
  try {
    const { data, error } = await supabase
      .from("coach_profiles")
      .select("coach_id")
      .eq("coach_id", coachId)
      .single();

    if (error && error.code === "PGRST116") {
      return { exists: false, error: null };
    }

    if (error) throw error;

    return { exists: !!data, error: null };
  } catch (error) {
    console.error("❌ Error checking coach profile:", error);
    return { exists: false, error };
  }
};

/**
 * Create a new coach profile
 * @param {object} profileData - Coach profile data
 * @returns {Promise<object>} - Created profile data
 */
export const createCoachProfile = async (profileData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("coach_profiles")
      .insert({
        coach_id: user.id,
        ...profileData,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error creating coach profile:", error);
    return { data: null, error };
  }
};

/**
 * Update coach profile
 * @param {string} coachId - Coach user ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} - Updated profile data
 */
export const updateCoachProfile = async (coachId, updates) => {
  try {
    const { data, error } = await supabase
      .from("coach_profiles")
      .update(updates)
      .eq("coach_id", coachId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error updating coach profile:", error);
    return { data: null, error };
  }
};

/**
 * Upsert coach profile (create or update)
 * @param {object} profileData - Coach profile data (must include coach_id)
 * @returns {Promise<object>} - Upserted profile data
 */
export const upsertCoachProfile = async (profileData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("coach_profiles")
      .upsert({
        coach_id: user.id,
        ...profileData,
      }, {
        onConflict: "coach_id",
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error upserting coach profile:", error);
    return { data: null, error };
  }
};

/**
 * Upload coach profile image
 * @param {string} coachId - Coach user ID
 * @param {File} file - Image file to upload
 * @returns {Promise<object>} - { url: string } or error
 */
export const uploadCoachProfileImage = async (coachId, file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `coach-${coachId}-${Date.now()}.${fileExt}`;
    const filePath = `coach-profiles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("meal-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("meal-images")
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error("❌ Error uploading coach profile image:", error);
    return { url: null, error };
  }
};

// ============================================
// TRAINING PLACES CRUD
// ============================================

/**
 * Get all training places for a coach
 * @param {string} coachId - Coach user ID
 * @returns {Promise<object>} - Training places array
 */
export const getCoachTrainingPlaces = async (coachId) => {
  try {
    const { data, error } = await supabase
      .from("coach_training_places")
      .select("*")
      .eq("coach_id", coachId)
      .order("from_date", { ascending: false, nullsFirst: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error("❌ Error fetching training places:", error);
    return { data: [], error };
  }
};

/**
 * Add a training place
 * @param {object} placeData - Training place data
 * @returns {Promise<object>} - Created training place
 */
export const addTrainingPlace = async (placeData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("coach_training_places")
      .insert({
        coach_id: user.id,
        ...placeData,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error adding training place:", error);
    return { data: null, error };
  }
};

/**
 * Update a training place
 * @param {string} placeId - Training place ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} - Updated training place
 */
export const updateTrainingPlace = async (placeId, updates) => {
  try {
    const { data, error } = await supabase
      .from("coach_training_places")
      .update(updates)
      .eq("id", placeId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error updating training place:", error);
    return { data: null, error };
  }
};

/**
 * Delete a training place
 * @param {string} placeId - Training place ID
 * @returns {Promise<object>} - Success status
 */
export const deleteTrainingPlace = async (placeId) => {
  try {
    const { error } = await supabase
      .from("coach_training_places")
      .delete()
      .eq("id", placeId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("❌ Error deleting training place:", error);
    return { success: false, error };
  }
};

/**
 * Get public coach profiles (for users to browse coaches)
 * @returns {Promise<object>} - Array of public coach profiles
 */
export const getPublicCoachProfiles = async () => {
  try {
    const { data, error } = await supabase
      .from("coach_profiles")
      .select("*")
      .eq("is_public", true)
      .order("full_name", { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error("❌ Error fetching public coach profiles:", error);
    return { data: [], error };
  }
};

/**
 * Calculate profile completion percentage
 * @param {object} profile - Coach profile object
 * @returns {number} - Completion percentage (0-100)
 */
export const calculateProfileCompletion = (profile) => {
  if (!profile) return 0;

  const fields = [
    { key: "full_name", weight: 15 },
    { key: "bio", weight: 15 },
    { key: "profile_image_url", weight: 15 },
    { key: "years_of_experience", weight: 10 },
    { key: "specialties", weight: 15, isArray: true },
    { key: "languages", weight: 10, isArray: true },
    { key: "phone", weight: 5 },
    { key: "email", weight: 5 },
    { key: "city", weight: 5 },
    { key: "country", weight: 5 },
  ];

  let completion = 0;

  fields.forEach(({ key, weight, isArray }) => {
    const value = profile[key];
    if (isArray) {
      if (Array.isArray(value) && value.length > 0) {
        completion += weight;
      }
    } else if (value && value !== "") {
      completion += weight;
    }
  });

  return Math.min(completion, 100);
};

// ============================================
// COACH-CLIENT ASSIGNMENT SYSTEM
// ============================================

/**
 * Select a coach (with cooldown + capacity validation)
 * @param {string} coachId - Coach user ID
 * @returns {Promise<object>} - Assignment result
 */
export const selectCoach = async (coachId) => {
  try {
    const { data, error } = await supabase.rpc("select_coach", {
      p_coach_id: coachId,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error selecting coach:", error);
    return { data: null, error };
  }
};

/**
 * End a coach assignment
 * This will set the assignment status to ENDED and trigger a 5-day cooldown
 * @param {string} assignmentId - Assignment ID to end
 * @returns {Promise<object>} - Result
 */
export const endAssignment = async (assignmentId) => {
  try {
    const { data, error } = await supabase
      .from("coach_client_assignments")
      .update({
        status: "ENDED",
        ended_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error ending assignment:", error);
    return { data: null, error };
  }
};

/**
 * Get user's current active assignment
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise<object>} - Current assignment data
 */
export const getCurrentAssignment = async (userId = null) => {
  try {
    // Always get the current user if no userId provided
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) {
      return { data: null, error: new Error("No user ID available") };
    }

    // First get the assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("coach_client_assignments")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (assignmentError) throw assignmentError;
    if (!assignment) return { data: null, error: null };

    // Then get the coach profile separately
    const { data: coachProfile } = await supabase
      .from("coach_profiles")
      .select("full_name, profile_image_url, bio, specialties, years_of_experience")
      .eq("coach_id", assignment.coach_id)
      .maybeSingle();

    // Get the coach's basic profile
    const { data: coach } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("id", assignment.coach_id)
      .maybeSingle();

    return { 
      data: {
        ...assignment,
        coach,
        coach_profile: coachProfile,
      }, 
      error: null 
    };
  } catch (error) {
    console.error("❌ Error fetching current assignment:", error);
    return { data: null, error };
  }
};

/**
 * Get coach's active clients
 * @param {string} coachId - Coach user ID (optional, defaults to current user)
 * @returns {Promise<object>} - Array of clients
 */
export const getCoachClients = async (coachId = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetCoachId = coachId || user?.id;

    // First get assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from("coach_client_assignments")
      .select("*")
      .eq("coach_id", targetCoachId)
      .eq("status", "ACTIVE")
      .order("assigned_at", { ascending: false });

    if (assignmentError) throw assignmentError;
    if (!assignments || assignments.length === 0) {
      return { data: [], error: null };
    }

    // Get user IDs
    const userIds = assignments.map(a => a.user_id);

    // Fetch profiles for these users
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, phone")
      .in("id", userIds);

    if (profileError) throw profileError;

    // Fetch health profiles for these users
    const { data: healthProfiles, error: healthError } = await supabase
      .from("user_health_profiles")
      .select("user_id, current_weight, target_weight, height, goal, activity_level, daily_calorie_target, age, sport, bmi, gender")
      .in("user_id", userIds);

    // Don't throw on health error, it's optional
    const healthMap = {};
    (healthProfiles || []).forEach(hp => {
      healthMap[hp.user_id] = hp;
    });

    const profileMap = {};
    (profiles || []).forEach(p => {
      profileMap[p.id] = p;
    });

    // Combine data
    const result = assignments.map(assignment => ({
      ...assignment,
      user: profileMap[assignment.user_id] || null,
      health_profile: healthMap[assignment.user_id] || null,
    }));

    return { data: result, error: null };
  } catch (error) {
    console.error("❌ Error fetching coach clients:", error);
    return { data: [], error };
  }
};

/**
 * Get coach's client count
 * @param {string} coachId - Coach user ID
 * @returns {Promise<object>} - { count: number }
 */
export const getCoachClientCount = async (coachId) => {
  try {
    const { count, error } = await supabase
      .from("coach_client_assignments")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", coachId)
      .eq("status", "ACTIVE");

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error) {
    console.error("❌ Error fetching coach client count:", error);
    return { count: 0, error };
  }
};

/**
 * Get available coaches (with capacity info)
 * @returns {Promise<object>} - Array of available coaches
 */
export const getAvailableCoaches = async () => {
  try {
    // Get public coach profiles
    const { data: coaches, error: coachError } = await supabase
      .from("coach_profiles")
      .select(`
        *,
        profile:coach_id (
          id, full_name, email, avatar_url
        )
      `)
      .eq("is_public", true)
      .order("full_name", { ascending: true });

    if (coachError) throw coachError;

    // Get client counts for each coach
    const coachesWithCapacity = await Promise.all(
      (coaches || []).map(async (coach) => {
        const { count } = await getCoachClientCount(coach.coach_id);
        return {
          ...coach,
          active_clients: count,
          is_available: count < 10,
          capacity_remaining: 10 - count,
        };
      })
    );

    return { data: coachesWithCapacity, error: null };
  } catch (error) {
    console.error("❌ Error fetching available coaches:", error);
    return { data: [], error };
  }
};

/**
 * Get client's health profile (for coach view)
 * @param {string} userId - Client user ID
 * @returns {Promise<object>} - Health profile data
 */
export const getClientHealthProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("user_health_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return { data: data || null, error: null };
  } catch (error) {
    console.error("❌ Error fetching client health profile:", error);
    return { data: null, error };
  }
};

// ============================================
// CLIENT PLANS (DIET & EXERCISE)
// ============================================

/**
 * Create a client plan
 * @param {object} planData - Plan data
 * @returns {Promise<object>} - Created plan
 */
export const createClientPlan = async (planData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("client_plans")
      .insert({
        coach_id: user.id,
        ...planData,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error creating client plan:", error);
    return { data: null, error };
  }
};

/**
 * Update a client plan
 * @param {string} planId - Plan ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} - Updated plan
 */
export const updateClientPlan = async (planId, updates) => {
  try {
    const { data, error } = await supabase
      .from("client_plans")
      .update(updates)
      .eq("id", planId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error updating client plan:", error);
    return { data: null, error };
  }
};

/**
 * Get plans for a client (coach view)
 * @param {string} userId - Client user ID
 * @returns {Promise<object>} - Array of plans
 */
export const getClientPlans = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("client_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error("❌ Error fetching client plans:", error);
    return { data: [], error };
  }
};

/**
 * Get all plans created by the coach
 * @param {string} coachId - Coach user ID (optional, defaults to current user)
 * @returns {Promise<object>} - Array of plans with client info
 */
export const getCoachPlans = async (coachId = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetCoachId = coachId || user?.id;

    const { data, error } = await supabase
      .from("client_plans")
      .select(`
        *,
        client:user_id (
          id, full_name, email, avatar_url
        )
      `)
      .eq("coach_id", targetCoachId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error("❌ Error fetching coach plans:", error);
    return { data: [], error };
  }
};

/**
 * Get user's active plan (user view)
 * @returns {Promise<object>} - Active plan
 */
export const getMyActivePlan = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      return { data: null, error: new Error("Not authenticated") };
    }

    // First get the plan
    const { data: plan, error: planError } = await supabase
      .from("client_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planError) throw planError;
    if (!plan) return { data: null, error: null };

    // Then get the coach info separately
    const { data: coach } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("id", plan.coach_id)
      .maybeSingle();

    const { data: coachProfile } = await supabase
      .from("coach_profiles")
      .select("full_name, profile_image_url")
      .eq("coach_id", plan.coach_id)
      .maybeSingle();

    return { 
      data: {
        ...plan,
        coach,
        coach_profile: coachProfile,
      }, 
      error: null 
    };
  } catch (error) {
    console.error("❌ Error fetching my active plan:", error);
    return { data: null, error };
  }
};

/**
 * Delete a client plan
 * @param {string} planId - Plan ID
 * @returns {Promise<object>} - Success status
 */
export const deleteClientPlan = async (planId) => {
  try {
    const { error } = await supabase
      .from("client_plans")
      .delete()
      .eq("id", planId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("❌ Error deleting client plan:", error);
    return { success: false, error };
  }
};

// ============================================
// APPOINTMENTS
// ============================================

/**
 * Book an appointment
 * @param {string} coachId - Coach user ID
 * @param {string} startTime - Start time (ISO string)
 * @param {string} endTime - End time (ISO string)
 * @param {string} notes - Optional notes
 * @returns {Promise<object>} - Booking result
 */
export const bookAppointment = async (coachId, startTime, endTime, notes = null) => {
  try {
    const { data, error } = await supabase.rpc("book_appointment", {
      p_coach_id: coachId,
      p_start_time: startTime,
      p_end_time: endTime,
      p_notes: notes,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error booking appointment:", error);
    return { data: null, error };
  }
};

/**
 * Update appointment status
 * @param {string} appointmentId - Appointment ID
 * @param {string} status - New status (CONFIRMED, CANCELED, COMPLETED)
 * @returns {Promise<object>} - Update result
 */
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    // Validate inputs before calling RPC
    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }
    
    // Normalize status to uppercase and American spelling
    const normalizedStatus = String(status).toUpperCase().trim();
    const statusMap = {
      'REQUESTED': 'REQUESTED',
      'CONFIRMED': 'CONFIRMED',
      'CANCELED': 'CANCELED',
      'CANCELLED': 'CANCELED', // British spelling → American
      'COMPLETED': 'COMPLETED',
    };
    
    const finalStatus = statusMap[normalizedStatus];
    if (!finalStatus) {
      throw new Error(`Invalid status: ${status}. Valid values: REQUESTED, CONFIRMED, CANCELED, COMPLETED`);
    }

    console.log("🔍 updateAppointmentStatus:", { appointmentId, originalStatus: status, finalStatus });

    // Use the new function name to bypass schema cache issues
    const { data, error } = await supabase.rpc("change_appointment_status", {
      p_appointment_id: appointmentId,
      p_status: finalStatus,
    });

    // Handle Supabase errors
    if (error) {
      console.error("❌ Supabase RPC error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      
      // Parse specific error types
      let userMessage = "Failed to update appointment status";
      if (error.code === '22P02') {
        userMessage = "Invalid status value. Please try again.";
      } else if (error.code === 'PGRST202') {
        userMessage = "Function not found. Please contact support.";
      } else if (error.code === '42501' || error.message?.includes('permission')) {
        userMessage = "You don't have permission to update this appointment.";
      } else if (error.message) {
        userMessage = error.message;
      }
      
      throw new Error(userMessage);
    }
    
    // Handle function-level errors (from JSONB response)
    if (data && data.success === false) {
      console.error("❌ Function returned error:", data.error);
      throw new Error(data.error || "Failed to update appointment status");
    }

    console.log("✅ Appointment status updated:", data);
    return { data, error: null };
  } catch (error) {
    console.error("❌ updateAppointmentStatus failed:", error.message || error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

/**
 * Get user's appointments
 * @param {string} userId - User ID (optional)
 * @returns {Promise<object>} - Array of appointments
 */
export const getUserAppointments = async (userId = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) {
      return { data: [], error: new Error("No user ID available") };
    }

    // Get appointments first
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", targetUserId)
      .order("start_time", { ascending: true });

    if (error) throw error;
    if (!appointments || appointments.length === 0) {
      return { data: [], error: null };
    }

    // Get unique coach IDs
    const coachIds = [...new Set(appointments.map(a => a.coach_id))];
    
    // Fetch coach profiles
    const { data: coaches } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", coachIds);
    
    const { data: coachProfiles } = await supabase
      .from("coach_profiles")
      .select("coach_id, full_name, profile_image_url")
      .in("coach_id", coachIds);

    // Map coaches to appointments
    const coachMap = (coaches || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
    const profileMap = (coachProfiles || []).reduce((acc, p) => ({ ...acc, [p.coach_id]: p }), {});

    const enrichedAppointments = appointments.map(appt => ({
      ...appt,
      coach: coachMap[appt.coach_id] || null,
      coach_profile: profileMap[appt.coach_id] || null,
    }));

    return { data: enrichedAppointments, error: null };
  } catch (error) {
    console.error("❌ Error fetching user appointments:", error);
    return { data: [], error };
  }
};

/**
 * Get coach's appointments
 * @param {string} coachId - Coach user ID (optional)
 * @param {Date} fromDate - Start date filter
 * @param {Date} toDate - End date filter
 * @returns {Promise<object>} - Array of appointments
 */
export const getCoachAppointments = async (coachId = null, fromDate = null, toDate = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetCoachId = coachId || user?.id;

    let query = supabase
      .from("appointments")
      .select(`
        *,
        client:user_id (
          id, full_name, email, avatar_url
        )
      `)
      .eq("coach_id", targetCoachId)
      .order("start_time", { ascending: true });

    if (fromDate) {
      query = query.gte("start_time", fromDate.toISOString());
    }

    if (toDate) {
      query = query.lte("start_time", toDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error("❌ Error fetching coach appointments:", error);
    return { data: [], error };
  }
};

// ============================================
// MESSAGING
// ============================================

/**
 * Get or create conversation
 * @param {string} otherUserId - The other user's ID
 * @returns {Promise<object>} - Conversation data
 */
export const getOrCreateConversation = async (otherUserId) => {
  try {
    const { data, error } = await supabase.rpc("get_or_create_conversation", {
      p_other_user_id: otherUserId,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error getting/creating conversation:", error);
    return { data: null, error };
  }
};

/**
 * Get user's conversations
 * @returns {Promise<object>} - Array of conversations
 */
export const getConversations = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      return { data: [], error: new Error("Not authenticated") };
    }

    // Get conversations
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`coach_id.eq.${user.id},user_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) throw error;
    if (!conversations || conversations.length === 0) {
      return { data: [], error: null };
    }

    // Get all unique user IDs (coaches and clients)
    const coachIds = [...new Set(conversations.map(c => c.coach_id))];
    const clientIds = [...new Set(conversations.map(c => c.user_id))];
    const allUserIds = [...new Set([...coachIds, ...clientIds])];

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", allUserIds);

    const { data: coachProfiles } = await supabase
      .from("coach_profiles")
      .select("coach_id, full_name, profile_image_url")
      .in("coach_id", coachIds);

    const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    const coachProfileMap = (coachProfiles || []).reduce((acc, p) => ({ ...acc, [p.coach_id]: p }), {});

    const enrichedConversations = conversations.map(conv => ({
      ...conv,
      coach: profileMap[conv.coach_id] || null,
      coach_profile: coachProfileMap[conv.coach_id] || null,
      client: profileMap[conv.user_id] || null,
    }));

    return { data: enrichedConversations, error: null };

    return { data: data || [], error: null };
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    return { data: [], error };
  }
};

/**
 * Get messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Number of messages to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<object>} - Array of messages
 */
export const getMessages = async (conversationId, limit = 50, offset = 0) => {
  try {
    // Get messages
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    if (!messages || messages.length === 0) {
      return { data: [], error: null };
    }

    // Get unique sender IDs
    const senderIds = [...new Set(messages.map(m => m.sender_id))];

    // Fetch sender profiles
    const { data: senders } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", senderIds);

    const senderMap = (senders || []).reduce((acc, s) => ({ ...acc, [s.id]: s }), {});

    const enrichedMessages = messages.map(msg => ({
      ...msg,
      sender: senderMap[msg.sender_id] || null,
    }));

    // Reverse to get chronological order
    return { data: enrichedMessages.reverse(), error: null };
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    return { data: [], error };
  }
};

/**
 * Send a message
 * @param {string} conversationId - Conversation ID
 * @param {string} body - Message body
 * @returns {Promise<object>} - Sent message
 */
export const sendMessage = async (conversationId, body) => {
  try {
    const { data, error } = await supabase.rpc("send_message", {
      p_conversation_id: conversationId,
      p_body: body,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return { data: null, error };
  }
};

/**
 * Mark messages as read
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<object>} - Update result
 */
export const markMessagesAsRead = async (conversationId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    return { success: false, error };
  }
};

/**
 * Subscribe to new messages in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {function} callback - Callback function for new messages
 * @returns {object} - Subscription object (call .unsubscribe() to stop)
 */
export const subscribeToMessages = (conversationId, callback) => {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
};

/**
 * Subscribe to conversation updates
 * @param {function} callback - Callback function for updates
 * @returns {object} - Subscription object
 */
export const subscribeToConversations = (callback) => {
  return supabase
    .channel("conversations")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversations",
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
};

// ============================================
// CHAT ATTACHMENTS
// ============================================

/**
 * Generate a unique message ID for attachment upload
 * @returns {string} - UUID
 */
export const generateMessageId = () => {
  return crypto.randomUUID();
};

/**
 * Upload a chat attachment
 * @param {string} conversationId - Conversation ID
 * @param {string} messageId - Pre-generated message ID
 * @param {File} file - File to upload
 * @returns {Promise<object>} - Upload result with path
 */
export const uploadChatAttachment = async (conversationId, messageId, file) => {
  try {
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    const filePath = `${conversationId}/${messageId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from("chat-attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    return {
      success: true,
      path: data.path,
      name: file.name,
      mime: file.type,
      size: file.size,
      error: null,
    };
  } catch (error) {
    console.error("❌ Error uploading chat attachment:", error);
    return { success: false, error };
  }
};

/**
 * Delete a chat attachment (for cleanup on failed message send)
 * @param {string} path - Storage path
 * @returns {Promise<object>} - Deletion result
 */
export const deleteChatAttachment = async (path) => {
  try {
    const { error } = await supabase.storage
      .from("chat-attachments")
      .remove([path]);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("❌ Error deleting chat attachment:", error);
    return { success: false, error };
  }
};

/**
 * Get a signed URL for a chat attachment
 * @param {string} path - Storage path
 * @param {number} expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns {Promise<object>} - Signed URL
 */
export const getChatAttachmentUrl = async (path, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from("chat-attachments")
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return { url: data.signedUrl, error: null };
  } catch (error) {
    console.error("❌ Error getting attachment URL:", error);
    return { url: null, error };
  }
};

/**
 * Send a message with an attachment
 * @param {string} conversationId - Conversation ID
 * @param {object} options - Message options
 * @param {string} options.body - Optional message text
 * @param {string} options.messageType - 'text', 'image', or 'file'
 * @param {string} options.attachmentPath - Storage path
 * @param {string} options.attachmentName - Original filename
 * @param {string} options.attachmentMime - MIME type
 * @param {number} options.attachmentSize - File size in bytes
 * @returns {Promise<object>} - Sent message
 */
export const sendMessageWithAttachment = async (conversationId, options) => {
  try {
    const { data, error } = await supabase.rpc("send_message_with_attachment", {
      p_conversation_id: conversationId,
      p_body: options.body || null,
      p_message_type: options.messageType || 'text',
      p_attachment_path: options.attachmentPath || null,
      p_attachment_name: options.attachmentName || null,
      p_attachment_mime: options.attachmentMime || null,
      p_attachment_size: options.attachmentSize || null,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("❌ Error sending message with attachment:", error);
    return { data: null, error };
  }
};

/**
 * Get chat status (active or read-only)
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<object>} - Chat status
 */
export const getChatStatus = async (conversationId) => {
  try {
    const { data, error } = await supabase.rpc("get_chat_status", {
      p_conversation_id: conversationId,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("❌ Error getting chat status:", error);
    return { data: null, error };
  }
};

/**
 * Determine message type from MIME type
 * @param {string} mimeType - MIME type of file
 * @returns {string} - 'image' or 'file'
 */
export const getMessageTypeFromMime = (mimeType) => {
  if (mimeType && mimeType.startsWith('image/')) {
    return 'image';
  }
  return 'file';
};

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Check if a file type is allowed for chat attachments
 * @param {string} mimeType - MIME type
 * @returns {boolean} - Whether the file type is allowed
 */
export const isAllowedAttachmentType = (mimeType) => {
  const allowedTypes = [
    'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'text/plain',
    'text/csv',
  ];
  return allowedTypes.includes(mimeType);
};

/**
 * Maximum file size for chat attachments (50MB)
 */
export const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;

// ============================================
// UNREAD MESSAGE TRACKING
// ============================================

/**
 * Get total unread message count for current user
 * @returns {Promise<object>} - { count: number }
 */
export const getUnreadMessageCount = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return { count: 0, error: null };

    // Get all conversations user is part of
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .or(`coach_id.eq.${user.id},user_id.eq.${user.id}`);

    if (convError) throw convError;
    if (!conversations || conversations.length === 0) return { count: 0, error: null };

    const conversationIds = conversations.map(c => c.id);

    // Count unread messages (not sent by current user and read_at is null)
    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error) {
    console.error("❌ Error getting unread count:", error);
    return { count: 0, error };
  }
};

/**
 * Get unread message count per conversation for current user
 * @returns {Promise<object>} - { counts: { [conversationId]: number } }
 */
export const getUnreadCountByConversation = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return { counts: {}, error: null };

    // Get all unread messages for user
    const { data: messages, error } = await supabase
      .from("messages")
      .select("conversation_id")
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (error) throw error;

    // Count per conversation
    const counts = {};
    (messages || []).forEach(msg => {
      counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
    });

    return { counts, error: null };
  } catch (error) {
    console.error("❌ Error getting unread counts:", error);
    return { counts: {}, error };
  }
};

/**
 * Subscribe to unread message count changes
 * @param {function} callback - Callback function with new count
 * @returns {object} - Subscription object
 */
export const subscribeToUnreadCount = (userId, callback) => {
  return supabase
    .channel("unread_messages")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      async (payload) => {
        // New message arrived - check if it's for this user
        if (payload.new.sender_id !== userId) {
          // Fetch updated count
          const { count } = await getUnreadMessageCount();
          callback(count);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
      },
      async (payload) => {
        // Message was updated (possibly marked as read)
        if (payload.new.read_at && !payload.old?.read_at) {
          const { count } = await getUnreadMessageCount();
          callback(count);
        }
      }
    )
    .subscribe();
};
