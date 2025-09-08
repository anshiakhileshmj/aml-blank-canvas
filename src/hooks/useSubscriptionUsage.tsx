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
        .single();

      if (usageError && usageError.code !== 'PGRST116') {
        throw usageError;
      }

      // Get user profile for plan info
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('subscription_plan, api_calls_limit')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get API usage for current month
      const { data: apiUsage, error: apiError } = await supabase
        .from('relay_logs')
        .select('id, created_at')
        .gte('created_at', startOfMonth.toISOString())
        .in('partner_id', 
          supabase
            .from('api_keys')
            .select('partner_id')
            .eq('user_id', user.id)
        );

      if (apiError) throw apiError;

      const currentUsage = usage || {
        api_calls_used: apiUsage?.length || 0,
        api_calls_limit: profile.api_calls_limit,
        transactions_processed: apiUsage?.length || 0,
      };

      return {
        ...currentUsage,
        subscription_plan: profile.subscription_plan,
        usage_percentage: (currentUsage.api_calls_used / currentUsage.api_calls_limit) * 100,
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}