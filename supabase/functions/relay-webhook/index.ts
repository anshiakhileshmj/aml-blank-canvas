import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-relay-key',
}

interface RelayTransactionData {
  from_address: string;
  to_address: string;
  amount?: number;
  currency?: string;
  blockchain?: string;
  tx_hash?: string;
  status: 'approved' | 'rejected' | 'pending';
  risk_level?: string;
  risk_score?: number;
  customer_name?: string;
  customer_id?: string;
  description?: string;
  partner_id?: string;
  api_key_hash?: string;
}

Deno.serve(async (req: Request) => {
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
    // Verify the relay API key
    const relayKey = req.headers.get('x-relay-key');
    const expectedRelayKey = Deno.env.get('RELAY_API_SECRET');
    
    if (!relayKey || relayKey !== expectedRelayKey) {
      console.error('Unauthorized relay request - invalid key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const transactionData: RelayTransactionData = await req.json();
    console.log('Received transaction data:', transactionData);

    // Find the user associated with this API key or partner ID
    let userId: string | null = null;

    if (transactionData.api_key_hash) {
      // Look up user by API key hash
      const { data: apiKey } = await supabase
        .from('api_keys')
        .select('user_id')
        .eq('key_hash', transactionData.api_key_hash)
        .single();

      if (apiKey) {
        userId = apiKey.user_id;
      }
    } else if (transactionData.partner_id) {
      // Look up user by partner ID
      const { data: profile } = await supabase
        .from('developer_profiles')
        .select('user_id')
        .eq('partner_id', transactionData.partner_id)
        .single();

      if (profile) {
        userId = profile.user_id;
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
    const { data: insertedTransaction, error: insertError } = await supabase
      .from('transactions')
      .insert(mappedTransaction)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting transaction:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert transaction', details: insertError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Successfully inserted transaction:', insertedTransaction.id);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_id: insertedTransaction.id,
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
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});