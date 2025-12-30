# YamiFit Chatbot - 24-Hour Chat Persistence

## Overview

YamiFit Chatbot is an in-app professional nutrition and fitness coaching assistant. It provides personalized advice while maintaining chat history for exactly 24 hours before automatic deletion.

## Features

- **Professional Coaching**: Nutrition and fitness advice from an AI-powered coach
- **24-Hour Persistence**: Chat history stored in Supabase, auto-deleted after 24 hours
- **Bilingual Support**: Automatically responds in Arabic or English based on user input
- **Secure Architecture**: API key stored server-side only, never exposed to browser
- **Per-User Privacy**: Each user sees only their own chat history (RLS enforced)

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Express API   │────▶│   Supabase DB   │
│   (React)       │     │   (Node.js)     │     │   (PostgreSQL)  │
│                 │     │                 │     │                 │
│  - Chat UI      │     │  - Auth check   │     │  - RLS policies │
│  - useChatbot   │     │  - Gemini API   │     │  - Auto-cleanup │
│  - API calls    │     │  - Message CRUD │     │  - 24h expiry   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Security

### API Key Protection
- The Google Gemini API key (`GOOGLE_CHAT_BOT_API_KEY`) is stored ONLY in the server's `.env` file
- The frontend `.env.local` does NOT contain this key
- The browser never has access to the API key

### Row Level Security (RLS)
- Users can only SELECT their own non-expired messages
- Users can only INSERT messages with their own user_id
- Users can only DELETE their own messages
- No UPDATE policy (immutable messages)

## Database Schema

### Table: `chatbot_messages`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| role | VARCHAR(20) | 'user' or 'assistant' |
| content | TEXT | Message content (max 8000 chars) |
| attachments | JSONB | Optional file attachments |
| created_at | TIMESTAMPTZ | When message was created |
| expires_at | TIMESTAMPTZ | When message expires (created_at + 24h) |

### Indexes
- `(user_id, created_at DESC)` - For fetching user's history
- `(expires_at)` - For cleanup queries
- `(user_id, expires_at)` - For filtering expired messages

## 24-Hour Retention Flow

### How Deletion is Guaranteed

1. **Lazy Cleanup (On Every Insert)**
   - A trigger fires after each new message
   - Deletes expired messages for that user
   - Ensures active users always have clean history

2. **Query-Time Filtering**
   - RLS policy includes `expires_at > NOW()`
   - Even if cleanup hasn't run, expired messages are invisible

3. **Scheduled Cleanup (Choose One)**

   **Option A: pg_cron (Recommended)**
   ```sql
   -- Enable pg_cron in Supabase Dashboard > Database > Extensions
   SELECT cron.schedule(
     'cleanup-expired-chatbot-messages',
     '0 * * * *',  -- Every hour
     $$DELETE FROM public.chatbot_messages WHERE expires_at <= NOW()$$
   );
   ```

   **Option B: Supabase Edge Function**
   ```bash
   # Deploy the edge function
   supabase functions deploy chatbot-cleanup
   
   # Schedule via pg_cron to call the function
   SELECT cron.schedule(
     'chatbot-cleanup-job',
     '0 * * * *',
     $$SELECT net.http_post(
       url := 'https://<project-ref>.supabase.co/functions/v1/chatbot-cleanup',
       headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
     )$$
   );
   ```

   **Option C: External Cron Service**
   ```bash
   # Call the cleanup endpoint every hour
   curl -X POST https://your-server.com/api/chat/cleanup \
     -H "X-Cleanup-Secret: your-cleanup-secret"
   ```

## API Endpoints

### POST /api/chat
Send a message and receive a response.

**Request:**
```json
{
  "message": "What should I eat before a workout?",
  "attachments": [],
  "locale": "en"
}
```

**Response:**
```json
{
  "success": true,
  "userMessage": { "id": "...", "role": "user", "content": "...", "created_at": "..." },
  "assistantMessage": { "id": "...", "role": "assistant", "content": "...", "created_at": "..." },
  "history": [...]
}
```

### GET /api/chat/history
Fetch chat history (last 24 hours).

**Response:**
```json
{
  "success": true,
  "history": [...],
  "count": 15,
  "expiresInfo": "Messages are kept for 24 hours"
}
```

### DELETE /api/chat/history
Clear all chat history for the user.

## Setup Instructions

### 1. Database Setup

Run the migration in Supabase SQL Editor:
```bash
# Option 1: Full schema
psql -f Server/schema.sql

# Option 2: Just the chatbot migration
psql -f Server/migrations/006_chatbot_messages.sql
```

### 2. Server Setup

```bash
cd Server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your actual keys

# Start server
npm run dev
```

### 3. Client Setup

```bash
cd Client

# Environment is already configured
# VITE_API_BASE_URL points to your server

# Start client
npm run dev
```

### 4. Enable Scheduled Cleanup

In Supabase Dashboard:
1. Go to Database > Extensions
2. Enable `pg_cron`
3. Run the scheduling SQL from the "Scheduled Cleanup" section above

## Chatbot Identity Rules

The chatbot is configured to:
- Identify as "YamiFit Chatbot"
- Never reveal it's AI-powered or mention technical details
- Respond in the user's language (Arabic/English)
- Provide nutrition and fitness coaching only
- Recommend medical professionals for serious conditions

## Files Created

```
Server/
├── index.js                     # Express server entry
├── middleware/
│   └── auth.middleware.js       # JWT verification
├── routes/
│   └── chat.routes.js           # Chat API endpoints
├── services/
│   └── chat.service.js          # Business logic + Gemini
├── migrations/
│   └── 006_chatbot_messages.sql # Database migration
└── supabase/functions/
    └── chatbot-cleanup/         # Edge function for cleanup

Client/
├── src/components/Chatbot/
│   ├── index.js
│   └── YamiFitChatbot.jsx       # Chat UI component
├── src/services/api/
│   └── chatbot.service.js       # API client
├── src/hooks/
│   └── useChatbot.js            # React hook for chat state
└── src/locales/
    ├── en.json                  # English translations (updated)
    └── ar.json                  # Arabic translations (updated)
```

## Testing

1. Open the app and log in
2. Click the green chat bubble (bottom right/left based on RTL)
3. Send a message about nutrition or fitness
4. Refresh the page - history should persist
5. Wait 24 hours (or manually update `expires_at` in DB) - history should disappear

## Troubleshooting

### Chat not loading?
- Check if server is running on port 3001
- Verify `VITE_API_BASE_URL` in Client/.env.local
- Check browser console for CORS errors

### Messages not persisting?
- Verify Supabase connection in Server/.env
- Check RLS policies are correctly applied
- Ensure user is authenticated

### Cleanup not working?
- Verify pg_cron is enabled
- Check scheduled job is running: `SELECT * FROM cron.job`
- Manually test: `SELECT public.cleanup_expired_chatbot_messages()`
