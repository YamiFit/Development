/**
 * Orders Service
 * Handles user and provider-specific order API calls
 */

import { supabase } from '@/supabaseClient';

// ============================================
// ORDER STATUS CONSTANTS
// ============================================

export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  UNDER_PREPARATION: 'under_preparation',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  COMPLETED: 'completed',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Active statuses (shown in /orders for users)
export const ACTIVE_STATUSES = [
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.CONFIRMED,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.UNDER_PREPARATION,
  ORDER_STATUSES.READY,
  ORDER_STATUSES.OUT_FOR_DELIVERY,
];

// Past statuses (shown in /past-orders for users)
export const PAST_STATUSES = [
  ORDER_STATUSES.COMPLETED,
  ORDER_STATUSES.DELIVERED,
  ORDER_STATUSES.CANCELLED,
];

// Status display labels
export const STATUS_LABELS = {
  [ORDER_STATUSES.PENDING]: 'Pending',
  [ORDER_STATUSES.CONFIRMED]: 'Confirmed',
  [ORDER_STATUSES.PREPARING]: 'Preparing',
  [ORDER_STATUSES.UNDER_PREPARATION]: 'Under Preparation',
  [ORDER_STATUSES.READY]: 'Ready',
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [ORDER_STATUSES.COMPLETED]: 'Completed',
  [ORDER_STATUSES.DELIVERED]: 'Delivered',
  [ORDER_STATUSES.CANCELLED]: 'Cancelled',
};

// Allowed status transitions for providers
export const STATUS_TRANSITIONS = {
  [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.UNDER_PREPARATION, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.PREPARING, ORDER_STATUSES.UNDER_PREPARATION, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PREPARING]: [ORDER_STATUSES.READY, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.UNDER_PREPARATION]: [ORDER_STATUSES.READY, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.READY]: [ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.COMPLETED],
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.DELIVERED],
  [ORDER_STATUSES.COMPLETED]: [],
  [ORDER_STATUSES.DELIVERED]: [],
  [ORDER_STATUSES.CANCELLED]: [],
};

// ============================================
// USER ORDERS FUNCTIONS
// ============================================

/**
 * Get user's active orders (pending through out_for_delivery)
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Active orders data
 */
