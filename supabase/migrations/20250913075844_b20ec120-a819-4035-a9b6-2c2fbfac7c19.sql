-- Create geographic_risk_data table for storing aggregated risk metrics by location
CREATE TABLE public.geographic_risk_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country text NOT NULL,
  region text,
  city text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  risk_score_avg numeric(5, 2) NOT NULL DEFAULT 0,
  total_transactions integer NOT NULL DEFAULT 0,
  blocked_transactions integer NOT NULL DEFAULT 0,
  allowed_transactions integer NOT NULL DEFAULT 0,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.geographic_risk_data ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (for dashboard visualization)
CREATE POLICY "Allow public read access to geographic risk data" 
ON public.geographic_risk_data 
FOR SELECT 
USING (true);

-- Create policy for service role full access
CREATE POLICY "Allow service role full access to geographic risk data" 
ON public.geographic_risk_data 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create indexes for efficient queries
CREATE INDEX idx_geographic_risk_data_country ON public.geographic_risk_data(country);
CREATE INDEX idx_geographic_risk_data_coordinates ON public.geographic_risk_data(latitude, longitude);
CREATE INDEX idx_geographic_risk_data_risk_score ON public.geographic_risk_data(risk_score_avg);
CREATE INDEX idx_geographic_risk_data_last_updated ON public.geographic_risk_data(last_updated);

-- Create unique constraint to prevent duplicate entries per location
CREATE UNIQUE INDEX idx_geographic_risk_data_unique_location 
ON public.geographic_risk_data(country, COALESCE(region, ''), COALESCE(city, ''));