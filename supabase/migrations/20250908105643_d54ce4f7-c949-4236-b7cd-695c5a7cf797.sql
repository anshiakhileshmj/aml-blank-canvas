-- Phase 1.1: Fix Critical Security Vulnerabilities

-- Fix RLS policies for developer_profiles - should only allow users to see their own profile
DROP POLICY IF EXISTS "Users can manage their own developer profile" ON developer_profiles;
CREATE POLICY "Users can view their own developer profile" 
ON developer_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own developer profile" 
ON developer_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own developer profile" 
ON developer_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Fix RLS policies for api_keys - ensure only owners can manage their keys
DROP POLICY IF EXISTS "Users can manage their own API keys" ON api_keys;
CREATE POLICY "Users can view their own API keys" 
ON api_keys FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" 
ON api_keys FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
ON api_keys FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
ON api_keys FOR DELETE 
USING (auth.uid() = user_id);

-- Fix RLS policies for api_usage - users can only view usage for their keys
DROP POLICY IF EXISTS "Users can view their own API usage" ON api_usage;
CREATE POLICY "Users can view their own API usage" 
ON api_usage FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM api_keys 
  WHERE api_keys.id = api_usage.api_key_id 
  AND api_keys.user_id = auth.uid()
));

-- Service role can manage api_usage for logging
CREATE POLICY "Service role can manage API usage" 
ON api_usage FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Restrict tracked_wallets to prevent unauthorized modifications
DROP POLICY IF EXISTS "Allow public delete access to tracked wallets" ON tracked_wallets;
DROP POLICY IF EXISTS "Allow public insert access to tracked wallets" ON tracked_wallets;
DROP POLICY IF EXISTS "Allow public update access to tracked wallets" ON tracked_wallets;
DROP POLICY IF EXISTS "Allow public read access to tracked wallets" ON tracked_wallets;

-- Only allow service role to manage tracked wallets for security
CREATE POLICY "Service role can manage tracked wallets" 
ON tracked_wallets FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Users can only view tracked wallets
CREATE POLICY "Users can view tracked wallets" 
ON tracked_wallets FOR SELECT 
USING (true);

-- Fix database function search paths for security
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(api_key_hash text, endpoint text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  key_record RECORD;
  usage_count INTEGER;
  rate_limit INTEGER;
BEGIN
  -- Get API key details
  SELECT * INTO key_record 
  FROM public.api_keys 
  WHERE key_hash = api_key_hash AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now());
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get rate limit for this key
  rate_limit := key_record.rate_limit_per_minute;
  
  -- Count usage in the last minute
  SELECT COUNT(*) INTO usage_count
  FROM public.api_usage
  WHERE api_key_id = key_record.id 
    AND endpoint = check_api_rate_limit.endpoint
    AND timestamp > now() - interval '1 minute';
  
  -- Update last_used_at
  UPDATE public.api_keys 
  SET last_used_at = now() 
  WHERE id = key_record.id;
  
  RETURN usage_count < rate_limit;
END;
$function$;

-- Update log_api_usage function with proper search path
CREATE OR REPLACE FUNCTION public.log_api_usage(api_key_hash text, endpoint_path text, ip_addr text, status_code integer, response_time_ms integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  key_id uuid;
BEGIN
  -- Get API key ID
  SELECT id INTO key_id 
  FROM public.api_keys 
  WHERE key_hash = api_key_hash;
  
  IF FOUND THEN
    INSERT INTO public.api_usage (api_key_id, endpoint, ip_address, status_code, response_time_ms)
    VALUES (key_id, endpoint_path, ip_addr, status_code, response_time_ms);
  END IF;
END;
$function$;

-- Create user_settings table for production settings management
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_preferences jsonb DEFAULT '{"email": true, "push": false, "alerts": true}'::jsonb,
  security_settings jsonb DEFAULT '{"twoFactorEnabled": false, "sessionTimeout": 30}'::jsonb,
  display_preferences jsonb DEFAULT '{"theme": "system", "language": "en"}'::jsonb,
  api_preferences jsonb DEFAULT '{"defaultRateLimit": 60, "webhooksEnabled": false}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_settings
CREATE POLICY "Users can manage their own settings" 
ON public.user_settings FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create subscription_usage table for billing
CREATE TABLE IF NOT EXISTS public.subscription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL DEFAULT 'free',
  api_calls_used integer DEFAULT 0,
  api_calls_limit integer DEFAULT 1000,
  billing_period_start date NOT NULL,
  billing_period_end date NOT NULL,
  overage_charges numeric(10,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on subscription_usage
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_usage
CREATE POLICY "Users can view their own subscription usage" 
ON public.subscription_usage FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscription usage" 
ON public.subscription_usage FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_types text[] DEFAULT ARRAY['high_risk', 'sanctions', 'api_limit'],
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT false,
  webhook_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on notification_settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_settings
CREATE POLICY "Users can manage their own notification settings" 
ON public.notification_settings FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);