export const getUserActiveOrders = async (userId) => {
  try {
    // First get orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        provider_id,
        status,
        total_amount,
        delivery_fee,
        discount_amount,
        delivery_date,
        delivery_time_slot,
        delivery_type,
        special_instructions,
        created_at,
        updated_at,
        delivery_address_id
      `)
      .eq('user_id', userId)
      .in('status', ACTIVE_STATUSES)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get order items and provider info for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        // Get provider info
        let providerData = null;
        if (order.provider_id) {
          const { data: provider } = await supabase
            .from('meal_providers')
            .select('id, business_name, provider_name, profile_image_url, phone')
            .eq('id', order.provider_id)
            .single();
          providerData = provider;
        }

        // Get delivery address
        let addressData = null;
        if (order.delivery_address_id) {
          const { data: address } = await supabase
            .from('addresses')
            .select('street_address, city')
            .eq('id', order.delivery_address_id)
            .single();
          addressData = address;
        }

        // Get order items
        const { data: items, error: itemsErr } = await supabase
          .from('order_items')
          .select(`
            id,
            quantity,
            price,
            meals(
              id,
              name,
              image_url
            )
          `)
          .eq('order_id', order.id);

        if (itemsErr) {
          console.error('Error fetching order items:', itemsErr);
          return { ...order, items: [] };
        }

        const transformedItems = (items || []).map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          meal_id: item.meals?.id,
          meal_name: item.meals?.name || 'Unknown Item',
          meal_image_url: item.meals?.image_url,
        }));

        return {
          ...order,
          provider_name: providerData?.business_name || providerData?.provider_name || 'Unknown Provider',
          provider_image: providerData?.profile_image_url,
          provider_phone: providerData?.phone,
          delivery_address: addressData,
          items: transformedItems,
        };
      })
    );

    console.log('✅ User active orders fetched:', ordersWithItems.length);
    return { data: ordersWithItems, error: null };
  } catch (error) {
    console.error('❌ Error fetching user active orders:', error);
    return { data: [], error };
  }
};

/**
 * Get user's past orders (completed, delivered, cancelled)
 * @param {string} userId - User ID
 * @param {object} options - Pagination options
 * @returns {Promise<object>} - Past orders data
 */
export const getUserPastOrders = async (userId, options = { limit: 20, offset: 0 }) => {
  try {
    // First get orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        provider_id,
        status,
        total_amount,
        delivery_fee,
        discount_amount,
        delivery_date,
        delivery_time_slot,
        delivery_type,
        special_instructions,
        cancellation_reason,
        cancelled_at,
        created_at,
        updated_at,
        delivery_address_id
      `)
      .eq('user_id', userId)
      .in('status', PAST_STATUSES)
      .order('updated_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);

    if (error) throw error;

    // Get order items and provider info for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        // Get provider info
        let providerData = null;
        if (order.provider_id) {
          const { data: provider } = await supabase
            .from('meal_providers')
            .select('id, business_name, provider_name, profile_image_url')
            .eq('id', order.provider_id)
            .single();
          providerData = provider;
        }

        // Get delivery address
        let addressData = null;
        if (order.delivery_address_id) {
          const { data: address } = await supabase
            .from('addresses')
            .select('street_address, city')
            .eq('id', order.delivery_address_id)
            .single();
          addressData = address;
        }

        // Get order items
        const { data: items, error: itemsErr } = await supabase
          .from('order_items')
          .select(`
            id,
            quantity,
            price,
            meals(
              id,
              name,
              image_url
            )
          `)
          .eq('order_id', order.id);

        if (itemsErr) {
          console.error('Error fetching order items:', itemsErr);
          return { ...order, items: [] };
        }

        const transformedItems = (items || []).map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          meal_id: item.meals?.id,
          meal_name: item.meals?.name || 'Unknown Item',
          meal_image_url: item.meals?.image_url,
        }));

        return {
          ...order,
          provider_name: providerData?.business_name || providerData?.provider_name || 'Unknown Provider',
          provider_image: providerData?.profile_image_url,
          delivery_address: addressData,
          items: transformedItems,
        };
      })
    );

    console.log('✅ User past orders fetched:', ordersWithItems.length);
    return { data: ordersWithItems, error: null };
  } catch (error) {
    console.error('❌ Error fetching user past orders:', error);
    return { data: [], error };
  }
};

/**
 * Subscribe to order updates for a specific user
 * @param {string} userId - User ID
 * @param {function} onInsert - Callback for new orders
 * @param {function} onUpdate - Callback for order updates
 * @returns {object} - Subscription channel
 */
