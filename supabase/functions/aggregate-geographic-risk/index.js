import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting geographic risk data aggregation...');

    // Step 1: Fetch relay logs with geo data from the last 30 days
    const { data: relayLogs, error: relayError } = await supabase
      .from('relay_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (relayError) {
      console.error('Error fetching relay logs:', relayError);
      throw relayError;
    }

    // Step 2: Fetch transactions with geo data from the last 30 days
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .not('geo_data', 'is', null)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (txError) {
      console.error('Error fetching transactions:', txError);
      throw txError;
    }

    console.log(`Processing ${relayLogs?.length || 0} relay logs and ${transactions?.length || 0} transactions`);

    // Step 3: Aggregate data by location
    const locationMap = new Map();

    // Process relay logs
    if (relayLogs) {
      for (const log of relayLogs) {
        // For relay logs, we need to infer location from IP or other available data
        // Since relay logs don't have geo_data directly, we'll use a default approach
        const country = 'Unknown'; // In a real implementation, you'd extract this from IP
        const key = `${country}||`;
        
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            country,
            region: null,
            city: null,
            latitude: null,
            longitude: null,
            totalTransactions: 0,
            blockedTransactions: 0,
            allowedTransactions: 0,
            riskScores: []
          });
        }

        const location = locationMap.get(key);
        location.totalTransactions++;
        location.riskScores.push(log.risk_score || 0);
        
        if (log.decision === 'BLOCK') {
          location.blockedTransactions++;
        } else if (log.decision === 'ALLOW') {
          location.allowedTransactions++;
        }
      }
    }

    // Process transactions with geo data
    if (transactions) {
      for (const tx of transactions) {
        if (tx.geo_data && typeof tx.geo_data === 'object') {
          const geoData = tx.geo_data;
          const country = geoData.country || 'Unknown';
          const region = geoData.region || geoData.regionName || null;
          const city = geoData.city || null;
          const latitude = geoData.lat || geoData.latitude || null;
          const longitude = geoData.lon || geoData.longitude || null;
          
          const key = `${country}|${region || ''}|${city || ''}`;
          
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              country,
              region,
              city,
              latitude: latitude ? parseFloat(latitude) : null,
              longitude: longitude ? parseFloat(longitude) : null,
              totalTransactions: 0,
              blockedTransactions: 0,
              allowedTransactions: 0,
              riskScores: []
            });
          }

          const location = locationMap.get(key);
          location.totalTransactions++;
          location.riskScores.push(tx.risk_score || 0);
          
          if (tx.status === 'blocked' || tx.status === 'flagged') {
            location.blockedTransactions++;
          } else if (tx.status === 'completed') {
            location.allowedTransactions++;
          }
        }
      }
    }

    console.log(`Aggregated data for ${locationMap.size} unique locations`);

    // Step 4: Prepare data for database insertion
    const aggregatedData = [];
    for (const [key, location] of locationMap) {
      const avgRiskScore = location.riskScores.length > 0 
        ? location.riskScores.reduce((a, b) => a + b, 0) / location.riskScores.length 
        : 0;

      aggregatedData.push({
        country: location.country,
        region: location.region,
        city: location.city,
        latitude: location.latitude,
        longitude: location.longitude,
        risk_score_avg: Math.round(avgRiskScore * 100) / 100, // Round to 2 decimal places
        total_transactions: location.totalTransactions,
        blocked_transactions: location.blockedTransactions,
        allowed_transactions: location.allowedTransactions,
        last_updated: new Date().toISOString()
      });
    }

    // Step 5: Clear existing data and insert new aggregated data
    if (aggregatedData.length > 0) {
      // Delete old data (older than current aggregation)
      const { error: deleteError } = await supabase
        .from('geographic_risk_data')
        .delete()
        .lt('last_updated', new Date().toISOString());

      if (deleteError) {
        console.error('Error deleting old data:', deleteError);
      }

      // Insert new aggregated data
      const { error: insertError } = await supabase
        .from('geographic_risk_data')
        .upsert(aggregatedData, {
          onConflict: 'country,region,city',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error('Error inserting aggregated data:', insertError);
        throw insertError;
      }

      console.log(`Successfully updated ${aggregatedData.length} geographic risk records`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${aggregatedData.length} locations`,
        locationsProcessed: aggregatedData.length,
        totalTransactions: aggregatedData.reduce((sum, loc) => sum + loc.total_transactions, 0)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in aggregate-geographic-risk function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});