import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const transactionData = await req.json();
    console.log('Received transaction data:', transactionData);

    // Find the user associated with this API key or partner ID
    let userId = null;

    if (transactionData.api_key_hash) {
      // Look up user by API key hash
      const response = await fetch(`${supabaseUrl}/rest/v1/api_keys?key_hash=eq.${transactionData.api_key_hash}&select=user_id`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const apiKeys = await response.json();
      if (apiKeys && apiKeys.length > 0) {
        userId = apiKeys[0].user_id;
      }
    } else if (transactionData.partner_id) {
      // Look up user by partner ID
      const response = await fetch(`${supabaseUrl}/rest/v1/developer_profiles?partner_id=eq.${transactionData.partner_id}&select=user_id`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      const profiles = await response.json();
      if (profiles && profiles.length > 0) {
        userId = profiles[0].user_id;
      }
    }

    if (!userId) {
      console.error('Could not find user for transaction:', {
        api_key_hash: transactionData.api_key_hash,
        partner_id: transactionData.partner_id
      });
      
      return new Response(
        JSON.stringify({ error: 'User not found for transaction' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Map relay transaction data to local transaction structure
    const mappedTransaction = {
      user_id: userId,
      from_address: transactionData.from_address,
      to_address: transactionData.to_address,
      amount: transactionData.amount || 0,
      currency: transactionData.currency || 'ETH',
      blockchain: transactionData.blockchain || 'ethereum',
      tx_hash: transactionData.tx_hash,
      status: transactionData.status,
      risk_level: transactionData.risk_level,
      risk_score: transactionData.risk_score || 0,
      customer_name: transactionData.customer_name,
      customer_id: transactionData.customer_id,
      description: transactionData.description || `Relay transaction via ${transactionData.partner_id || 'API'}`
    };

    console.log('Mapped transaction:', mappedTransaction);

    // Insert the transaction
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/transactions`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(mappedTransaction)
    });

    if (!insertResponse.ok) {
      const errorData = await insertResponse.json();
      console.error('Error inserting transaction:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to insert transaction', details: errorData }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const insertedTransaction = await insertResponse.json();
    console.log('Successfully inserted transaction:', insertedTransaction[0]?.id);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_id: insertedTransaction[0]?.id,
        message: 'Transaction logged successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing relay transaction:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});