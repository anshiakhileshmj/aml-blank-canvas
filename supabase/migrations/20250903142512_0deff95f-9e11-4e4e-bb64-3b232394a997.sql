-- Create API keys table for managing user API keys
CREATE TABLE public.api_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_preview TEXT NOT NULL,
    environment TEXT NOT NULL DEFAULT 'production',
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id TEXT NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create API usage logs table
CREATE TABLE public.api_usage_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
    partner_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'POST',
    response_time_ms INTEGER,
    status_code INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for api_keys
CREATE POLICY "Users can view their own API keys"
ON public.api_keys
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
ON public.api_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
ON public.api_keys
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
ON public.api_keys
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for api_usage_logs
CREATE POLICY "Users can view their API usage logs"
ON public.api_usage_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.api_keys 
        WHERE api_keys.id = api_usage_logs.api_key_id 
        AND api_keys.user_id = auth.uid()
    )
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate partner ID
CREATE OR REPLACE FUNCTION public.generate_partner_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'partner_' || lower(substring(gen_random_uuid()::text, 1, 8));
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, partner_id, full_name, email)
    VALUES (
        NEW.id,
        public.generate_partner_id(),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.email, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log API usage
CREATE OR REPLACE FUNCTION public.log_api_usage(
    p_api_key_hash TEXT,
    p_endpoint TEXT,
    p_method TEXT DEFAULT 'POST',
    p_response_time_ms INTEGER DEFAULT NULL,
    p_status_code INTEGER DEFAULT 200
)
RETURNS VOID AS $$
DECLARE
    v_api_key_id UUID;
    v_partner_id TEXT;
BEGIN
    -- Find the API key and update usage count
    SELECT id, partner_id INTO v_api_key_id, v_partner_id
    FROM public.api_keys 
    WHERE key_hash = p_api_key_hash AND is_active = true;
    
    IF v_api_key_id IS NOT NULL THEN
        -- Update usage count and last used timestamp
        UPDATE public.api_keys 
        SET usage_count = usage_count + 1, last_used_at = now() 
        WHERE id = v_api_key_id;
        
        -- Log the usage
        INSERT INTO public.api_usage_logs (api_key_id, partner_id, endpoint, method, response_time_ms, status_code)
        VALUES (v_api_key_id, v_partner_id, p_endpoint, p_method, p_response_time_ms, p_status_code);
    END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to check API rate limits (placeholder for future enhancement)
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
    p_api_key_hash TEXT,
    p_limit_per_hour INTEGER DEFAULT 1000
)
RETURNS BOOLEAN AS $$
DECLARE
    v_usage_count INTEGER;
BEGIN
    -- Count usage in the last hour for this API key
    SELECT COUNT(*)
    INTO v_usage_count
    FROM public.api_usage_logs aul
    JOIN public.api_keys ak ON ak.id = aul.api_key_id
    WHERE ak.key_hash = p_api_key_hash 
    AND aul.created_at >= now() - interval '1 hour';
    
    RETURN v_usage_count < p_limit_per_hour;
END;
$$ LANGUAGE plpgsql SET search_path = public;