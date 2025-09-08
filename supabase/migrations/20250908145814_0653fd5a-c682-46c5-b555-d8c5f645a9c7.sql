-- Fix RLS policy for subscription_usage to allow user inserts
DROP POLICY IF EXISTS "Users can view their own subscription usage" ON subscription_usage;
DROP POLICY IF EXISTS "Service role can manage subscription usage" ON subscription_usage;

-- Create proper RLS policies for subscription_usage
CREATE POLICY "Users can manage their own subscription usage" 
ON subscription_usage 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscription usage" 
ON subscription_usage 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);