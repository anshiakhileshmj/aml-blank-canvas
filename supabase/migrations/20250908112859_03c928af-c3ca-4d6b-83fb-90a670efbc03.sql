-- Create transactions table for the transactions page
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tx_hash text,
  from_address text NOT NULL,
  to_address text NOT NULL,
  amount numeric,
  currency text DEFAULT 'ETH',
  blockchain text DEFAULT 'ethereum',
  status text NOT NULL DEFAULT 'pending',
  risk_score integer DEFAULT 0,
  risk_level text,
  customer_name text,
  customer_id text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all transactions" 
ON public.transactions FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);