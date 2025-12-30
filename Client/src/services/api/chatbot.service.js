/**
 * YamiFit Chatbot Service
 * Frontend API calls for the chatbot feature
 */

import { supabase } from '@/supabaseClient';

// Server API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Get the current auth token
 */
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

/**
 * Make an authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

/**
 * Send a message to the chatbot
 * @param {string} message - The user's message
 * @param {Array} attachments - Optional attachments
 * @param {string} locale - Current locale ('en' or 'ar')
 * @returns {Promise<{userMessage, assistantMessage, history}>}
 */
export const sendChatMessage = async (message, attachments = [], locale = 'en') => {
  return apiRequest('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, attachments, locale }),
  });
};

/**
 * Get chat history for the current user
 * @param {number} limit - Maximum number of messages to retrieve
 * @returns {Promise<{history, count, expiresInfo}>}
 */
export const getChatHistory = async (limit = 40) => {
  return apiRequest(`/api/chat/history?limit=${limit}`);
};

/**
 * Clear all chat history for the current user
 * @returns {Promise<{success, message}>}
 */
export const clearChatHistory = async () => {
  return apiRequest('/api/chat/history', {
    method: 'DELETE',
  });
};

/**
 * Get chat history directly from Supabase (fallback/alternative)
 * This uses RLS policies for security
 */
export const getChatHistoryDirect = async (limit = 40) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  // First delete expired messages
  await supabase
    .from('chatbot_messages')
    .delete()
    .eq('user_id', user.id)
    .lte('expires_at', new Date().toISOString());

  // Then fetch non-expired messages
  const { data, error } = await supabase
    .from('chatbot_messages')
    .select('id, role, content, attachments, created_at')
    .eq('user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return { history: data || [], count: data?.length || 0 };
};
