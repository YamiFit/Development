/**
 * Supabase Edge Function: Chatbot Cleanup
 * 
 * This function deletes expired chatbot messages.
 * Schedule this function to run hourly using Supabase's cron scheduling.
 * 
 * To deploy:
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Link your project: supabase link --project-ref <your-project-ref>
 * 3. Deploy: supabase functions deploy chatbot-cleanup
 * 
 * To schedule (in Supabase Dashboard > Database > Extensions):
 * 1. Enable pg_cron extension
 * 2. Run: SELECT cron.schedule('chatbot-cleanup', '0 * * * *', 
 *    $$SELECT net.http_post(
 *      url := 'https://<project-ref>.supabase.co/functions/v1/chatbot-cleanup',
 *      headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
 *    )$$);
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Delete expired messages
    const { data, error } = await supabase
      .from('chatbot_messages')
      .delete()
      .lte('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      throw error
    }

    const deletedCount = data?.length || 0

    console.log(`Cleanup completed: ${deletedCount} expired messages deleted`)

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedCount,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Cleanup error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
