import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionUsage {
  id?: string;
  user_id?: string;
  plan_type: string;
  api_calls_used: number;
  api_calls_limit: number;
  billing_period_start: string;
  billing_period_end: string;
  overage_charges: number;
}

export async function getCurrentSubscriptionUsage(): Promise<SubscriptionUsage | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get current month's billing period
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data, error } = await supabase
    .from('subscription_usage')
    .select('*')
    .eq('user_id', user.id)
    .gte('billing_period_start', startOfMonth.toISOString().split('T')[0])
    .lte('billing_period_end', endOfMonth.toISOString().split('T')[0])
    .maybeSingle();

  if (error) throw error;
  
  // Create default usage record if none exists
  if (!data) {
    const defaultUsage = {
      user_id: user.id,
      plan_type: 'free',
      api_calls_used: 0,
      api_calls_limit: 1000,
      billing_period_start: startOfMonth.toISOString().split('T')[0],
      billing_period_end: endOfMonth.toISOString().split('T')[0],
      overage_charges: 0
    };

    const { data: newUsage, error: insertError } = await supabase
      .from('subscription_usage')
      .insert(defaultUsage)
      .select()
      .single();

    if (insertError) throw insertError;
    return newUsage;
  }

  return data;
}

export async function getBillingHistory() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('subscription_usage')
    .select('*')
    .eq('user_id', user.id)
    .order('billing_period_start', { ascending: false });

  if (error) throw error;
  return data || [];
}

export const PLAN_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    apiCalls: 1000,
    features: ['Basic risk analysis', 'Standard sanctions screening', 'Email support']
  },
  starter: {
    name: 'Starter',
    price: 29,
    apiCalls: 10000,
    features: ['Advanced risk analysis', 'Real-time monitoring', 'Priority support', 'Custom webhooks']
  },
  pro: {
    name: 'Professional',
    price: 99,
    apiCalls: 50000,
    features: ['Enterprise risk models', 'Advanced compliance reports', 'Dedicated support', 'Custom integrations', 'SLA guarantee']
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    apiCalls: -1, // unlimited
    features: ['Custom risk models', 'White-label solution', '24/7 phone support', 'On-premise deployment', 'Custom SLA']
  }
};