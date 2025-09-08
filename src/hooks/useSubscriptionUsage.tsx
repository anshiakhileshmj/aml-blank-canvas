import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useSubscriptionUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription-usage', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get current month's usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: usage, error: usageError } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('billing_period_start', startOfMonth.toISOString().split('T')[0])
        .maybeSingle();

      if (usageError) {
        throw usageError;
      }

      // Get user profile for plan info
      const { data: profile, error: profileError } = await supabase
        .from('developer_profiles')
        .select('api_usage_plan, monthly_request_limit')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Get API usage for current month
      const { data: apiKeys, error: keysError } = await supabase
        .from('api_keys')
        .select('partner_id')
        .eq('user_id', user.id);

      if (keysError) throw keysError;

      const partnerIds = apiKeys?.map(key => key.partner_id).filter(Boolean) || [];
      
      let apiUsage: any[] = [];
      if (partnerIds.length > 0) {
        const { data: relayData, error: apiError } = await supabase
          .from('relay_logs')
          .select('id, created_at')
          .gte('created_at', startOfMonth.toISOString())
          .in('partner_id', partnerIds);

        if (apiError) throw apiError;
        apiUsage = relayData || [];
      }

      const currentUsage = usage || {
        api_calls_used: apiUsage.length || 0,
        api_calls_limit: profile?.monthly_request_limit || 1000,
        transactions_processed: apiUsage.length || 0,
      };

      return {
        ...currentUsage,
        subscription_plan: profile?.api_usage_plan || 'free',
        usage_percentage: ((currentUsage.api_calls_used || 0) / (currentUsage.api_calls_limit || 1000)) * 100,
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}