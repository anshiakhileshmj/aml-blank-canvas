import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse request body
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting deletion process for user: ${userId}`);

    // Delete user data in correct order (child tables first, then parent tables)
    
    // 1. Delete API usage records (get API key IDs first)
    const { data: apiKeys } = await supabaseServiceRole
      .from('api_keys')
      .select('id')
      .eq('user_id', userId);

    if (apiKeys && apiKeys.length > 0) {
      const apiKeyIds = apiKeys.map(key => key.id);
      const { error: apiUsageError } = await supabaseServiceRole
        .from('api_usage')
        .delete()
        .in('api_key_id', apiKeyIds);

      if (apiUsageError) {
        console.error('Error deleting API usage:', apiUsageError);
      }
    }

    // 2. Delete API keys
    const { error: apiKeysError } = await supabaseServiceRole
      .from('api_keys')
      .delete()
      .eq('user_id', userId);

    if (apiKeysError) {
      console.error('Error deleting API keys:', apiKeysError);
    }

    // 3. Delete notifications
    const { error: notificationsError } = await supabaseServiceRole
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (notificationsError) {
      console.error('Error deleting notifications:', notificationsError);
    }

    // 4. Delete notification settings
    const { error: notificationSettingsError } = await supabaseServiceRole
      .from('notification_settings')
      .delete()
      .eq('user_id', userId);

    if (notificationSettingsError) {
      console.error('Error deleting notification settings:', notificationSettingsError);
    }

    // 5. Delete transactions
    const { error: transactionsError } = await supabaseServiceRole
      .from('transactions')
      .delete()
      .eq('user_id', userId);

    if (transactionsError) {
      console.error('Error deleting transactions:', transactionsError);
    }

    // 6. Delete subscription usage
    const { error: subscriptionUsageError } = await supabaseServiceRole
      .from('subscription_usage')
      .delete()
      .eq('user_id', userId);

    if (subscriptionUsageError) {
      console.error('Error deleting subscription usage:', subscriptionUsageError);
    }

    // 7. Delete user settings
    const { error: userSettingsError } = await supabaseServiceRole
      .from('user_settings')
      .delete()
      .eq('user_id', userId);

    if (userSettingsError) {
      console.error('Error deleting user settings:', userSettingsError);
    }

    // 8. Delete developer profile
    const { error: developerProfileError } = await supabaseServiceRole
      .from('developer_profiles')
      .delete()
      .eq('user_id', userId);

    if (developerProfileError) {
      console.error('Error deleting developer profile:', developerProfileError);
    }

    // 9. Delete user from auth.users using admin API
    const { error: authDeleteError } = await supabaseServiceRole.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error('Error deleting user from auth:', authDeleteError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete user account',
          details: authDeleteError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Successfully deleted all data for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User account and all data deleted successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in delete-user-account function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});