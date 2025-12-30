/**
 * useChatbot Hook
 * Manages chatbot state and interactions
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as chatService from '@/services/api/chatbot.service';

/**
 * Hook for managing chatbot state and interactions
 * @returns {Object} Chatbot state and methods
 */
export const useChatbot = () => {
  const { i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Load chat history on mount
   */
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    setError(null);

    try {
      const response = await chatService.getChatHistory(40);
      setMessages(response.history || []);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      // Don't show error for history load - just start fresh
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  /**
   * Send a message to the chatbot
   * @param {string} message - The user's message
   * @param {Array} attachments - Optional attachments
   */
  const sendMessage = useCallback(async (message, attachments = []) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Optimistically add user message
    const optimisticUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      attachments,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    setMessages(prev => [...prev, optimisticUserMsg]);

    try {
      const response = await chatService.sendChatMessage(
        message.trim(),
        attachments,
        i18n.language
      );

      // Replace optimistic message with real messages
      setMessages(response.history || []);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(i18n.language === 'ar' 
        ? 'فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.'
        : 'Failed to send message. Please try again.'
      );
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, i18n.language]);

  /**
   * Clear all chat history
   */
  const clearHistory = useCallback(async () => {
    try {
      await chatService.clearChatHistory();
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
      setError(i18n.language === 'ar'
        ? 'فشل في مسح المحادثة'
        : 'Failed to clear chat history'
      );
    }
  }, [i18n.language]);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load history on mount
  useEffect(() => {
    loadHistory();

    return () => {
      // Cleanup abort controller on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    clearHistory,
    loadHistory,
    messagesEndRef,
    scrollToBottom,
    setError,
  };
};

export default useChatbot;