export const subscribeToUserOrders = (userId, onInsert, onUpdate) => {
  const channel = supabase
    .channel(`user-orders-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('📨 New order inserted:', payload.new);
        if (onInsert) onInsert(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('📨 Order updated:', payload.new);
        if (onUpdate) onUpdate(payload.new, payload.old);
      }
    )
    .subscribe();

  return channel;
};

// ============================================
// PROVIDER ORDERS FUNCTIONS
// ============================================

/**
 * Get orders containing provider's meals
 * @param {string} providerId - Provider ID
 * @param {object} filters - Optional filters {status, search, limit}
 * @returns {Promise<object>} - Orders data
 */
export const getProviderOrders = async (providerId, filters = {}) => {
  try {
    // First, get all order IDs that contain this provider's meals
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        order_id,
        meals!inner(provider_id)
      `)
      .eq('meals.provider_id', providerId);

    if (itemsError) throw itemsError;

    // Extract unique order IDs
    const orderIds = [...new Set(orderItems.map(item => item.order_id))];

    if (orderIds.length === 0) {
      return { data: [], error: null };
    }

    // Fetch full order details with customer info
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_user_id_fkey(
          full_name,
          email,
          phone
        ),
        addresses!orders_delivery_address_id_fkey(
          street_address,
          city,
          postal_code,
          state
        )
      `)
      .in('id', orderIds)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    // Apply limit
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) throw ordersError;

    // For each order, get the items that belong to this provider
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const { data: items, error: itemsErr } = await supabase
          .from('order_items')
          .select(`
            id,
            quantity,
            price,
            meals!inner(
              id,
              name,
              image_url,
              provider_id
            )
          `)
          .eq('order_id', order.id)
          .eq('meals.provider_id', providerId);

        if (itemsErr) {
          console.error('Error fetching order items:', itemsErr);
          return { ...order, items: [] };
        }

        // Transform items to flatten the meals data
        const transformedItems = items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          meal_id: item.meals.id,
          meal_name: item.meals.name,
          meal_image_url: item.meals.image_url,
        }));

        return {
          ...order,
          customer_name: order.profiles?.full_name || 'N/A',
          customer_email: order.profiles?.email || 'N/A',
          customer_phone: order.profiles?.phone || 'N/A',
          delivery_address: order.addresses || null,
          items: transformedItems,
        };
      })
    );

    // Apply search filter on customer name or order ID
    let filteredOrders = ordersWithItems;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredOrders = ordersWithItems.filter(order =>
        order.customer_name.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower)
      );
    }

    console.log('✅ Provider orders fetched:', filteredOrders.length, 'orders');
    return { data: filteredOrders, error: null };
  } catch (error) {
    console.error('❌ Error fetching provider orders:', error);
    return { data: [], error };
  }
};

/**
 * Get order details by order ID
 * @param {string} orderId - Order ID
 * @param {string} providerId - Provider ID (to filter items)
 * @returns {Promise<object>} - Order details
 */
export const getOrderDetails = async (orderId, providerId) => {
  try {
    // Get order with customer and address info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_user_id_fkey(
          full_name,
          email,
          phone
        ),
        addresses!orders_delivery_address_id_fkey(
          street_address,
          city,
          postal_code,
          state
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Get order items for this provider
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        quantity,
        price,
        meals!inner(
          id,
          name,
          image_url,
          provider_id
        )
      `)
      .eq('order_id', orderId)
      .eq('meals.provider_id', providerId);

    if (itemsError) throw itemsError;

    // Transform items
    const transformedItems = items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      meal_id: item.meals.id,
      meal_name: item.meals.name,
      meal_image_url: item.meals.image_url,
      subtotal: parseFloat(item.price) * parseInt(item.quantity),
    }));

    const orderDetails = {
      ...order,
      customer_name: order.profiles?.full_name || 'N/A',
      customer_email: order.profiles?.email || 'N/A',
      customer_phone: order.profiles?.phone || 'N/A',
      delivery_address: order.addresses || null,
      items: transformedItems,
    };

    console.log('✅ Order details fetched:', orderDetails);
    return { data: orderDetails, error: null };
  } catch (error) {
    console.error('❌ Error fetching order details:', error);
    return { data: null, error };
  }
};

/**
 * Create order with items (client-side validation, no transaction)
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.providerId
 * @param {Array<{mealId:string, quantity:number, unitPrice?:number, mealName?:string}>} params.items
 * @param {string} [params.notes]
 * @param {string} [params.deliveryType] - Pickup | Delivery (must match DB enum label)
 * @param {number|null} [params.totalPrice]
 */
export const createOrderWithItems = async ({
  userId,
  providerId,
  items = [],
  notes = "",
  deliveryType = "Delivery",
  totalPrice = null,
}) => {
  if (!userId || !providerId) {
    return { data: null, error: new Error("Missing user or provider") };
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { data: null, error: new Error("At least one item is required") };
  }

  const normalizedDeliveryType = (() => {
    if (deliveryType == null || deliveryType === "") return "Delivery";

    const raw = String(deliveryType).trim();
    const upper = raw.toUpperCase();
    if (upper === "DELIVERY") return "Delivery";
    if (upper === "PICKUP") return "Pickup";

    const lower = raw.toLowerCase();
    if (lower === "delivery") return "Delivery";
    if (lower === "pickup") return "Pickup";

    return raw;
  })();

  const computedTotal = (() => {
    const direct = Number(totalPrice);
    if (totalPrice != null && totalPrice !== "" && Number.isFinite(direct)) return direct;

    let sum = 0;
    for (const item of items) {
      const qty = Number(item?.quantity);
      const unit = Number(item?.unitPrice);
      if (!Number.isFinite(qty) || qty <= 0) return null;
      if (!Number.isFinite(unit)) return null;
      sum += unit * qty;
    }
    return Number.isFinite(sum) ? sum : null;
  })();

  if (computedTotal == null) {
    return {
      data: null,
      error: new Error("Missing total amount. Provide totalPrice or valid item unitPrice values."),
    };
  }

  try {
    const payloadAttempts = [
      // Meals ordering schema (if you added these columns)
      {
        user_id: userId,
        provider_id: providerId,
        status: "pending",
        notes,
        delivery_type: normalizedDeliveryType,
        total_price: computedTotal,
      },
      // Base schema from Server/schema.sql (orders.total_amount + special_instructions)
      {
        user_id: userId,
        provider_id: providerId,
        status: "pending",
        special_instructions: notes,
        delivery_type: normalizedDeliveryType,
        total_amount: computedTotal,
      },
      {
        user_id: userId,
        status: "pending",
        special_instructions: notes,
        total_amount: computedTotal,
      },
    ];

    let order = null;
    let lastError = null;

    for (let i = 0; i < payloadAttempts.length; i++) {
      const payload = payloadAttempts[i];
      const { data, error } = await supabase.from("orders").insert(payload).select("*").single();
      if (!error) {
        order = data;
        lastError = null;
        break;
      }

      lastError = error;

      const message = String(error?.message || "");
      const shouldRetry =
        error?.code === "42703" ||
        error?.code === "23502" ||
        /does not exist/i.test(message) ||
        /violates not-null constraint/i.test(message);

      if (!shouldRetry) break;
    }

    if (!order) throw lastError;

    const itemsPayload = items.map((item) => ({
      order_id: order.id,
      meal_id: item.mealId,
      quantity: item.quantity,
      price: item.unitPrice,
    }));

    const { data: createdItems, error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsPayload)
      .select("*");

    if (itemsError) throw itemsError;

    return { data: { order, items: createdItems }, error: null };
  } catch (error) {
    console.error("❌ Error creating order:", error);
    return { data: null, error };
  }
};

