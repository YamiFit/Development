/**
 * YamiFit Chatbot Service
 * Handles AI chat interactions and message persistence
 * 
 * SECURITY: API key is only used server-side, never exposed to client
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../supabase');

// Initialize Gemini with server-side API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_CHAT_BOT_API_KEY);

// System prompt defining the chatbot's identity and behavior
const SYSTEM_PROMPT = `You are YamiFit Chatbot, an in-app professional nutrition and fitness coach for the YamiFit health and fitness application.

IDENTITY RULES (CRITICAL - NEVER BREAK):
- Your name is "YamiFit Chatbot"
- If asked "What is your name?" respond: "My name is YamiFit Chatbot."
- If asked about AI, models, how you work, or technical details, respond: "I'm YamiFit Chatbot, here to help with nutrition and workouts inside YamiFit."
- NEVER mention AI, machine learning, language models, Gemini, Google, APIs, or any technical implementation details
- NEVER say you are an AI assistant or chatbot powered by any technology
- You are simply the YamiFit Chatbot - an in-app coach

LANGUAGE BEHAVIOR:
- If the user writes in Arabic, respond entirely in Arabic
- If the user writes in English, respond entirely in English
- Match the user's language naturally

COACHING EXPERTISE:
- You specialize in nutrition planning, meal suggestions, and dietary advice
- You provide workout routines, exercise guidance, and fitness tips
- Give practical, actionable, step-by-step advice
- Be concise but thorough
- Encourage healthy habits and sustainable lifestyle changes
- Consider caloric intake, macronutrients, and timing of meals
- Suggest workouts appropriate for different fitness levels

SAFETY GUIDELINES:
- Provide general health and fitness advice only
- For medical conditions, pregnancy, minors, eating disorders, or severe symptoms, advise consulting a healthcare professional or clinician
- Do not diagnose conditions or prescribe treatments
- Do not provide advice that could be dangerous
- Recommend professional medical advice when appropriate

CONVERSATION STYLE:
- Be friendly, supportive, and motivational
- Use clear and simple language
- Break down complex topics into digestible pieces
- Ask clarifying questions when needed
- Celebrate user progress and encourage consistency`;

/**
 * Detect if text is primarily Arabic
 */
const isArabic = (text) => {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const arabicChars = (text.match(arabicPattern) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  return arabicChars / totalChars > 0.3;
};

/**
 * Clean up expired messages for a user
 */
const cleanupExpiredMessages = async (userId) => {
  try {
    const { error } = await supabase
      .from('chatbot_messages')
      .delete()
      .eq('user_id', userId)
      .lte('expires_at', new Date().toISOString());
    
    if (error) {
      console.error('Cleanup error:', error.message);
    }
  } catch (err) {
    console.error('Cleanup exception:', err.message);
  }
};

/**
 * Get chat history for a user (last 24 hours only)
 */
const getChatHistory = async (userId, limit = 40) => {
  // First cleanup expired messages
  await cleanupExpiredMessages(userId);
  
  const { data, error } = await supabase
    .from('chatbot_messages')
    .select('id, role, content, attachments, created_at')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Get history error:', error.message);
    return [];
  }
  
  return data || [];
};

/**
 * Save a message to the database
 */
const saveMessage = async (userId, role, content, attachments = []) => {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
  
  const { data, error } = await supabase
    .from('chatbot_messages')
    .insert({
      user_id: userId,
      role,
      content,
      attachments: attachments || [],
      expires_at: expiresAt
    })
    .select('id, role, content, attachments, created_at')
    .single();
  
  if (error) {
    console.error('Save message error:', error.message);
    throw new Error('Failed to save message');
  }
  
  return data;
};

/**
 * Generate AI response using the conversation history
 */
const generateResponse = async (userMessage, conversationHistory, locale) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    // Build conversation context
    const historyForContext = conversationHistory.slice(-20).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Start chat with history
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'System instructions: ' + SYSTEM_PROMPT }]
        },
        {
          role: 'model', 
          parts: [{ text: 'Understood. I am YamiFit Chatbot, ready to help with nutrition and fitness advice.' }]
        },
        ...historyForContext
      ],
    });

    // Add language hint if needed
    const languageHint = isArabic(userMessage) 
      ? '\n[Respond in Arabic]' 
      : locale === 'ar' 
        ? '\n[Respond in Arabic]' 
        : '';
    
    const result = await chat.sendMessage(userMessage + languageHint);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('AI generation error:', error.message);
    
    // Return fallback message based on detected language
    if (isArabic(userMessage)) {
      return 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.';
    }
    return 'Sorry, an error occurred. Please try again.';
  }
};

/**
 * Delete all messages for a user (for manual clear)
 */
const clearChatHistory = async (userId) => {
  const { error } = await supabase
    .from('chatbot_messages')
    .delete()
    .eq('user_id', userId);
  
  if (error) {
    console.error('Clear history error:', error.message);
    throw new Error('Failed to clear chat history');
  }
  
  return { success: true };
};

/**
 * Global cleanup of all expired messages (for scheduled jobs)
 */
const globalCleanup = async () => {
  const { data, error } = await supabase
    .from('chatbot_messages')
    .delete()
    .lte('expires_at', new Date().toISOString())
    .select('id');
  
  if (error) {
    console.error('Global cleanup error:', error.message);
    return { deleted: 0 };
  }
  
  return { deleted: data?.length || 0 };
};

module.exports = {
  getChatHistory,
  saveMessage,
  generateResponse,
  cleanupExpiredMessages,
  clearChatHistory,
  globalCleanup
};
