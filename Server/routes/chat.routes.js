/**
 * Chat Routes
 * API endpoints for YamiFit Chatbot
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const chatService = require('../services/chat.service');

/**
 * POST /api/chat
 * Send a message to the chatbot and get a response
 * 
 * Body: { message: string, attachments?: array, locale?: 'ar'|'en' }
 * Response: { userMessage: object, assistantMessage: object, history: array }
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { message, attachments = [], locale = 'en' } = req.body;
    const userId = req.userId;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.length > 4000) {
      return res.status(400).json({ error: 'Message too long (max 4000 characters)' });
    }

    // Get conversation history (this also cleans up expired messages)
    const history = await chatService.getChatHistory(userId, 40);

    // Save user message
    const userMsg = await chatService.saveMessage(userId, 'user', message.trim(), attachments);

    // Generate AI response
    const aiResponse = await chatService.generateResponse(message, history, locale);

    // Save assistant message
    const assistantMsg = await chatService.saveMessage(userId, 'assistant', aiResponse, []);

    // Get updated history
    const updatedHistory = await chatService.getChatHistory(userId, 40);

    res.json({
      success: true,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      history: updatedHistory
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * GET /api/chat/history
 * Get chat history for the authenticated user (last 24 hours)
 * 
 * Response: { history: array, expiresInfo: string }
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = Math.min(parseInt(req.query.limit) || 40, 100);

    const history = await chatService.getChatHistory(userId, limit);

    res.json({
      success: true,
      history,
      count: history.length,
      expiresInfo: 'Messages are kept for 24 hours'
    });
  } catch (error) {
    console.error('History error:', error.message);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

/**
 * DELETE /api/chat/history
 * Clear all chat history for the authenticated user
 * 
 * Response: { success: boolean }
 */
router.delete('/history', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    await chatService.clearChatHistory(userId);

    res.json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    console.error('Clear history error:', error.message);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

/**
 * POST /api/chat/cleanup
 * Trigger global cleanup of expired messages (admin/cron use)
 * This endpoint should be protected or called by scheduled jobs
 */
router.post('/cleanup', async (req, res) => {
  try {
    // Verify cleanup secret for security
    const cleanupSecret = req.headers['x-cleanup-secret'];
    if (cleanupSecret !== process.env.CLEANUP_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await chatService.globalCleanup();

    res.json({
      success: true,
      deleted: result.deleted,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cleanup error:', error.message);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

module.exports = router;