/**
 * Get revenue by period for provider
 * @param {string} providerId - Provider ID
 * @param {string} period - Period ('day', 'week', 'month')
 * @returns {Promise<object>} - Revenue data
 */
export const getRevenueByPeriod = async (providerId, period = 'month') => {
  try {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }

    // Get order items for this provider within the period
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        orders!inner(
          created_at,
          status
        ),
        meals!inner(provider_id)
      `)
      .eq('meals.provider_id', providerId)
      .gte('orders.created_at', startDate.toISOString())
      .in('orders.status', ['confirmed', 'preparing', 'out_for_delivery', 'delivered']);

    if (error) throw error;

    const revenue = orderItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * parseInt(item.quantity));
    }, 0);

    console.log('✅ Revenue fetched for', period, ':', revenue);
    return { data: { revenue, period }, error: null };
  } catch (error) {
    console.error('❌ Error fetching revenue:', error);
    return { data: null, error };
  }
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {object} updates - {status, cancellation_reason}
 * @returns {Promise<object>} - Updated order
 */
export const updateOrderStatus = async (orderId, updates) => {
  try {
    const updateData = {
      status: updates.status,
      updated_at: new Date().toISOString(),
    };

    // Add cancellation-specific fields
    if (updates.status === ORDER_STATUSES.CANCELLED) {
      updateData.cancellation_reason = updates.cancellation_reason || null;
      updateData.cancelled_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return { data: null, error };
  }
};

// ============================================
// PROVIDER DASHBOARD FUNCTIONS
// ============================================

/**
 * Get provider's recent orders for dashboard widget
 * @param {string} providerId - Provider ID
 * @param {number} limit - Number of orders to fetch
 * @returns {Promise<object>} - Recent orders
 */
export const getProviderRecentOrders = async (providerId, limit = 5) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        total_amount,
        created_at,
        updated_at,
        profiles!orders_user_id_fkey(
          full_name,
          avatar_url
        )
      `)
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const transformedOrders = orders.map(order => ({
      id: order.id,
      customer_name: order.profiles?.full_name || `User ${order.user_id?.substring(0, 8)}...`,
      customer_avatar: order.profiles?.avatar_url,
      status: order.status,
      total_amount: order.total_amount,
      created_at: order.created_at,
      updated_at: order.updated_at,
    }));

    console.log('✅ Provider recent orders fetched:', transformedOrders.length);
    return { data: transformedOrders, error: null };
  } catch (error) {
    console.error('❌ Error fetching provider recent orders:', error);
    return { data: [], error };
  }
};

/**
 * Get provider's popular meals using RPC function
 * @param {string} providerId - Provider ID
 * @param {number} limit - Number of meals to fetch
 * @returns {Promise<object>} - Popular meals data
 */
export const getProviderPopularMeals = async (providerId, limit = 5) => {
  try {
    const { data, error } = await supabase
      .rpc('get_provider_popular_meals', {
        p_provider_id: providerId,
        p_limit: limit,
      });

    if (error) throw error;

    console.log('✅ Provider popular meals fetched:', data?.length);
    return { data: data || [], error: null };
  } catch (error) {
    console.error('❌ Error fetching provider popular meals:', error);
    
    // Fallback: if RPC doesn't exist, fetch manually
    if (error.code === '42883' || error.message?.includes('does not exist')) {
      console.log('📝 RPC not found, using fallback query...');
      return getProviderPopularMealsFallback(providerId, limit);
    }
    
    return { data: [], error };
  }
};

/**
 * Fallback function if RPC not available
 */
const getProviderPopularMealsFallback = async (providerId, limit = 5) => {
  try {
    // Get all meals for this provider with order items
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select(`
        id,
        name,
        image_url,
        price,
        category
      `)
      .eq('provider_id', providerId)
      .is('deleted_at', null);

    if (mealsError) throw mealsError;

    // Get order items for these meals
    const mealIds = meals.map(m => m.id);
    
    if (mealIds.length === 0) {
      return { data: [], error: null };
    }

    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        meal_id,
        quantity,
        price,
        orders!inner(status)
      `)
      .in('meal_id', mealIds)
      .not('orders.status', 'in', '("cancelled","pending")');

    if (itemsError) throw itemsError;

    // Aggregate sales by meal
    const salesByMeal = {};
    orderItems.forEach(item => {
      if (!salesByMeal[item.meal_id]) {
        salesByMeal[item.meal_id] = { total_sold: 0, total_revenue: 0 };
      }
      salesByMeal[item.meal_id].total_sold += item.quantity;
      salesByMeal[item.meal_id].total_revenue += item.quantity * parseFloat(item.price);
    });

    // Merge with meal data and sort
    const popularMeals = meals
      .map(meal => ({
        meal_id: meal.id,
        meal_name: meal.name,
        meal_image_url: meal.image_url,
        meal_price: meal.price,
        meal_category: meal.category,
        total_sold: salesByMeal[meal.id]?.total_sold || 0,
        total_revenue: salesByMeal[meal.id]?.total_revenue || 0,
      }))
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, limit);

    return { data: popularMeals, error: null };
  } catch (error) {
    console.error('❌ Error in fallback popular meals:', error);
    return { data: [], error };
  }
};

/**
 * Get provider order statistics
 * @param {string} providerId - Provider ID
 * @returns {Promise<object>} - Order stats by status
 */
export const getProviderOrderStats = async (providerId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_provider_order_stats', {
        p_provider_id: providerId,
      });

    if (error) throw error;

    // Convert to object format
    const stats = {};
    (data || []).forEach(item => {
      stats[item.status] = item.count;
    });

    return { data: stats, error: null };
  } catch (error) {
    console.error('❌ Error fetching provider order stats:', error);
    
    // Fallback if RPC doesn't exist
    if (error.code === '42883') {
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('status')
        .eq('provider_id', providerId);

      if (ordersErr) return { data: {}, error: ordersErr };

      const stats = {};
      orders.forEach(o => {
        stats[o.status] = (stats[o.status] || 0) + 1;
      });

      return { data: stats, error: null };
    }
    
    return { data: {}, error };
  }
};

/**
 * Subscribe to provider orders for real-time updates
 * @param {string} providerId - Provider ID
 * @param {function} onInsert - Callback for new orders
 * @param {function} onUpdate - Callback for order updates
 * @returns {object} - Subscription channel
 */
export const subscribeToProviderOrders = (providerId, onInsert, onUpdate) => {
  const channel = supabase
    .channel(`provider-orders-${providerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `provider_id=eq.${providerId}`,
      },
      (payload) => {
        console.log('📨 New order for provider:', payload.new);
        if (onInsert) onInsert(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `provider_id=eq.${providerId}`,
      },
      (payload) => {
        console.log('📨 Provider order updated:', payload.new);
        if (onUpdate) onUpdate(payload.new, payload.old);
      }
    )
    .subscribe();

  return channel;
};

/**
 * Validate status transition
 * @param {string} currentStatus - Current order status
 * @param {string} newStatus - Proposed new status
 * @returns {boolean} - Whether transition is allowed
 */
export const isValidStatusTransition = (currentStatus, newStatus) => {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions && allowedTransitions.includes(newStatus);
};

